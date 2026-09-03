require('dotenv').config();

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 10000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(express.static(path.join(__dirname)));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas solicitações. Tente novamente mais tarde.' }
});
app.use('/api', apiLimiter);

const quoteSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
  telefone: { type: String, trim: true, maxlength: 40 },
  empresa: { type: String, trim: true, maxlength: 160 },
  servico: { type: String, trim: true, maxlength: 120 },
  projeto: { type: String, trim: true, maxlength: 5000 },
  status: { type: String, enum: ['novo', 'em_analise', 'respondido', 'arquivado'], default: 'novo' },
  origem: { type: String, default: 'site' },
  ipHash: String
}, { timestamps: true });

const contactSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
  assunto: { type: String, trim: true, maxlength: 200 },
  mensagem: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ['novo', 'respondido', 'arquivado'], default: 'novo' },
  ipHash: String
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'cliente'], default: 'cliente' },
  verified: { type: Boolean, default: false },
  verificationTokenHash: String,
  verificationExpires: Date,
  lastLoginAt: Date
}, { timestamps: true });

const auditSchema = new mongoose.Schema({
  action: String,
  actorId: mongoose.Schema.Types.ObjectId,
  actorEmail: String,
  metadata: mongoose.Schema.Types.Mixed,
  ipHash: String
}, { timestamps: true });

const Quote = mongoose.model('Quote', quoteSchema);
const Contact = mongoose.model('Contact', contactSchema);
const User = mongoose.model('User', userSchema);
const AuditLog = mongoose.model('AuditLog', auditSchema);

function hashIp(req) {
  const value = req.ip || 'unknown';
  return crypto.createHash('sha256').update(value).digest('hex');
}

function makeToken(user) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET não configurado');
  return jwt.sign({ sub: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function auth(requiredRoles = []) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token || !JWT_SECRET) return res.status(401).json({ error: 'Não autorizado.' });
      const payload = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(payload.sub);
      if (!user) return res.status(401).json({ error: 'Sessão inválida.' });
      if (requiredRoles.length && !requiredRoles.includes(user.role)) return res.status(403).json({ error: 'Sem permissão.' });
      req.user = user;
      next();
    } catch {
      return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    }
  };
}

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'Korczak Technologies', time: new Date().toISOString() }));
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

app.post('/api/quotes', async (req, res) => {
  try {
    const { nome, email, telefone, empresa, servico, projeto } = req.body;
    if (!nome?.trim() || !email?.trim()) return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
    const quote = await Quote.create({ nome, email, telefone, empresa, servico, projeto, ipHash: hashIp(req) });
    await AuditLog.create({ action: 'quote_created', metadata: { quoteId: quote._id }, ipHash: hashIp(req) });
    res.status(201).json({ message: 'Orçamento recebido com sucesso.', id: quote._id });
  } catch (error) {
    console.error('quote_error', error);
    res.status(500).json({ error: 'Não foi possível registrar o orçamento.' });
  }
});

app.post('/api/contacts', async (req, res) => {
  try {
    const { nome, email, assunto, mensagem } = req.body;
    if (!nome?.trim() || !email?.trim() || !mensagem?.trim()) return res.status(400).json({ error: 'Nome, e-mail e mensagem são obrigatórios.' });
    const contact = await Contact.create({ nome, email, assunto, mensagem, ipHash: hashIp(req) });
    await AuditLog.create({ action: 'contact_created', metadata: { contactId: contact._id }, ipHash: hashIp(req) });
    res.status(201).json({ message: 'Mensagem recebida com sucesso.', id: contact._id });
  } catch (error) {
    console.error('contact_error', error);
    res.status(500).json({ error: 'Não foi possível registrar a mensagem.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { nome, email, senha, setupToken } = req.body;
    if (!nome || !email || !senha || senha.length < 8) return res.status(400).json({ error: 'Dados inválidos. A senha deve ter pelo menos 8 caracteres.' });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    const firstUser = (await User.countDocuments()) === 0;
    if (firstUser && process.env.ADMIN_SETUP_TOKEN && setupToken !== process.env.ADMIN_SETUP_TOKEN) return res.status(403).json({ error: 'Token de configuração inválido.' });
    const passwordHash = await bcrypt.hash(senha, 12);
    const user = await User.create({ nome, email, passwordHash, role: firstUser ? 'admin' : 'cliente' });
    await AuditLog.create({ action: 'user_registered', actorId: user._id, actorEmail: user.email, ipHash: hashIp(req) });
    res.status(201).json({ message: 'Usuário criado.', token: makeToken(user), user: { id: user._id, nome: user.nome, email: user.email, role: user.role } });
  } catch (error) {
    console.error('register_error', error);
    res.status(500).json({ error: 'Não foi possível criar o usuário.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(String(senha || ''), user.passwordHash))) return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    user.lastLoginAt = new Date();
    await user.save();
    await AuditLog.create({ action: 'user_login', actorId: user._id, actorEmail: user.email, ipHash: hashIp(req) });
    res.json({ message: 'Login realizado.', token: makeToken(user), user: { id: user._id, nome: user.nome, email: user.email, role: user.role } });
  } catch (error) {
    console.error('login_error', error);
    res.status(500).json({ error: 'Não foi possível realizar o login.' });
  }
});

app.get('/api/admin/quotes', auth(['admin']), async (req, res) => res.json(await Quote.find().sort({ createdAt: -1 }).limit(200)));
app.get('/api/admin/contacts', auth(['admin']), async (req, res) => res.json(await Contact.find().sort({ createdAt: -1 }).limit(200)));

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

async function start() {
  if (!MONGODB_URI) throw new Error('Defina MONGODB_URI nas variáveis de ambiente do Render.');
  if (!JWT_SECRET) throw new Error('Defina JWT_SECRET nas variáveis de ambiente do Render.');
  await mongoose.connect(MONGODB_URI, { dbName: 'KorczakTechSite' });
  console.log('MongoDB conectado: KorczakTechSite');
  app.listen(PORT, '0.0.0.0', () => console.log(`Servidor iniciado na porta ${PORT}`));
}

start().catch((error) => { console.error('startup_error', error); process.exit(1); });
