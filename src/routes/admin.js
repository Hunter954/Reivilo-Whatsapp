const express = require('express');
const { getBotState, startBotInBackground, stopBot, cleanSessionArtifacts, sendText } = require('../bot');
const { query, logMessage, updateUser, formatPhoneForAdmin } = require('../db');
const router = express.Router();

function requireAuth(req, res, next) { return req.session?.adminLoggedIn ? next() : res.redirect('/admin/login'); }
function safeReturn(value, fallback='/admin') { return String(value || '').startsWith('/admin') ? value : fallback; }

router.get('/login', (req, res) => res.render('admin/login', { error: null }));
router.post('/login', (req, res) => {
  if (req.body.username === (process.env.ADMIN_USER || 'admin') && req.body.password === (process.env.ADMIN_PASSWORD || 'troque-esta-senha')) {
    req.session.adminLoggedIn = true; req.session.adminUser = req.body.username; return res.redirect('/admin');
  }
  return res.status(401).render('admin/login', { error: 'Usuário ou senha inválidos.' });
});
router.post('/logout', requireAuth, (req, res) => req.session.destroy(() => res.redirect('/admin/login')));

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const stats = (await query(`SELECT
      COUNT(*)::int AS leads,
      COUNT(*) FILTER (WHERE payment_status='approved')::int AS customers,
      COUNT(*) FILTER (WHERE payment_status='checkout_created')::int AS checkouts,
      COUNT(*) FILTER (WHERE support_requested_at IS NOT NULL)::int AS support,
      COUNT(*) FILTER (WHERE created_at >= NOW()-INTERVAL '7 days')::int AS new_7d
      FROM users`)).rows[0];
    const recentUsers = (await query('SELECT * FROM users ORDER BY created_at DESC LIMIT 12')).rows;
    const recentPayments = (await query(`SELECT p.*, u.phone, u.whatsapp_jid FROM payments p LEFT JOIN users u ON u.id=p.user_id ORDER BY p.updated_at DESC LIMIT 12`)).rows;
    res.render('admin/dashboard', { stats, bot: getBotState(), recentUsers, recentPayments, formatPhone: formatPhoneForAdmin });
  } catch (error) { next(error); }
});

router.post('/bot/start', requireAuth, (req, res) => { startBotInBackground(); res.redirect('/admin/qr'); });
router.post('/bot/restart-clean', requireAuth, async (req, res) => { await stopBot(); await cleanSessionArtifacts(); startBotInBackground({ cleanSession: true }); res.redirect('/admin/qr'); });
router.post('/bot/stop', requireAuth, async (req, res) => { await stopBot(); res.redirect('/admin/qr'); });
router.get('/qr', requireAuth, (req, res) => res.render('admin/qr', { bot: getBotState() }));

router.get('/users', requireAuth, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim(); const status = String(req.query.status || '').trim();
    const params=[]; const where=[];
    if (q) { params.push(`%${q}%`); where.push(`(phone ILIKE $${params.length} OR whatsapp_jid ILIKE $${params.length})`); }
    if (status) { params.push(status); where.push(`payment_status=$${params.length}`); }
    const users=(await query(`SELECT * FROM users ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY created_at DESC LIMIT 300`,params)).rows;
    res.render('admin/users', { users, q, status, formatPhone: formatPhoneForAdmin });
  } catch(error){ next(error); }
});
router.post('/users/:id/send', requireAuth, async (req,res,next)=>{ try{
  const user=(await query('SELECT * FROM users WHERE id=$1',[req.params.id])).rows[0];
  const message=String(req.body.message||'').trim();
  if(user?.whatsapp_jid&&message){ await sendText(user.whatsapp_jid,message); await logMessage({userId:user.id,whatsappJid:user.whatsapp_jid,direction:'out',body:message}); }
  res.redirect(safeReturn(req.body.returnTo,'/admin/users'));
}catch(e){next(e)}});
router.post('/users/:id/mark-paid', requireAuth, async (req,res,next)=>{try{ await updateUser(req.params.id,{payment_status:'approved',lead_status:'customer',paid_at:new Date()}); res.redirect('/admin/users'); }catch(e){next(e)}});

router.get('/payments', requireAuth, async (req,res,next)=>{try{
  const payments=(await query(`SELECT p.*,u.phone,u.whatsapp_jid FROM payments p LEFT JOIN users u ON u.id=p.user_id ORDER BY p.updated_at DESC LIMIT 400`)).rows;
  res.render('admin/payments',{payments,formatPhone:formatPhoneForAdmin});
}catch(e){next(e)}});
router.get('/support', requireAuth, async (req,res,next)=>{try{
  const users=(await query(`SELECT * FROM users WHERE support_requested_at IS NOT NULL ORDER BY support_requested_at DESC LIMIT 200`)).rows;
  res.render('admin/support',{users,formatPhone:formatPhoneForAdmin});
}catch(e){next(e)}});
router.get('/broadcast', requireAuth, (req,res)=>res.render('admin/broadcast',{result:null}));
router.post('/broadcast', requireAuth, async(req,res,next)=>{try{
  const message=String(req.body.message||'').trim(); const target=req.body.target||'all';
  if(message.length<3)return res.render('admin/broadcast',{result:'Digite uma mensagem válida.'});
  const where=target==='customers'?"payment_status='approved'":"TRUE";
  const users=(await query(`SELECT * FROM users WHERE ${where} AND whatsapp_jid IS NOT NULL ORDER BY last_interaction_at DESC LIMIT 500`)).rows;
  let sent=0; for(const user of users){try{await sendText(user.whatsapp_jid,message);sent++;await new Promise(r=>setTimeout(r,900));}catch(e){console.error(e.message)}}
  res.render('admin/broadcast',{result:`Mensagem enviada para ${sent} contato(s).`});
}catch(e){next(e)}});
module.exports=router;
