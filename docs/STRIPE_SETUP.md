# Stripe — configuração no Render

## Variáveis de ambiente

Configure somente no painel do Render, nunca no GitHub:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PUBLIC_API_URL=https://kzsite.onrender.com`

Comece com uma chave de teste (`sk_test_...`). A chave real (`sk_live_...`) só deve ser usada após testes completos e com uma conta Stripe pertencente ao titular responsável pela operação.

## Webhook

Cadastre no Stripe o endpoint:

`https://kzsite.onrender.com/api/payments/stripe/webhook`

Eventos necessários:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Copie o segredo de assinatura gerado pelo endpoint para `STRIPE_WEBHOOK_SECRET` no Render.

## Teste

1. Faça o deploy.
2. Execute `npm run preflight:payments`.
3. Crie um pedido autenticado.
4. Clique em **Ir para o pagamento**.
5. Use o ambiente de teste da Stripe.
6. Confirme que o webhook atualiza o pedido no MongoDB.

## Produção

Não misture chaves de teste e produção. Antes de usar chaves reais, valide o fluxo completo, incluindo pagamentos cancelados, falhos e webhooks duplicados.
