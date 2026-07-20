INSERT INTO app_settings (key, value, is_secret, updated_at)
VALUES (
  'about_message',
  '*SOBRE A REIVILO*

A REIVILO é uma metodologia fundamentada na *Arquitetura Humana*, criada para líderes, empresários e profissionais que compreendem que resultados consistentes nascem da estrutura que sustenta quem decide.

Mais do que desenvolver competências, a REIVILO fortalece identidade, amplia consciência e aprimora comunicação, posicionamento e presença.

Sua arquitetura prepara o indivíduo para exercer influência com autenticidade, autoridade e propósito, porque nenhum negócio, carreira ou legado cresce além da arquitetura de quem o conduz.

━━━━━━━━━━━━━━
*COMO FUNCIONA*
━━━━━━━━━━━━━━

📅 *9 encontros semanais*
🎥 *Aulas ao vivo e online*
⏱️ *2 horas de duração por aula*

Você participará de uma jornada estruturada, com encontros semanais em tempo real, para aprofundar os conteúdos e aplicar a metodologia de forma prática.

Digite *2* para fazer parte, *3* para falar com um atendente ou *MENU* para voltar.',
  FALSE,
  NOW()
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    is_secret = EXCLUDED.is_secret,
    updated_at = NOW();
