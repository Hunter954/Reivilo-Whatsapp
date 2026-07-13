# REIVILO Mentoria — Automação WhatsApp

Sistema Node.js para Railway com:

- WhatsApp via Baileys e QR Code em painel com login e senha.
- Sessão do WhatsApp persistida no PostgreSQL, sobrevivendo a redeploys.
- Menu inicial: saber mais, fazer parte e falar com atendente.
- Checkout Pro do Mercado Pago criado individualmente para cada contato.
- Webhook que consulta o pagamento no Mercado Pago e libera somente pagamentos `approved`.
- Inclusão automática no grupo exclusivo quando o número conectado é administrador.
- Fallback por link de convite quando a inclusão direta não for permitida.
- Painel de contatos, pagamentos, atendimento e disparos.

## Railway

1. Suba este projeto em um repositório GitHub.
2. Crie um serviço Railway a partir do repositório.
3. Adicione um PostgreSQL ao mesmo projeto.
4. Cadastre as variáveis descritas em `.env.example`.
5. Gere um domínio público e use esse domínio em `PUBLIC_BASE_URL`.
6. Abra `/admin/login`, entre e acesse **Conectar WhatsApp**.
7. Leia o QR Code apenas na primeira conexão. A sessão será salva no PostgreSQL.

## Mercado Pago

Use as credenciais de produção da aplicação Mercado Pago. No painel do Mercado Pago, configure a URL de notificações como:

`https://SEU-DOMINIO/webhooks/mercadopago`

Ative eventos de pagamentos e copie a assinatura secreta para `MERCADO_PAGO_WEBHOOK_SECRET`.

## Grupo do WhatsApp

O WhatsApp conectado ao sistema deve ser administrador do grupo. Defina o JID em `REIVILO_GROUP_JID`. Caso ainda não saiba o JID, mantenha essa variável vazia e use `REIVILO_GROUP_INVITE_LINK`; o cliente receberá o convite após o pagamento aprovado.

## Observação importante

A automação usa Baileys, uma integração não oficial do WhatsApp. Ela pode sofrer alterações ou bloqueios pela plataforma. Para operação comercial de longo prazo, considere migrar o envio de mensagens para a API oficial do WhatsApp Cloud; a lógica de pagamentos e banco pode ser reaproveitada.
