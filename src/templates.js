function welcomeMessage() {
  return `Olá! Seja bem-vindo(a) à *REIVILO*, uma mentoria de reconstrução humana conduzida por *Mari Olivier*.\n\nEscolha uma opção:\n\n*1* — Saber mais sobre a REIVILO\n*2* — Quero fazer parte\n*3* — Falar com um atendente\n\nResponda apenas com o número da opção.`;
}
function aboutMessage() {
  return `*Sobre a REIVILO*\n\nA REIVILO é uma mentoria para pessoas que desejam reconstruir sua estrutura interna, fortalecer identidade, comunicação, comportamento e posicionamento humano.\n\nConheça mais em: https://www.reivilo.com.br\n\nDigite *2* para fazer parte, *3* para falar com um atendente ou *MENU* para voltar.`;
}
function checkoutIntro() {
  return `Que bom saber que você quer fazer parte da *REIVILO*.\n\nAo concluir o pagamento, nosso sistema reconhecerá a aprovação automaticamente e liberará seu acesso ao grupo exclusivo da mentoria.\n\nEstou gerando seu link seguro de pagamento...`;
}
function supportMessage() {
  return `Certo. Sua solicitação foi encaminhada para nossa equipe.\n\nEscreva abaixo sua dúvida ou mensagem. Um atendente continuará o contato por aqui.\n\nDigite *MENU* a qualquer momento para voltar ao início.`;
}
module.exports = { welcomeMessage, aboutMessage, checkoutIntro, supportMessage };
