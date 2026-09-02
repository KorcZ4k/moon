// back.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/korczak_db';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===================== CONEXÃO MONGODB =====================
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Conectado ao MongoDB com sucesso!');
        console.log(`📦 Banco de dados: ${mongoose.connection.name}`);
    })
    .catch((err) => {
        console.error('❌ Erro ao conectar ao MongoDB:', err.message);
    });

// ===================== SCHEMA =====================
const orcamentoSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true,
        minlength: [2, 'Nome deve ter pelo menos 2 caracteres']
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
        default: ''
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
    ip: String,
    userAgent: String
}, {
    timestamps: true
});

const Orcamento = mongoose.model('Orcamento', orcamentoSchema);

// ===================== ROTA DE SAÚDE =====================
app.get('/api/saude', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        mongo: {
            conectado: mongoose.connection.readyState === 1
        }
    });
});

// ===================== ROTA PARA CRIAR ORÇAMENTO =====================
app.post('/api/orcamentos', async (req, res) => {
    try {
        const { nome, email, telefone, servico, mensagem } = req.body;

        // Validações
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

        // Cria novo orçamento
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

        // Salva no MongoDB
        const orcamentoSalvo = await novoOrcamento.save();
        console.log(`📝 Novo orçamento: ${orcamentoSalvo.nome} (${orcamentoSalvo.email})`);

        // ===================== ENVIA MENSAGEM AUTOMÁTICA =====================
        let linkWhatsApp = null;
        
        if (telefone && telefone.length >= 10) {
            // Mensagem personalizada
            const mensagemWhatsApp = `Olá ${nome}! 👋

Recebemos seu orçamento na Korczak Technologies!

📋 ID: ${orcamentoSalvo._id}
📝 Serviço: ${servico}
📧 Email: ${email}

✅ Seu orçamento está em análise.
Em breve nossa equipe entrará em contato.

Atenciosamente,
Korczak Technologies 🚀`;

            // Cria link do WhatsApp
            const telefoneLimpo = telefone.replace(/\D/g, '');
            linkWhatsApp = `https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(mensagemWhatsApp)}`;
            
            console.log(`💬 Link WhatsApp gerado para ${nome}`);
        }

        // Resposta com sucesso e link do WhatsApp
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
            },
            linkWhatsApp: linkWhatsApp // Link para abrir no WhatsApp
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
            mensagem: error.message
        });
    }
});

// ===================== LISTAR ORÇAMENTOS =====================
app.get('/api/orcamentos', async (req, res) => {
    try {
        const orcamentos = await Orcamento.find().sort({ createdAt: -1 }).limit(100);
        res.json({
            sucesso: true,
            dados: orcamentos,
            total: orcamentos.length
        });
    } catch (error) {
        console.error('❌ Erro ao listar orçamentos:', error);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro ao listar orçamentos',
            mensagem: error.message
        });
    }
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

module.exports = { app, Orcamento };
