// Ping periódico opcional para o endpoint de saúde.
// Não inicia o servidor: o processo principal é iniciado por `npm start`.
// Defina KEEPALIVE_URL somente quando houver uma necessidade operacional real.

const intervalMs = 15 * 60 * 1000;
const baseUrl = (process.env.KEEPALIVE_URL || '').replace(/\/$/, '');

async function ping() {
  if (!baseUrl) return;

  try {
    const response = await fetch(`${baseUrl}/health`, {
      signal: AbortSignal.timeout(10000)
    });
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
  console.log('[keepalive] desativado: KEEPALIVE_URL não foi definido.');
}
