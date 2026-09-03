# Teste sandbox de pagamentos

## Objetivo
Validar o fluxo completo: pedido -> checkout -> Mercado Pago -> webhook -> MongoDB -> Area do Cliente.

## 1. Configurar o Render
Defina, no ambiente do servico web:

- `MERCADO_PAGO_MODE=sandbox`
- `MERCADO_PAGO_ACCESS_TOKEN=<credencial de teste>`
- `MERCADO_PAGO_WEBHOOK_SECRET=<segredo do webhook de teste>`
- `PUBLIC_API_URL=https://kzsite.onrender.com`
- `MONGODB_URI=<string de conexao existente>`
- `JWT_SECRET=<segredo existente>`

Nunca adicione tokens ou segredos ao GitHub.

## 2. Fazer deploy
Aguarde o Render concluir o deploy do commit que contem a integracao de pagamentos.

## 3. Executar o preflight
Localmente ou em um ambiente com Node.js 20+:

`npm run preflight:payments`

Resultado esperado:

- `Status: ok`
- `Database: connected`
- `Mercado Pago configured: true`
- `PRECHECK_OK`

Se o resultado for diferente, nao prossiga para o checkout.

## 4. Teste funcional
1. Crie uma conta de teste no site ou use uma conta de teste existente.
2. Faça login.
3. Escolha um produto comercial com preco fixo.
4. Crie o pedido.
5. Confirme que o pedido inicia como `pending_payment`.
6. Inicie o checkout.
7. Use exclusivamente as credenciais e meios de pagamento de teste fornecidos pelo Mercado Pago.
8. Conclua o pagamento de teste.

## 5. Validar webhook
Confirme no painel do Mercado Pago que a notificacao foi entregue ao endpoint:

`https://kzsite.onrender.com/api/payments/mercado-pago/webhook`

O servidor deve validar a assinatura e consultar o recurso de pagamento antes de alterar o pedido.

## 6. Validar MongoDB
Confirme que o pedido correto foi atualizado:

- `payment.provider = mercado_pago`
- `payment.preferenceId` preenchido
- `payment.paymentId` preenchido quando disponivel
- `payment.status` atualizado
- `status` do pedido coerente com o pagamento
- novo evento no `history` quando houver mudanca de status

## 7. Validar Area do Cliente
Atualize a Area do Cliente e confirme que o pedido aparece apenas para o usuario dono do pedido.

## Cenarios minimos

### Pagamento aprovado
`pending_payment -> paid`

### Pagamento pendente
Permanece em `pending_payment`.

### Pagamento rejeitado ou cancelado
Atualiza para `cancelled` quando o status recebido corresponder a rejeicao/cancelamento mapeada pelo backend.

### Webhook repetido
O mesmo evento nao deve criar entradas duplicadas no historico.

### Usuario errado
Um usuario autenticado diferente nao deve conseguir consultar ou pagar um pedido que nao lhe pertence.

## Criterio de aprovacao da etapa
A etapa de testes sandbox somente deve ser considerada aprovada quando o fluxo completo for executado com um pagamento de teste e a atualizacao final puder ser observada no MongoDB e na Area do Cliente.

Somente depois disso `MERCADO_PAGO_MODE` pode ser alterado para `production`.
