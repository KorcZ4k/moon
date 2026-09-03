# Teste de pagamentos com Stripe

## Objetivo
Validar: pedido -> Stripe Checkout -> webhook -> MongoDB -> Área do Cliente.

## Render

Configure:

- `STRIPE_SECRET_KEY=<chave de teste>`
- `STRIPE_WEBHOOK_SECRET=<segredo do endpoint de teste>`
- `PUBLIC_API_URL=https://kzsite.onrender.com`
- `MONGODB_URI=<conexão existente>`
- `JWT_SECRET=<segredo existente>`

Nunca adicione chaves ou segredos ao GitHub.

## Preflight

Execute:

`npm run preflight:payments`

Resultado esperado:

- `Status: ok`
- `Database: connected`
- `Stripe configured: true`
- `PRECHECK_OK`

## Fluxo funcional

1. Faça login.
2. Escolha um produto.
3. Crie o pedido.
4. Confirme `pending_payment`.
5. Inicie o checkout.
6. Use apenas meios de pagamento de teste da Stripe.
7. Conclua ou cancele o teste.

## Webhook

Endpoint:

`https://kzsite.onrender.com/api/payments/stripe/webhook`

O pedido deve ser atualizado somente após um webhook autenticado.

## MongoDB

Confirme:

- `payment.provider = stripe`
- `payment.preferenceId` contém o ID da Checkout Session
- `payment.paymentId` é preenchido quando disponível
- `payment.status` acompanha a confirmação
- `history` não recebe eventos duplicados

## Cenários mínimos

- aprovado: `pending_payment -> paid`
- cancelado/expirado: estado coerente sem marcar como pago
- webhook repetido: sem duplicar histórico
- usuário diferente: não pode consultar ou pagar pedido alheio

O ambiente de produção só deve receber uma chave real depois que o fluxo de teste estiver aprovado ponta a ponta.
