# Implantação no Railway

## Serviços

- 1 serviço do GitHub com este projeto.
- 1 serviço PostgreSQL no mesmo projeto Railway.

## Variáveis obrigatórias

Copie as variáveis de `.env.example`. Não crie `PORT` manualmente; o Railway injeta essa variável.

As mais importantes são:

- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `PUBLIC_BASE_URL=https://dominio-publico-do-servico`
- `ADMIN_USER` e `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `WA_AUTH_STORE=postgres`
- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_WEBHOOK_SECRET`
- `REIVILO_PRICE_BRL`
- `REIVILO_GROUP_JID` e/ou `REIVILO_GROUP_INVITE_LINK`

## Primeiro acesso

1. Aguarde o deploy terminar.
2. Acesse `/admin/login`.
3. Entre com `ADMIN_USER` e `ADMIN_PASSWORD`.
4. Abra **Conectar WhatsApp** e leia o QR Code.
5. Após aparecer “Conectado via Baileys”, faça um redeploy de teste. Com `WA_AUTH_STORE=postgres`, não deverá pedir novo QR.

## Webhook Mercado Pago

Cadastre no Mercado Pago:

`https://SEU-DOMINIO/webhooks/mercadopago`

Selecione notificações de pagamentos. O webhook responde imediatamente e consulta o pagamento pela API antes de liberar o cliente.
