const express = require('express');
const { getBotState, startBotInBackground, stopBot, cleanSessionArtifacts, sendText } = require('../bot');
const { query, logMessage, updateUser, formatPhoneForAdmin } = require('../db');
const config = require('../config');
const router = express.Router();

function requireAuth(req, res, next) { return req.session?.adminLoggedIn ? next() : res.redirect('/admin/login'); }
function safeReturn(value, fallback='/admin') { return String(value || '').startsWith('/admin') ? value : fallback; }

router.use(async (req, res, next) => {
  try {
    const ready = await config.isSetupComplete();
    res.locals.setupComplete = ready;
    if (!ready && !['/setup'].includes(req.path)) return res.redirect('/admin/setup');
    if (ready && req.path === '/setup' && req.method === 'GET') return res.redirect('/admin/login');
    next();
  } catch (error) { next(error); }
});

router.get('/setup', (req, res) => res.render('admin/setup', { error: null }));
router.post('/setup', async (req, res, next) => {
  try {
    const ready = await config.isSetupComplete();
    if (ready) return res.redirect('/admin/login');
    const username = String(req.body.username || 'admin').trim();
    const password = String(req.body.password || '');
    const confirm = String(req.body.confirm_password || '');
    if (username.length < 3 || password.length < 8 || password !== confirm) {
      return res.status(400).render('admin/setup', { error: 'Use um usuário com 3 caracteres, senha com pelo menos 8 caracteres e confirme corretamente.' });
    }
    await config.setMany({
      admin_user: username,
      admin_password_hash: config.hashPassword(password),
      product_name: String(req.body.product_name || 'Mentoria REIVILO').trim(),
      price_brl: String(req.body.price_brl || '997,00').trim(),
      site_url: String(req.body.site_url || 'https://www.reivilo.com.br').trim(),
      group_jid: String(req.body.group_jid || '').trim(),
      group_invite_link: String(req.body.group_invite_link || '').trim()
    }, ['admin_password_hash']);
    req.session.adminLoggedIn = true;
    req.session.adminUser = username;
    res.redirect('/admin/settings');
  } catch (error) { next(error); }
});

router.get('/login', (req, res) => res.render('admin/login', { error: null }));
router.post('/login', async (req, res, next) => {
  try {
    const username = await config.get('admin_user', 'admin');
    const hash = await config.get('admin_password_hash', '');
    if (req.body.username === username && config.verifyPassword(req.body.password, hash)) {
      req.session.adminLoggedIn = true; req.session.adminUser = username; return res.redirect('/admin');
    }
    return res.status(401).render('admin/login', { error: 'Usuário ou senha inválidos.' });
  } catch (error) { next(error); }
});
router.post('/logout', requireAuth, (req, res) => req.session.destroy(() => res.redirect('/admin/login')));

router.get('/settings', requireAuth, async (req, res, next) => {
  try {
    const settings = await config.getMany(['admin_user','product_name','price_brl','site_url','group_jid','group_invite_link','welcome_message','about_message','checkout_intro','support_message']);
    res.render('admin/settings', { settings, saved: req.query.saved === '1', publicBaseUrl: config.publicBaseUrl(), hasMercadoPago: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN) });
  } catch (error) { next(error); }
});
router.post('/settings', requireAuth, async (req, res, next) => {
  try {
    const values = {};
    for (const key of ['admin_user','product_name','price_brl','site_url','group_jid','group_invite_link','welcome_message','about_message','checkout_intro','support_message']) values[key] = String(req.body[key] || '').trim();
    await config.setMany(values);
    const newPassword = String(req.body.new_password || '');
    if (newPassword) {
      if (newPassword.length < 8) return res.status(400).send('A nova senha precisa ter pelo menos 8 caracteres.');
      await config.set('admin_password_hash', config.hashPassword(newPassword), true);
    }
    req.session.adminUser = values.admin_user || req.session.adminUser;
    res.redirect('/admin/settings?saved=1');
  } catch (error) { next(error); }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const stats = (await query(`SELECT COUNT(*)::int AS leads, COUNT(*) FILTER (WHERE payment_status='approved')::int AS customers, COUNT(*) FILTER (WHERE payment_status='checkout_created')::int AS checkouts, COUNT(*) FILTER (WHERE support_requested_at IS NOT NULL)::int AS support, COUNT(*) FILTER (WHERE created_at >= NOW()-INTERVAL '7 days')::int AS new_7d FROM users`)).rows[0];
    const recentUsers = (await query('SELECT * FROM users ORDER BY created_at DESC LIMIT 12')).rows;
    const recentPayments = (await query(`SELECT p.*, u.phone, u.whatsapp_jid FROM payments p LEFT JOIN users u ON u.id=p.user_id ORDER BY p.updated_at DESC LIMIT 12`)).rows;
    res.render('admin/dashboard', { stats, bot: getBotState(), recentUsers, recentPayments, formatPhone: formatPhoneForAdmin });
  } catch (error) { next(error); }
});

router.post('/bot/start', requireAuth, (req, res) => { startBotInBackground(); res.redirect('/admin/qr'); });
router.post('/bot/restart-clean', requireAuth, async (req, res) => { await stopBot(); await cleanSessionArtifacts(); startBotInBackground({ cleanSession: true }); res.redirect('/admin/qr'); });
router.post('/bot/stop', requireAuth, async (req, res) => { await stopBot(); res.redirect('/admin/qr'); });
router.get('/qr', requireAuth, (req, res) => res.render('admin/qr', { bot: getBotState() }));
router.get('/users', requireAuth, async (req, res, next) => { try { const q=String(req.query.q||'').trim(),status=String(req.query.status||'').trim(),params=[],where=[]; if(q){params.push(`%${q}%`);where.push(`(phone ILIKE $${params.length} OR whatsapp_jid ILIKE $${params.length})`)} if(status){params.push(status);where.push(`payment_status=$${params.length}`)} const users=(await query(`SELECT * FROM users ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY created_at DESC LIMIT 300`,params)).rows; res.render('admin/users',{users,q,status,formatPhone:formatPhoneForAdmin}); }catch(error){next(error)} });
router.post('/users/:id/send', requireAuth, async (req,res,next)=>{try{const user=(await query('SELECT * FROM users WHERE id=$1',[req.params.id])).rows[0];const message=String(req.body.message||'').trim();if(user?.whatsapp_jid&&message){await sendText(user.whatsapp_jid,message);await logMessage({userId:user.id,whatsappJid:user.whatsapp_jid,direction:'out',body:message})}res.redirect(safeReturn(req.body.returnTo,'/admin/users'))}catch(e){next(e)}});
router.post('/users/:id/mark-paid', requireAuth, async (req,res,next)=>{try{await updateUser(req.params.id,{payment_status:'approved',lead_status:'customer',paid_at:new Date()});res.redirect('/admin/users')}catch(e){next(e)}});
router.get('/payments', requireAuth, async (req,res,next)=>{try{const payments=(await query(`SELECT p.*,u.phone,u.whatsapp_jid FROM payments p LEFT JOIN users u ON u.id=p.user_id ORDER BY p.updated_at DESC LIMIT 400`)).rows;res.render('admin/payments',{payments,formatPhone:formatPhoneForAdmin})}catch(e){next(e)}});
router.get('/support', requireAuth, async (req,res,next)=>{try{const users=(await query(`SELECT * FROM users WHERE support_requested_at IS NOT NULL ORDER BY support_requested_at DESC LIMIT 200`)).rows;res.render('admin/support',{users,formatPhone:formatPhoneForAdmin})}catch(e){next(e)}});
router.get('/broadcast', requireAuth, (req,res)=>res.render('admin/broadcast',{result:null}));
router.post('/broadcast', requireAuth, async(req,res,next)=>{try{const message=String(req.body.message||'').trim(),target=req.body.target||'all';if(message.length<3)return res.render('admin/broadcast',{result:'Digite uma mensagem válida.'});const where=target==='customers'?"payment_status='approved'":'TRUE';const users=(await query(`SELECT * FROM users WHERE ${where} AND whatsapp_jid IS NOT NULL ORDER BY last_interaction_at DESC LIMIT 500`)).rows;let sent=0;for(const user of users){try{await sendText(user.whatsapp_jid,message);sent++;await new Promise(r=>setTimeout(r,900))}catch(e){console.error(e.message)}}res.render('admin/broadcast',{result:`Mensagem enviada para ${sent} contato(s).`})}catch(e){next(e)}});
module.exports=router;
