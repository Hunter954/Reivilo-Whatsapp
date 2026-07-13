# REIVILO Mentoria WhatsApp

Automação em Node.js com Baileys, PostgreSQL e Mercado Pago.

## Railway

Variáveis essenciais:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-SEU_TOKEN
```

Depois do deploy, abra `/admin`. No primeiro acesso, o sistema cria o usuário e senha e permite configurar preço, grupo, link de convite e mensagens. Essas informações ficam no PostgreSQL.

A autenticação do WhatsApp também fica no PostgreSQL, evitando nova leitura do QR Code a cada redeploy.
