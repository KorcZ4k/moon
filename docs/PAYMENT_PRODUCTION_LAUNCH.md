# Lançamento de pagamentos com Stripe

## Pré-requisitos

- O checkout de teste foi validado ponta a ponta.
- O pedido foi criado no MongoDB.
- O webhook chegou ao Render e sua assinatura foi validada.
- O pedido foi atualizado para `paid` somente após confirmação da Stripe.
- A Área do Cliente mostra o estado correto do pedido.
- Pagamentos cancelados, expirados e webhooks repetidos foram testados.

## Render

Configure os segredos apenas no serviço web:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PUBLIC_API_URL=https://kzsite.onrender.com`
- `MONGODB_URI=<conexão existente>`
- `JWT_SECRET=<segredo existente>`

## Webhook

Endpoint:

`https://kzsite.onrender.com/api/payments/stripe/webhook`

## Regra de produção

Use chaves de teste até que toda a operação esteja validada e legalmente apta a receber pagamentos. Depois, substitua a chave de teste por uma chave de produção e configure o webhook correspondente no painel da Stripe.

A página de retorno do Checkout não confirma sozinha o pagamento. O estado final do pedido é determinado pelo backend a partir do webhook assinado da Stripe.

## Rollback

Se houver divergência entre cobrança e pedido, falha de webhook ou erro persistente do MongoDB, remova a chave de produção do Render e interrompa novos checkouts até a investigação.
