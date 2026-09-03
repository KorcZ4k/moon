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

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false, message: { error: 'Muitas solicitações. Tente novamente mais tarde.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Muitas tentativas. Aguarde alguns minutos.' } });
app.use('/api', apiLimiter);

const quoteSchema = new mongoose.Schema({
  quoteId: { type: String, required: true, unique: true, match: /^\d{15}$/ },
  nomeProponente: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
  telefone: { type: String, trim: true, maxlength: 40 },
  descricao: { type: String, trim: true, maxlength: 5000 },
  quemAtendeu: { type: String, default: 'Pendente', trim: true, maxlength: 120 },
  empresaProjeto: { type: String, trim: true, maxlength: 160 },
  tipoOrcamento: { type: String, trim: true, maxlength: 120 },
  status: { type: String, enum: ['novo', 'em_analise', 'respondido', 'arquivado'], default: 'novo' },
  origem: { type: String, default: 'site' },
  ipHash: String
}, { timestamps: true });

const contactSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
  telefone: { type: String, trim: true, maxlength: 40 },
  assunto: { type: String, trim: true, maxlength: 200 },
  mensagem: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ['novo', 'respondido', 'arquivado'], default: 'novo' },
  ipHash: String
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true, maxlength: 80 },
  sobrenome: { type: String, required: true, trim: true, maxlength: 100 },
  userId: { type: String, required: true, unique: true, match: /^\d{9}$/ },
  telefone: { type: String, required: true, trim: true, maxlength: 40 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  quoteId: { type: String, default: 'Pendente', validate: { validator: value => value === 'Pendente' || /^\d{15}$/.test(value), message: 'ID do orçamento inválido.' } },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'cliente'], default: 'cliente' },
  verified: { type: Boolean, default: false },
  verificationTokenHash: String,
  verificationExpires: Date,
  lastLoginAt: Date
}, { timestamps: true });

const auditSchema = new mongoose.Schema({ action: String, actorId: mongoose.Schema.Types.ObjectId, actorEmail: String, metadata: mongoose.Schema.Types.Mixed, ipHash: String }, { timestamps: true });

const Quote = mongoose.model('Quote', quoteSchema);
const Contact = mongoose.model('Contact', contactSchema);
const User = mongoose.model('User', userSchema);
const AuditLog = mongoose.model('AuditLog', auditSchema);

function hashIp(req) { return crypto.createHash('sha256').update(req.ip || 'unknown').digest('hex'); }
function makeToken(user) { if (!JWT_SECRET) throw new Error('JWT_SECRET não configurado'); return jwt.sign({ sub: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: '7d' }); }
function cleanDigits(value) { return String(value || '').replace(/\D/g, ''); }

async function generateQuoteId() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const id = Array.from({ length: 15 }, () => crypto.randomInt(0, 10)).join('');
    if (!(await Quote.exists({ quoteId: id }))) return id;
  }
  throw new Error('Não foi possível gerar um ID de orçamento único.');
}

function auth(requiredRoles = []) {
  return async (req, res, next) => {
    try {
      const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      if (!token || !JWT_SECRET) return res.status(401).json({ error: 'Não autorizado.' });
      const payload = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(payload.sub);
      if (!user) return res.status(401).json({ error: 'Sessão inválida.' });
      if (requiredRoles.length && !requiredRoles.includes(user.role)) return res.status(403).json({ error: 'Sem permissão.' });
      req.user = user;
      next();
    } catch { return res.status(401).json({ error: 'Sessão inválida ou expirada.' }); }
  };
}

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'Korczak Technologies', time: new Date().toISOString() }));
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

app.post('/api/quotes', async (req, res) => {
  try {
    const { nome, email, telefone, empresa, servico, projeto } = req.body;
    if (!nome?.trim() || !email?.trim()) return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
    const quoteId = await generateQuoteId();
    const quote = await Quote.create({ quoteId, nomeProponente: nome, email, telefone, descricao: projeto, quemAtendeu: 'Pendente', empresaProjeto: empresa, tipoOrcamento: servico, ipHash: hashIp(req) });
    await AuditLog.create({ action: 'quote_created', metadata: { quoteId: quote.quoteId }, ipHash: hashIp(req) });
    res.status(201).json({ message: 'Orçamento recebido com sucesso.', quoteId: quote.quoteId, status: 'Pendente' });
  } catch (error) { console.error('quote_error', error); res.status(500).json({ error: 'Não foi possível registrar o orçamento.' }); }
});

app.post('/api/contacts', async (req, res) => {
  try {
    const { nome, email, telefone, assunto, mensagem } = req.body;
    if (!nome?.trim() || !email?.trim() || !mensagem?.trim()) return res.status(400).json({ error: 'Nome, e-mail e mensagem são obrigatórios.' });
    const contact = await Contact.create({ nome, email, telefone, assunto, mensagem, ipHash: hashIp(req) });
    await AuditLog.create({ action: 'contact_created', metadata: { contactId: contact._id }, ipHash: hashIp(req) });
    res.status(201).json({ message: 'Mensagem recebida com sucesso.', id: contact._id });
  } catch (error) { console.error('contact_error', error); res.status(500).json({ error: 'Não foi possível registrar a mensagem.' }); }
});

app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { nome, sobrenome, userId, telefone, email, quoteId, senha, setupToken } = req.body;
    const normalizedUserId = cleanDigits(userId);
    const normalizedQuoteId = quoteId === 'Pendente' || !String(quoteId || '').trim() ? 'Pendente' : cleanDigits(quoteId);
    if (!nome?.trim() || !sobrenome?.trim() || !telefone?.trim() || !email?.trim() || !senha || !/^\d{9}$/.test(normalizedUserId)) return res.status(400).json({ error: 'Preencha todos os dados e informe um ID pessoal de exatamente 9 dígitos.' });
    if (senha.length < 8) return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres.' });
    if (normalizedQuoteId !== 'Pendente' && !/^\d{15}$/.test(normalizedQuoteId)) return res.status(400).json({ error: 'O ID do orçamento deve ter exatamente 15 dígitos ou ser Pendente.' });
    if (normalizedQuoteId !== 'Pendente' && !(await Quote.exists({ quoteId: normalizedQuoteId }))) return res.status(404).json({ error: 'Nenhum orçamento foi encontrado com esse ID.' });
    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { userId: normalizedUserId }] });
    if (existing) return res.status(409).json({ error: existing.email === email.toLowerCase() ? 'Este e-mail já está cadastrado.' : 'Este ID de 9 dígitos já está em uso.' });
    const firstUser = (await User.countDocuments()) === 0;
    if (firstUser && process.env.ADMIN_SETUP_TOKEN && setupToken !== process.env.ADMIN_SETUP_TOKEN) return res.status(403).json({ error: 'Token de configuração do administrador inválido.' });
    const passwordHash = await bcrypt.hash(senha, 12);
    const user = await User.create({ nome, sobrenome, userId: normalizedUserId, telefone, email, quoteId: normalizedQuoteId, passwordHash, role: firstUser ? 'admin' : 'cliente' });
    await AuditLog.create({ action: 'user_registered', actorId: user._id, actorEmail: user.email, metadata: { userId: user.userId, quoteId: user.quoteId }, ipHash: hashIp(req) });
    res.status(201).json({ message: 'Conta criada com sucesso.', token: makeToken(user), user: { id: user._id, nome: user.nome, sobrenome: user.sobrenome, userId: user.userId, email: user.email, quoteId: user.quoteId, role: user.role } });
  } catch (error) { console.error('register_error', error); res.status(500).json({ error: 'Não foi possível criar o usuário.' }); }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { identificador, email, userId, senha } = req.body;
    const value = String(identificador || email || userId || '').trim();
    const digits = cleanDigits(value);
    const query = /^\d{9}$/.test(digits) ? { userId: digits } : { email: value.toLowerCase() };
    const user = await User.findOne(query).select('+passwordHash');
    if (!user || !(await bcrypt.compare(String(senha || ''), user.passwordHash))) return res.status(401).json({ error: 'Identificador ou senha inválidos.' });
    user.lastLoginAt = new Date(); await user.save();
    await AuditLog.create({ action: 'user_login', actorId: user._id, actorEmail: user.email, metadata: { userId: user.userId }, ipHash: hashIp(req) });
    res.json({ message: 'Login realizado.', token: makeToken(user), user: { id: user._id, nome: user.nome, sobrenome: user.sobrenome, userId: user.userId, email: user.email, quoteId: user.quoteId, role: user.role } });
  } catch (error) { console.error('login_error', error); res.status(500).json({ error: 'Não foi possível realizar o login.' }); }
});

app.get('/api/me', auth(), (req, res) => res.json({ user: { id: req.user._id, nome: req.user.nome, sobrenome: req.user.sobrenome, userId: req.user.userId, email: req.user.email, telefone: req.user.telefone, quoteId: req.user.quoteId, role: req.user.role } }));
app.get('/api/admin/quotes', auth(['admin']), async (req, res) => res.json(await Quote.find().sort({ createdAt: -1 }).limit(200)));
app.patch('/api/admin/quotes/:quoteId', auth(['admin']), async (req, res) => {
  const quote = await Quote.findOneAndUpdate({ quoteId: req.params.quoteId }, { $set: { quemAtendeu: req.body.quemAtendeu || 'Pendente', status: req.body.status || 'em_analise' } }, { new: true });
  if (!quote) return res.status(404).json({ error: 'Orçamento não encontrado.' });
  res.json(quote);
});
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
