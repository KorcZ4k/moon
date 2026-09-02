// back.js - Backend (Node.js + Express + MongoDB)
// Servidor API para Korczak Technologies

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { get } = require('express/lib/response');

// ===================== CONFIGURAÇÕES =====================
const app = express();
const PORT = process.env.PORT || 3000;

// ===================== MIDDLEWARES =====================
app.use(cors({
    origin: '*', // Em produção, restrinja para domínios específicos
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===================== CONEXÃO COM MONGODB =====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Korczak:Exceto1%7C@korczakcluster.hkaipeg.mongodb.net/';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('✅ Conectado ao MongoDB com sucesso!');
    console.log(`📦 Banco de dados: ${mongoose.connection.name}`);
    console.log(`📍 Host: ${mongoose.connection.host}`);
})
.catch((err) => {
    console.error('❌ Erro ao conectar ao MongoDB:', err.message);
    console.log('⚠️ Servidor iniciará em modo fallback (sem banco de dados)');
});

// ===================== SCHEMA E MODEL =====================
const orcamentoSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true,
        minlength: [2, 'Nome deve ter pelo menos 2 caracteres'],
        maxlength: [100, 'Nome deve ter no máximo 100 caracteres']
    },
    email: {
        type: String,
        required: [true, 'E-mail é obrigatório'],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'E-mail inválido']
    },
    telefone: {
        type: String,
        trim: true,
        default: '',
        match: [/^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/, 'Telefone inválido']
    },
    servico: {
        type: String,
        required: [true, 'Serviço é obrigatório'],
        enum: ['desenvolvimento-web', 'banco-dados-api', 'servicos-sociais', 'landing-page', 'outro'],
        default: 'outro'
    },
    mensagem: {
        type: String,
        trim: true,
        maxlength: [2000, 'Mensagem deve ter no máximo 2000 caracteres'],
        default: ''
    },
    status: {
        type: String,
        enum: ['pendente', 'em-analise', 'respondido', 'arquivado'],
        default: 'pendente'
    },
    ip: {
        type: String,
        default: ''
    },
    userAgent: {
        type: String,
        default: ''
    }
}, {
    timestamps: true // Cria automaticamente createdAt e updatedAt
});

// Índices para otimização
orcamentoSchema.index({ email: 1 });
orcamentoSchema.index({ status: 1 });
orcamentoSchema.index({ createdAt: -1 });

// Middleware pré-save
orcamentoSchema.pre('save', function(next) {
    if (this.isNew) {
        console.log(`📝 Novo orçamento de ${this.nome} (${this.email})`);
    }
    next();
});

// Modelo
const Orcamento = mongoose.model('Orcamento', orcamentoSchema);

// ===================== ROTAS DA API =====================

// Rota raiz
app.get('/', (req, res) => {
    res.json({
        nome: 'Korczak Technologies API',
        versao: '2.0.0',
        status: 'online',
        endpoints: {
            orcamentos: {
                listar: 'GET /api/orcamentos',
                criar: 'POST /api/orcamentos',
                buscar: 'GET /api/orcamentos/:id',
                atualizar: 'PUT /api/orcamentos/:id',
                deletar: 'DELETE /api/orcamentos/:id',
                status: 'PATCH /api/orcamentos/:id/status'
            },
            estatisticas: 'GET /api/estatisticas',
            saude: 'GET /api/saude'
        },
        documentacao: 'https://github.com/korczak/backend'
    });
});

// Rota de saúde
app.get('/api/saude', (req, res) => {
    const estadoMongo = mongoose.connection.readyState;
    const estados = {
        0: 'desconectado',
        1: 'conectado',
        2: 'conectando',
        3: 'desconectando'
    };
    
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        servico: 'Korczak Technologies API',
        mongo: {
            estado: estados[estadoMongo] || 'desconhecido',
            readyState: estadoMongo,
            conectado: estadoMongo === 1
        },
        ambiente: process.env.NODE_ENV || 'development'
    });
});

// ===== CRUD ORÇAMENTOS =====

// 1. Criar orçamento (POST)
app.post('/api/orcamentos', async (req, res) => {
    try {
        const { nome, email, telefone, servico, mensagem } = req.body;

        // Validações manuais
        if (!nome || nome.length < 2) {
            return res.status(400).json({
                sucesso: false,
                erro: 'Nome deve ter pelo menos 2 caracteres'
            });
        }

        if (!email || !email.includes('@')) {
            return res.status(400).json({
                sucesso: false,
                erro: 'E-mail inválido'
            });
        }

        // Cria documento
        const novoOrcamento = new Orcamento({
            nome: nome.trim(),
            email: email.trim().toLowerCase(),
            telefone: telefone ? telefone.trim() : '',
            servico: servico || 'outro',
            mensagem: mensagem ? mensagem.trim() : '',
            status: 'pendente',
            ip: req.ip || req.connection.remoteAddress || '',
            userAgent: req.headers['user-agent'] || ''
        });

        // Salva no banco
        const orcamentoSalvo = await novoOrcamento.save();

        // Resposta
        res.status(201).json({
            sucesso: true,
            mensagem: 'Orçamento enviado com sucesso!',
            dados: {
                id: orcamentoSalvo._id,
                nome: orcamentoSalvo.nome,
                email: orcamentoSalvo.email,
                servico: orcamentoSalvo.servico,
                status: orcamentoSalvo.status,
                dataCriacao: orcamentoSalvo.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Erro ao salvar orçamento:', error);

        if (error.name === 'ValidationError') {
            const erros = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                sucesso: false,
                erro: 'Erro de validação',
                detalhes: erros
            });
        }

        res.status(500).json({
            sucesso: false,
            erro: 'Erro interno ao processar orçamento',
            mensagem: process.env.NODE_ENV === 'development' ? error.message : 'Tente novamente mais tarde'
        });
    }
});

// 2. Listar orçamentos (GET) com paginação
app.get('/api/orcamentos', async (req, res) => {
    try {
        const { pagina = 1, limite = 10, status, servico, ordenar = '-createdAt' } = req.query;

        const paginaNum = parseInt(pagina);
        const limiteNum = parseInt(limite);
        const skip = (paginaNum - 1) * limiteNum;

        // Filtros
        const filtros = {};
        if (status) filtros.status = status;
        if (servico) filtros.servico = servico;

        // Busca
        const orcamentos = await Orcamento
            .find(filtros)
            .sort(ordenar)
            .skip(skip)
            .limit(limiteNum)
            .lean();

        const total = await Orcamento.countDocuments(filtros);
        const totalPaginas = Math.ceil(total / limiteNum);

        res.json({
            sucesso: true,
            dados: orcamentos,
            paginacao: {
                pagina: paginaNum,
                limite: limiteNum,
                total,
                totalPaginas,
                temProxima: paginaNum < totalPaginas,
                temAnterior: paginaNum > 1
            }
        });

    } catch (error) {
        console.error('❌ Erro ao listar orçamentos:', error);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro ao buscar orçamentos',
            mensagem: error.message
        });
    }
});

// 3. Buscar orçamento por ID (GET)
app.get('/api/orcamentos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                sucesso: false,
                erro: 'ID inválido'
            });
        }

        const orcamento = await Orcamento.findById(id).lean();

        if (!orcamento) {
            return res.status(404).json({
                sucesso: false,
                erro: 'Orçamento não encontrado'
            });
        }

        res.json({
            sucesso: true,
            dados: orcamento
        });

    } catch (error) {
        console.error('❌ Erro ao buscar orçamento:', error);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro ao buscar orçamento',
            mensagem: error.message
        });
    }
});

// 4. Atualizar orçamento (PUT)
app.put('/api/orcamentos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, telefone, servico, mensagem, status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                sucesso: false,
                erro: 'ID inválido'
            });
        }

        const atualizacao = {};
        if (nome) atualizacao.nome = nome.trim();
        if (email) atualizacao.email = email.trim().toLowerCase();
        if (telefone !== undefined) atualizacao.telefone = telefone.trim();
        if (servico) atualizacao.servico = servico;
        if (mensagem !== undefined) atualizacao.mensagem = mensagem.trim();
        if (status) atualizacao.status = status;

        const orcamentoAtualizado = await Orcamento.findByIdAndUpdate(
            id,
            atualizacao,
            { new: true, runValidators: true }
        ).lean();

        if (!orcamentoAtualizado) {
            return res.status(404).json({
                sucesso: false,
                erro: 'Orçamento não encontrado'
            });
        }

        res.json({
            sucesso: true,
            mensagem: 'Orçamento atualizado com sucesso',
            dados: orcamentoAtualizado
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar orçamento:', error);
        
        if (error.name === 'ValidationError') {
            const erros = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                sucesso: false,
                erro: 'Erro de validação',
                detalhes: erros
            });
        }

        res.status(500).json({
            sucesso: false,
            erro: 'Erro ao atualizar orçamento',
            mensagem: error.message
        });
    }
});

// 5. Deletar orçamento (DELETE)
app.delete('/api/orcamentos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                sucesso: false,
                erro: 'ID inválido'
            });
        }

        const orcamentoDeletado = await Orcamento.findByIdAndDelete(id);

        if (!orcamentoDeletado) {
            return res.status(404).json({
                sucesso: false,
                erro: 'Orçamento não encontrado'
            });
        }

        res.json({
            sucesso: true,
            mensagem: 'Orçamento deletado com sucesso',
            dados: {
                id: orcamentoDeletado._id,
                nome: orcamentoDeletado.nome
            }
        });

    } catch (error) {
        console.error('❌ Erro ao deletar orçamento:', error);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro ao deletar orçamento',
            mensagem: error.message
        });
    }
});

// 6. Atualizar status (PATCH)
app.patch('/api/orcamentos/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const statusValidos = ['pendente', 'em-analise', 'respondido', 'arquivado'];
        if (!status || !statusValidos.includes(status)) {
            return res.status(400).json({
                sucesso: false,
                erro: `Status inválido. Use: ${statusValidos.join(', ')}`
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                sucesso: false,
                erro: 'ID inválido'
            });
        }

        const orcamentoAtualizado = await Orcamento.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).lean();

        if (!orcamentoAtualizado) {
            return res.status(404).json({
                sucesso: false,
                erro: 'Orçamento não encontrado'
            });
        }

        res.json({
            sucesso: true,
            mensagem: 'Status atualizado com sucesso',
            dados: {
                id: orcamentoAtualizado._id,
                status: orcamentoAtualizado.status
            }
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar status:', error);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro ao atualizar status',
            mensagem: error.message
        });
    }
});

// 7. Estatísticas
app.get('/api/estatisticas', async (req, res) => {
    try {
        const total = await Orcamento.countDocuments();
        
        const porStatus = await Orcamento.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const porServico = await Orcamento.aggregate([
            { $group: { _id: '$servico', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const ultimos30Dias = await Orcamento.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        const hoje = await Orcamento.countDocuments({
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        });

        res.json({
            sucesso: true,
            dados: {
                total,
                hoje,
                ultimos30Dias,
                porStatus,
                porServico
            }
        });

    } catch (error) {
        console.error('❌ Erro ao gerar estatísticas:', error);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro ao gerar estatísticas',
            mensagem: error.message
        });
    }
});

// ===================== TRATAMENTO DE ERROS =====================

// 404 - Rota não encontrada
app.use((req, res) => {
    res.status(404).json({
        sucesso: false,
        erro: 'Rota não encontrada',
        rota: req.originalUrl
    });
});

// Middleware de erro global
app.use((err, req, res, next) => {
    console.error('❌ Erro não tratado:', err);
    res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        mensagem: process.env.NODE_ENV === 'development' ? err.message : 'Ocorreu um erro inesperado'
    });
});

// ===================== INICIAR SERVIDOR =====================
app.listen(PORT, () => {
    console.log('=================================');
    console.log(`🚀 Servidor Korczak Technologies`);
    console.log(`📍 Rodando em: http://localhost:${PORT}`);
    console.log(`🌐 API: http://localhost:${PORT}/api`);
    console.log(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  MongoDB: ${MONGODB_URI}`);
    console.log('=================================');
});

// ===================== ENCERRAMENTO GRACEFUL =====================
const gracefulShutdown = async () => {
    console.log('\n🛑 Recebido sinal de encerramento. Finalizando...');
    try {
        await mongoose.connection.close();
        console.log('✅ Conexão com MongoDB fechada.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erro ao fechar conexão:', err);
        process.exit(1);
    }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// ===================== EXPORTA PARA TESTES =====================
module.exports = { app, Orcamento };
