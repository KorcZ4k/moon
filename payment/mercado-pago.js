const crypto = require('crypto');

function createMercadoPagoClient() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    const error = new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado.');
    error.code = 'MP_NOT_CONFIGURED';
    throw error;
  }

  const { MercadoPagoConfig, Preference } = require('mercadopago');
  const client = new MercadoPagoConfig({ accessToken });
  return { Preference, client };
}

function baseUrl() {
  const url = String(process.env.PUBLIC_API_URL || 'https://kzsite.onrender.com').replace(/\/$/, '');
  return url;
}

async function createCheckoutPreference(order) {
  const { Preference, client } = createMercadoPagoClient();
  const preference = new Preference(client);
  const apiUrl = baseUrl();

  const response = await preference.create({
    body: {
      external_reference: order.orderId,
      items: [{
        id: order.productCode,
        title: order.productName,
        quantity: 1,
        unit_price: Number(order.amount),
        currency_id: order.currency || 'BRL'
      }],
      payer: order.payerEmail ? { email: order.payerEmail } : undefined,
      back_urls: {
        success: `${apiUrl}/comercial/pedido/confirmacao.html?order=${encodeURIComponent(order.orderId)}&payment=success`,
        failure: `${apiUrl}/comercial/pedido/confirmacao.html?order=${encodeURIComponent(order.orderId)}&payment=failure`,
        pending: `${apiUrl}/comercial/pedido/confirmacao.html?order=${encodeURIComponent(order.orderId)}&payment=pending`
      },
      auto_return: 'approved',
      notification_url: `${apiUrl}/api/payments/mercado-pago/webhook`
    }
  });

  return {
    preferenceId: response.id,
    initPoint: response.init_point || response.sandbox_init_point || null,
    sandboxInitPoint: response.sandbox_init_point || null
  };
}

function verifyWebhookSignature({ requestId, dataId, signature }) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!signature) return false;

  const parts = Object.fromEntries(
    String(signature).split(',').map(part => {
      const [key, value] = part.trim().split('=');
      return [key, value];
    })
  );

  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${String(dataId || '').toLowerCase()};request-id:${requestId || ''};ts:${parts.ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  const received = String(parts.v1).toLowerCase();

  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

module.exports = { createCheckoutPreference, verifyWebhookSignature };