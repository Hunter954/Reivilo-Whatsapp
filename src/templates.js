const config = require('./config');

async function welcomeMessage() {
  const custom = await config.get('welcome_message', '');
  if (custom) return custom;
  return `Olá! Seja bem-vindo(a) à *REIVILO*, uma mentoria de reconstrução humana conduzida por *Mari Olivier*.\n\nEscolha uma opção:\n\n*1* — Saber mais sobre a REIVILO\n*2* — Quero fazer parte\n*3* — Falar com um atendente\n\nResponda apenas com o número da opção.`;
}

async function aboutMessage() {
  const custom = await config.get('about_message', '');
  if (custom) return custom;
  return `*SOBRE A REIVILO*\n\nA REIVILO é uma metodologia fundamentada na *Arquitetura Humana*, criada para líderes, empresários e profissionais que compreendem que resultados consistentes nascem da estrutura que sustenta quem decide.\n\nMais do que desenvolver competências, a REIVILO fortalece identidade, amplia consciência e aprimora comunicação, posicionamento e presença.\n\nSua arquitetura prepara o indivíduo para exercer influência com autenticidade, autoridade e propósito, porque nenhum negócio, carreira ou legado cresce além da arquitetura de quem o conduz.\n\n━━━━━━━━━━━━━━\n*COMO FUNCIONA*\n━━━━━━━━━━━━━━\n\n📅 *9 encontros semanais*\n🎥 *Aulas ao vivo e online*\n⏱️ *2 horas de duração por aula*\n\nVocê participará de uma jornada estruturada, com encontros semanais em tempo real, para aprofundar os conteúdos e aplicar a metodologia de forma prática.\n\nDigite *2* para fazer parte, *3* para falar com um atendente ou *MENU* para voltar.`;
}

async function checkoutIntro() {
  const custom = await config.get('checkout_intro', '');
  return custom || `Que bom saber que você quer fazer parte da *REIVILO*.\n\nAo concluir o pagamento, nosso sistema reconhecerá a aprovação automaticamente e liberará seu acesso ao grupo exclusivo da mentoria.\n\nEstou gerando seu link seguro de pagamento...`;
}

async function supportMessage() {
  const custom = await config.get('support_message', '');
  return custom || `Certo. Sua solicitação foi encaminhada para nossa equipe.\n\nEscreva abaixo sua dúvida ou mensagem. Um atendente continuará o contato por aqui.\n\nDigite *MENU* a qualquer momento para voltar ao início.`;
}

module.exports = { welcomeMessage, aboutMessage, checkoutIntro, supportMessage };
