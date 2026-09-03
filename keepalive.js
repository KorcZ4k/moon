// Mantém um ping periódico para o endpoint de saúde.
// Defina KEEPALIVE_URL no Render com a URL pública do próprio serviço.
// Observação: isto não substitui limitações ou políticas de suspensão impostas pelo plano da plataforma.
require('./server');

const intervalMs = 15 * 60 * 1000;
const baseUrl = (process.env.KEEPALIVE_URL || '').replace(/\/$/, '');

async function ping() {
  if (!baseUrl) return;
  try {
    const response = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(10000) });
    console.log(`[keepalive] ${new Date().toISOString()} status=${response.status}`);
  } catch (error) {
    console.warn(`[keepalive] ${new Date().toISOString()} falhou: ${error.message}`);
  }
}

if (baseUrl) {
  setTimeout(ping, 30000);
  setInterval(ping, intervalMs);
  console.log(`[keepalive] ativo a cada ${intervalMs / 60000} minutos para ${baseUrl}`);
} else {
  console.log('[keepalive] desativado: defina KEEPALIVE_URL no Render para habilitar o ping periódico.');
}
