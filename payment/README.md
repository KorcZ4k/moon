# Integração de pagamentos — Mercado Pago

Esta camada prepara o Comercial para usar Checkout Pro do Mercado Pago.

## Variáveis obrigatórias no Render

- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_WEBHOOK_SECRET`
- `PUBLIC_API_URL=https://kzsite.onrender.com`

## Dependência

Instale no projeto:

`npm install mercadopago`

## Fluxo esperado

1. O cliente cria um pedido em `POST /api/orders`.
2. O backend cria uma preferência usando `payment/mercado-pago.js`.
3. A preferência fica vinculada ao `orderId` por `external_reference`.
4. O cliente é redirecionado ao Checkout Pro.
5. O Mercado Pago chama `POST /api/payments/mercado-pago/webhook`.
6. O backend valida a assinatura, consulta o pagamento no provedor e altera o status do pedido.

## Regra de segurança

O navegador nunca recebe o Access Token do Mercado Pago. A aprovação de uma página de retorno não deve marcar um pedido como pago; somente a confirmação verificada pelo backend pode alterar o status para `paid`.
