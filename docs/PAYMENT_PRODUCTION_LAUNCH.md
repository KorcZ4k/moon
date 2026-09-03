# Lançamento de pagamentos em produção

## Objetivo
Liberar pagamentos reais somente depois da aprovação do fluxo sandbox e de uma revisão final do ambiente do Render.

## Regra de segurança
O código assume `sandbox` quando `MERCADO_PAGO_MODE` estiver ausente ou inválido. Produção exige configuração explícita:

`MERCADO_PAGO_MODE=production`

Nunca use o modo de produção apenas para testar a integração.

## Pré-requisitos obrigatórios

- Um pagamento sandbox aprovado foi concluído ponta a ponta.
- O pedido foi criado no MongoDB.
- O webhook chegou ao Render e foi validado.
- O pagamento foi consultado novamente pelo backend.
- O pedido mudou para `paid` no MongoDB.
- O pedido apareceu corretamente para o proprietário na Área do Cliente.
- Testes de pagamento pendente, rejeitado e webhook repetido foram executados.
- O endpoint `/health` responde com banco conectado e Mercado Pago configurado.

## Variáveis no Render

Configure no serviço web, sem colocar segredos no GitHub:

- `MERCADO_PAGO_MODE=production`
- `MERCADO_PAGO_ACCESS_TOKEN=<credencial de produção>`
- `MERCADO_PAGO_WEBHOOK_SECRET=<segredo de produção>`
- `PUBLIC_API_URL=https://kzsite.onrender.com`
- `MONGODB_URI=<conexão existente>`
- `JWT_SECRET=<segredo existente>`

## Ordem de ativação

1. Confirmar que o deploy atual está saudável.
2. Executar o preflight no ambiente publicado.
3. Configurar as credenciais de produção no Render.
4. Configurar o webhook de produção no Mercado Pago:
   `https://kzsite.onrender.com/api/payments/mercado-pago/webhook`
5. Fazer um novo deploy/restart.
6. Confirmar novamente `/health`.
7. Criar um pedido real de baixo valor apenas se toda a operação estiver legalmente pronta para receber pagamentos.
8. Verificar o pedido, webhook, histórico e Área do Cliente.

## Critério de rollback

Volte imediatamente para `MERCADO_PAGO_MODE=sandbox` e investigue se ocorrer:

- cobrança sem atualização do pedido;
- webhook não validado;
- divergência entre o valor do pedido e o checkout;
- usuário conseguindo acessar pedido de outra conta;
- falha recorrente do MongoDB;
- erro de autenticação ou indisponibilidade da API.

## Observação operacional

A confirmação da página de retorno do checkout não substitui a confirmação do webhook. O estado final do pedido deve continuar sendo determinado pelo backend após consultar o pagamento no provedor.
