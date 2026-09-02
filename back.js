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

module.exports = { app, Orcamento };          Soluções inovadoras para organizações, instituições e negócios que querem transformar.
        </p>
        <a href="#orcamento" class="btn-primario">
          <i class="fas fa-file-signature" style="margin-right:10px;"></i> Solicitar orçamento
        </a>
      </div>
      <div class="hero-image">
        <i class="fas fa-hand-holding-heart"></i>
        <p><i class="fas fa-check-circle" style="color:#00ff41;"></i> Pré-operacional · em construção</p>
        <p style="font-size:0.9rem; opacity:0.7; margin-top:0.2rem;">CNPJ em processo — já atendemos</p>
      </div>
    </section>

    <!-- SERVIÇOS -->
    <section class="container servicos" id="servicos">
      <h2>Nossos serviços</h2>
      <p class="servicos-desc">
        Da arquitetura de software à consultoria social, criamos pontes entre tecnologia e pessoas.
      </p>
      <div class="cards">
        <div class="card">
          <i class="fas fa-code"></i>
          <h3>Desenvolvimento web</h3>
          <p>Sites, aplicativos e sistemas personalizados com foco em performance e acessibilidade.</p>
        </div>
        <div class="card">
          <i class="fas fa-database"></i>
          <h3>Banco de dados & API</h3>
          <p>Modelagem, integração e segurança com MongoDB, SQL e RESTful APIs.</p>
        </div>
        <div class="card">
          <i class="fas fa-users"></i>
          <h3>Serviços sociais</h3>
          <p>Consultoria para ONGs, projetos comunitários e iniciativas de inclusão digital.</p>
        </div>
        <div class="card">
          <i class="fas fa-chart-line"></i>
          <h3>Landing pages</h3>
          <p>Páginas de conversão otimizadas para captar leads e apresentar sua ideia.</p>
        </div>
      </div>
    </section>

    <!-- ORÇAMENTO -->
    <section class="orcamento" id="orcamento">
      <div class="container orcamento-grid">
        <div class="orcamento-info">
          <h2><i class="fas fa-calculator"></i> Solicite um orçamento</h2>
          <p>
            Preencha o formulário e receba uma proposta personalizada para o seu projeto.
            Atendemos desde startups a organizações sociais.
          </p>
          <p><i class="fas fa-check-circle"></i> Resposta em até 24h</p>
          <p><i class="fas fa-check-circle"></i> Sem compromisso</p>
          <p style="margin-top:1.2rem;"><i class="fas fa-envelope"></i> contato@korczaktech.com</p>
        </div>

        <form class="form-orcamento" id="formOrcamento">
          <div class="form-group">
            <label for="nome">Nome completo</label>
            <input type="text" id="nome" placeholder="Seu nome" required />
          </div>
          <div class="form-group">
            <label for="email">E-mail</label>
            <input type="email" id="email" placeholder="seu@email.com" required />
          </div>
          <div class="form-group">
            <label for="telefone">Telefone / WhatsApp</label>
            <input type="tel" id="telefone" placeholder="(11) 99999-9999" />
          </div>
          <div class="form-group">
            <label for="servico">Serviço de interesse</label>
            <select id="servico">
              <option value="desenvolvimento-web">Desenvolvimento web</option>
              <option value="banco-dados-api">Banco de dados / API</option>
              <option value="servicos-sociais">Serviços sociais</option>
              <option value="landing-page">Landing page</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div class="form-group">
            <label for="mensagem">Mensagem ou escopo inicial</label>
            <textarea id="mensagem" placeholder="Conte-nos sobre sua ideia, prazo ou necessidades..."></textarea>
          </div>
          <button type="submit" class="btn-enviar" id="btnEnviar">
            <i class="fas fa-paper-plane" style="margin-right:8px;"></i> Enviar orçamento
          </button>
          <p style="font-size:0.8rem; color:#666; margin-top:1rem; text-align:center;">
            <i class="fas fa-lock"></i> Seus dados estão seguros.
          </p>
        </form>
      </div>
    </section>
  </main>

  <!-- RODAPÉ -->
  <footer id="contato">
    <div class="container">
      <div class="footer-content">
        <div class="footer-col">
          <h4>Korczak Technologies</h4>
          <p>Inovação e responsabilidade social. Pré-operacional — construindo o futuro.</p>
        </div>
        <div class="footer-col">
          <h4>Contato</h4>
          <p><i class="fas fa-envelope" style="margin-right:8px;"></i> contato@korczaktech.com</p>
          <p><i class="fas fa-phone-alt"></i> +55 (11) 99999-9999</p>
        </div>
        <div class="footer-col footer-social">
          <h4>Redes</h4>
          <i class="fab fa-linkedin"></i>
          <i class="fab fa-instagram"></i>
          <i class="fab fa-github"></i>
          <i class="fab fa-youtube"></i>
        </div>
      </div>
      <div class="footer-copy">
        &copy; 2026 Korczak Technologies · todos os direitos reservados ·
        <span style="opacity:0.5;">CNPJ em processo</span>
      </div>
    </div>
  </footer>

  <!-- <script src="app.js"></script> -->
</body>
</html>
