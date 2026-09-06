const nodemailer = require('nodemailer');
const twilio = require('twilio');

const COMMERCIAL_EMAIL = process.env.QUOTE_NOTIFICATION_EMAIL || 'korczaktechnology@gmail.com';

function getMailTransporter() {
  const host = String(process.env.SMTP_HOST || '').trim();
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').trim();
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

function getWhatsAppClient() {
  const sid = String(process.env.TWILIO_ACCOUNT_SID || '').trim();
  const token = String(process.env.TWILIO_AUTH_TOKEN || '').trim();
  if (!sid || !token) return null;
  return twilio(sid, token);
}

function normalizeWhatsAppAddress(phone) {
  const value = String(phone || '').trim();
  if (!value) return '';
  if (value.startsWith('whatsapp:')) return value;
  return `whatsapp:${value}`;
}

function quoteClientText({ nome, quoteId }) {
  return [
    `Olá, ${nome}!`,
    '',
    'Sou o BOT da Korczak Technologies e estou passando para confirmar que recebemos seu orçamento.',
    '',
    `📋 Orçamento: ${quoteId}`,
    'Status: enviado para auditoria.',
    '',
    'Nossa equipe analisará as informações e dará continuidade ao atendimento o mais rápido possível.',
    '',
    'Obrigado por escolher a Korczak Technologies.',
    '',
    'Atenciosamente,',
    'Korczak Technologies'
  ].join('\n');
}

function quoteClientHtml({ nome, quoteId }) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:24px;background:#f5f7fa;font-family:Arial,sans-serif;color:#1f2937"><div style="max-width:620px;margin:auto;background:#fff;padding:32px;border-radius:12px"><h2 style="margin-top:0">Orçamento recebido</h2><p>Olá, <strong>${escapeHtml(nome)}</strong>!</p><p>Sou o BOT da <strong>Korczak Technologies</strong> e estou passando para confirmar que recebemos seu orçamento.</p><p style="padding:14px;background:#f3f4f6;border-radius:8px"><strong>Orçamento:</strong> ${escapeHtml(quoteId)}<br><strong>Status:</strong> enviado para auditoria.</p><p>Nossa equipe analisará as informações e dará continuidade ao atendimento o mais rápido possível.</p><p>Obrigado por escolher a Korczak Technologies.</p><p>Atenciosamente,<br><strong>Korczak Technologies</strong></p></div></body></html>`;
}

function commercialText({ quote }) {
  return [
    'Novo orçamento recebido — Korczak Technologies',
    '',
    `ID: ${quote.quoteId}`,
    `Cliente: ${quote.nomeProponente}`,
    `E-mail: ${quote.email}`,
    `Telefone: ${quote.telefone || 'Não informado'}`,
    `Empresa/Projeto: ${quote.empresaProjeto}`,
    `Serviço: ${quote.tipoOrcamento}`,
    `Status: ${quote.status}`,
    '',
    'Descrição:',
    quote.descricao,
  ].join('\n');
}

function commercialHtml({ quote }) {
  return `<!doctype html><html lang="pt-BR"><body style="font-family:Arial,sans-serif;color:#1f2937"><h2>Novo orçamento recebido</h2><p><strong>ID:</strong> ${escapeHtml(quote.quoteId)}</p><p><strong>Cliente:</strong> ${escapeHtml(quote.nomeProponente)}<br><strong>E-mail:</strong> ${escapeHtml(quote.email)}<br><strong>Telefone:</strong> ${escapeHtml(quote.telefone || 'Não informado')}<br><strong>Empresa/Projeto:</strong> ${escapeHtml(quote.empresaProjeto)}<br><strong>Serviço:</strong> ${escapeHtml(quote.tipoOrcamento)}<br><strong>Status:</strong> ${escapeHtml(quote.status)}</p><h3>Descrição</h3><p style="white-space:pre-wrap">${escapeHtml(quote.descricao)}</p></body></html>`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

async function sendQuoteNotifications({ quote }) {
  const result = { emailClient: false, emailCommercial: false, whatsappClient: false };
  const transporter = getMailTransporter();

  if (transporter) {
    const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
    const clientSubject = `Korczak Technologies — orçamento ${quote.quoteId} recebido`;
    const commercialSubject = `Novo orçamento #${quote.quoteId}`;

    try {
      await transporter.sendMail({ from, to: quote.email, subject: clientSubject, text: quoteClientText({ nome: quote.nomeProponente, quoteId: quote.quoteId }), html: quoteClientHtml({ nome: quote.nomeProponente, quoteId: quote.quoteId }) });
      result.emailClient = true;
    } catch (error) {
      console.error('ERRO_EMAIL_CLIENTE', error.message);
    }

    try {
      await transporter.sendMail({ from, to: COMMERCIAL_EMAIL, replyTo: quote.email, subject: commercialSubject, text: commercialText({ quote }), html: commercialHtml({ quote }) });
      result.emailCommercial = true;
    } catch (error) {
      console.error('ERRO_EMAIL_COMERCIAL', error.message);
    }
  }

  const whatsappClient = getWhatsAppClient();
  const to = normalizeWhatsAppAddress(quote.telefone);
  const from = normalizeWhatsAppAddress(process.env.TWILIO_PHONE_NUMBER);
  if (whatsappClient && to && from) {
    try {
      await whatsappClient.messages.create({ from, to, body: quoteClientText({ nome: quote.nomeProponente, quoteId: quote.quoteId }) });
      result.whatsappClient = true;
    } catch (error) {
      console.error('ERRO_WHATSAPP_CLIENTE', error.message);
    }
  }

  return result;
}

module.exports = { sendQuoteNotifications };
