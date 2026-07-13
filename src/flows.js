const { getOrCreateUser, updateUser, logMessage } = require('./db');
const { welcomeMessage, aboutMessage, checkoutIntro, supportMessage } = require('./templates');
const { createCheckoutForUser } = require('./mercadopago');

function normalize(value) {
  return String(value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

async function send(client, jid, text, userId) {
  await client.sendText(jid, text);
  await logMessage({ userId, whatsappJid: jid, direction: 'out', body: text });
}

async function handleIncomingMessage(client, message) {
  const jid = message.from;
  const text = String(message.body || '').trim();
  let user = await getOrCreateUser(jid);
  if (message.phone && !user.phone) user = await updateUser(user.id, { phone: message.phone });

  await logMessage({ userId: user.id, whatsappJid: jid, direction: 'in', body: text || '[mensagem sem texto]', raw: message.raw || null });

  // Enquanto o atendimento humano estiver aberto, o bot fica completamente silencioso.
  // A mensagem aparece na caixa de atendimento e não é tratada como MENU ou opção do funil.
  if (user.support_status === 'open' || user.onboarding_step === 'support') {
    await updateUser(user.id, {
      support_status: 'open',
      support_opened_at: user.support_opened_at || user.support_requested_at || new Date(),
      support_last_message_at: new Date(),
      support_unread_count: Number(user.support_unread_count || 0) + 1,
      lead_status: 'support'
    });
    return;
  }

  const n = normalize(text);

  if (!text || ['oi', 'ola', 'olá', 'menu', 'inicio', 'início', 'comecar', 'começar'].includes(n)) {
    await updateUser(user.id, { onboarding_step: 'main_menu', lead_status: user.payment_status === 'approved' ? 'customer' : 'engaged' });
    return send(client, jid, await welcomeMessage(), user.id);
  }

  if (n === '1' || n.includes('saber mais')) {
    await updateUser(user.id, { onboarding_step: 'about', lead_status: 'interested' });
    return send(client, jid, await aboutMessage(), user.id);
  }

  if (n === '2' || n.includes('quero fazer parte') || n.includes('pagamento')) {
    if (user.payment_status === 'approved') {
      return send(client, jid, '✅ Seu pagamento já está aprovado e sua participação na REIVILO está confirmada.', user.id);
    }
    await send(client, jid, await checkoutIntro(), user.id);
    try {
      const url = await createCheckoutForUser(user);
      return send(client, jid, `🔐 *Link de pagamento da Mentoria REIVILO*\n\n${url}\n\nApós a aprovação, você receberá a confirmação e o acesso ao grupo automaticamente.`, user.id);
    } catch (error) {
      console.error('Erro ao gerar checkout:', error);
      await updateUser(user.id, { payment_status: 'checkout_error' });
      return send(client, jid, 'Não consegui gerar o link agora. Nossa equipe já pode continuar seu atendimento. Digite *3* para falar com um atendente.', user.id);
    }
  }

  if (n === '3' || n.includes('atendente') || n.includes('suporte')) {
    await updateUser(user.id, {
      onboarding_step: 'support',
      lead_status: 'support',
      support_status: 'open',
      support_requested_at: user.support_requested_at || new Date(),
      support_opened_at: new Date(),
      support_closed_at: null,
      support_last_message_at: new Date(),
      support_unread_count: 0
    });
    return send(client, jid, await supportMessage(), user.id);
  }

  return send(client, jid, `Não consegui identificar essa opção.\n\n${await welcomeMessage()}`, user.id);
}

module.exports = { handleIncomingMessage };
