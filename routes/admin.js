// routes/admin.js — Paneli ya Mmiliki (Admin) na Wasimamizi (Staff)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, getSellerPricing, getDriverPricing, setSetting, deleteRecord, restoreRecord, recordAudit } = require('../db/db');
const { requireAdmin, requireOwner, currentActor } = require('../middleware/auth');
const upload = require('../middleware/upload');
const loginAttempts = new Map();

// ---------- Kuingia (Admin/Mmiliki AU Staff/Msimamizi) ----------
// Mtu anaweza kuingia kwa barua pepe AU namba ya simu, pamoja na password.
router.get('/ingia', (req, res) => {
  res.render('pages/admin/ingia', { title: 'Admin — Ingia', layout: false });
});

router.post('/ingia', (req, res) => {
  const utambulisho = (req.body.utambulisho || req.body.email || '').trim();
  const { password } = req.body;
  const key = `${req.ip}:${utambulisho.toLowerCase()}`;
  const attempt = loginAttempts.get(key);
  if (attempt && attempt.blockedUntil > Date.now()) {
    return res.status(429).render('pages/admin/ingia', { title: 'Admin — Ingia', layout: false, flashError: 'Majaribio mengi. Jaribu tena baada ya dakika chache.' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE email = ? OR simu = ?').get(utambulisho, utambulisho);
  if (admin && bcrypt.compareSync(password || '', admin.password_hash)) {
    loginAttempts.delete(key);
    req.session.adminId = admin.id;
    req.session.admin2faVerified = false;
    return res.redirect('/admin/2fa');
  }

  const staff = db.prepare('SELECT * FROM staff WHERE email = ? OR simu = ?').get(utambulisho, utambulisho);
  if (staff && bcrypt.compareSync(password || '', staff.password_hash)) {
    loginAttempts.delete(key);
    if (staff.status !== 'active') {
      req.session.flashError = 'Akaunti yako ya usimamizi imesimamishwa. Wasiliana na Mmiliki.';
      return res.redirect('/admin/ingia');
    }
    req.session.staffId = staff.id;
    req.session.admin2faVerified = false;
    return res.redirect('/admin/2fa');
  }

  const failed = attempt || { count: 0, blockedUntil: 0 };
  failed.count += 1;
  if (failed.count >= 5) { failed.blockedUntil = Date.now() + 10 * 60 * 1000; failed.count = 0; }
  loginAttempts.set(key, failed);
  req.session.flashError = 'Barua pepe/simu au password si sahihi.';
  res.redirect('/admin/ingia');
});

router.get('/2fa', (req, res) => {
  if (!req.session.adminId && !req.session.staffId) return res.redirect('/admin/ingia');
  res.render('pages/admin/2fa', { title: 'Uthibitisho wa Pili' });
});

router.post('/2fa', (req, res) => {
  if (!req.session.adminId && !req.session.staffId) return res.redirect('/admin/ingia');
  const expected = process.env.ADMIN_2FA_CODE;
  if (!expected || req.body.code !== expected) {
    req.session.flashError = 'Code ya uthibitisho wa pili si sahihi.';
    return res.redirect('/admin/2fa');
  }
  req.session.admin2faVerified = true;
  res.redirect('/admin');
});

router.use(requireAdmin);

router.use((req, res, next) => {
  if (req.method === 'POST') {
    const actor = currentActor(res);
    if (actor) {
      const safeBody = { ...req.body };
      ['password', 'code', 'payment_ref', 'payment_reference'].forEach(key => delete safeBody[key]);
      recordAudit(actor, `${req.method} ${req.path}`, 'admin_action', Number(req.params.id) || null, JSON.stringify(safeBody), req.ip);
    }
  }
  next();
});

router.get('/logs', requireOwner, (req, res) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 300').all();
  res.render('pages/admin/logs', { title: 'Audit Logs', logs });
});

// ---------- Dashibodi ----------
router.get('/', (req, res) => {
  const stats = {
    maduka: db.prepare(`SELECT COUNT(*) c FROM sellers WHERE status='approved' AND imefutwa=0`).get().c,
    wasafirishaji: db.prepare(`SELECT COUNT(*) c FROM drivers WHERE status='approved' AND imefutwa=0`).get().c,
    wanunuzi: db.prepare(`SELECT COUNT(*) c FROM buyers`).get().c,
    maduka_pending: db.prepare(`SELECT COUNT(*) c FROM sellers WHERE status='pending' AND imefutwa=0`).get().c,
    wasafirishaji_pending: db.prepare(`SELECT COUNT(*) c FROM drivers WHERE status='pending' AND imefutwa=0`).get().c,
    maoni_pending: db.prepare(`SELECT COUNT(*) c FROM reviews WHERE status='pending'`).get().c,
    malalamiko_wazi: db.prepare(`SELECT COUNT(*) c FROM complaints WHERE status='open'`).get().c,
    upgrade_pending: db.prepare(`SELECT COUNT(*) c FROM upgrade_requests WHERE status='pending'`).get().c,
    matangazo: db.prepare(`SELECT COUNT(*) c FROM matangazo WHERE active=1`).get().c,
    usafirishaji_yanaendelea: db.prepare(`SELECT COUNT(*) c FROM delivery_requests WHERE status IN ('inasubiri','imekubaliwa','inasafirishwa') AND imefutwa=0`).get().c,
  };

  let mapatoMuuzaji = 0, mapatoDereva = 0;
  const realizedRevenue = db.prepare(`SELECT COALESCE(SUM(amount),0) total FROM upgrade_requests WHERE status='approved'`).get().total
    + db.prepare(`SELECT COALESCE(SUM(kiasi_kilicholipwa),0) total FROM matangazo WHERE aina='ad' AND active=1`).get().total;
  const escrowBalance = db.prepare(`SELECT COALESCE(SUM(escrow_amount),0) total FROM delivery_requests WHERE payment_status='held'`).get().total;
  const disputeCount = db.prepare(`SELECT COUNT(*) c FROM disputes WHERE status NOT IN ('resolved','refunded')`).get().c;
  if (res.locals.isOwner) {
    const sellerPricing = getSellerPricing();
    const driverPricing = getDriverPricing();
    const sellers = db.prepare(`SELECT tier FROM sellers WHERE status='approved' AND imefutwa=0`).all();
    const drivers = db.prepare(`SELECT tier, aina_gari FROM drivers WHERE status='approved' AND imefutwa=0`).all();
    mapatoMuuzaji = sellers.reduce((sum, s) => sum + (sellerPricing[s.tier] || 0), 0);
    mapatoDereva = drivers.reduce((sum, d) => sum + ((driverPricing[d.aina_gari] || {})[d.tier] || 0), 0);
  }

  res.render('pages/admin/dashboard', { title: 'Admin Dashboard', stats, mapatoMuuzaji, mapatoDereva, realizedRevenue, escrowBalance, disputeCount });
});

// ---------- Wauzaji ----------
router.get('/wauzaji', (req, res) => {
  const filter = req.query.status || 'pending';
  const sql = filter === 'all'
    ? `SELECT * FROM sellers ORDER BY imefutwa ASC, created_at DESC`
    : `SELECT * FROM sellers WHERE status = ? ORDER BY imefutwa ASC, created_at DESC`;
  const wauzaji = filter === 'all' ? db.prepare(sql).all() : db.prepare(sql).all(filter);
  res.render('pages/admin/wauzaji', { title: 'Wauzaji', wauzaji, filter });
});

router.post('/wauzaji/:id/idhinisha', (req, res) => {
  db.prepare(`UPDATE sellers SET status='approved' WHERE id=?`).run(req.params.id);
  req.session.flashSuccess = 'Duka limeidhinishwa.';
  res.redirect('/admin/wauzaji');
});
router.post('/wauzaji/:id/kyc', requireOwner, (req, res) => {
  const status = ['verified', 'rejected', 'pending'].includes(req.body.status) ? req.body.status : 'pending';
  db.prepare(`UPDATE sellers SET kyc_status=?, kyc_reviewed_at=CURRENT_TIMESTAMP, kyc_reviewed_by=? WHERE id=?`)
    .run(status, res.locals.currentAdmin.email, req.params.id);
  req.session.flashSuccess = 'Hali ya KYC ya muuzaji imesasishwa.';
  res.redirect('/admin/wauzaji');
});
router.post('/wauzaji/:id/kataa', (req, res) => {
  db.prepare(`UPDATE sellers SET status='rejected' WHERE id=?`).run(req.params.id);
  req.session.flashSuccess = 'Ombi la duka limekataliwa.';
  res.redirect('/admin/wauzaji');
});
router.post('/wauzaji/:id/simamisha', (req, res) => {
  db.prepare(`UPDATE sellers SET status='suspended' WHERE id=?`).run(req.params.id);
  req.session.flashSuccess = 'Duka limesimamishwa.';
  res.redirect('/admin/wauzaji');
});
router.post('/wauzaji/:id/rejesha', (req, res) => {
  db.prepare(`UPDATE sellers SET status='approved', imefutwa=0, futwa_na=NULL, futwa_wakati=NULL WHERE id=?`).run(req.params.id);
  req.session.flashSuccess = 'Duka limerejeshwa.';
  res.redirect('/admin/wauzaji');
});
router.post('/wauzaji/:id/futa', (req, res) => {
  const matokeo = deleteRecord('sellers', req.params.id, currentActor(res));
  req.session.flashSuccess = matokeo === 'soft'
    ? 'Duka limefichwa kwenye jukwaa (ufutaji kamili unahitaji Mmiliki).'
    : 'Duka limefutwa kabisa.';
  res.redirect('/admin/wauzaji');
});

// ---------- Wasafirishaji ----------
router.get('/wasafirishaji', (req, res) => {
  const filter = req.query.status || 'pending';
  const sql = filter === 'all'
    ? `SELECT * FROM drivers ORDER BY imefutwa ASC, created_at DESC`
    : `SELECT * FROM drivers WHERE status = ? ORDER BY imefutwa ASC, created_at DESC`;
  const wasafirishaji = filter === 'all' ? db.prepare(sql).all() : db.prepare(sql).all(filter);
  res.render('pages/admin/wasafirishaji', { title: 'Wasafirishaji', wasafirishaji, filter });
});

router.post('/wasafirishaji/:id/idhinisha', (req, res) => {
  const driver = db.prepare('SELECT kyc_status FROM drivers WHERE id=?').get(req.params.id);
  if (!driver || driver.kyc_status !== 'verified') {
    req.session.flashError = 'Thibitisha KYC ya mwasafirishaji kwanza kabla ya kumruhusu kubeba mizigo.';
    return res.redirect('/admin/wasafirishaji');
  }
  db.prepare(`UPDATE drivers SET status='approved' WHERE id=?`).run(req.params.id);
  req.session.flashSuccess = 'Mwasafirishaji ameidhinishwa.';
  res.redirect('/admin/wasafirishaji');
});
router.post('/wasafirishaji/:id/kyc', requireOwner, (req, res) => {
  const status = ['verified', 'rejected', 'pending'].includes(req.body.status) ? req.body.status : 'pending';
  db.prepare(`UPDATE drivers SET kyc_status=?, kyc_reviewed_at=CURRENT_TIMESTAMP, kyc_reviewed_by=? WHERE id=?`)
    .run(status, res.locals.currentAdmin.email, req.params.id);
  req.session.flashSuccess = 'Hali ya KYC ya mwasafirishaji imesasishwa.';
  res.redirect('/admin/wasafirishaji');
});
router.post('/wasafirishaji/:id/kataa', (req, res) => {
  db.prepare(`UPDATE drivers SET status='rejected' WHERE id=?`).run(req.params.id);
  req.session.flashSuccess = 'Ombi limekataliwa.';
  res.redirect('/admin/wasafirishaji');
});
router.post('/wasafirishaji/:id/simamisha', (req, res) => {
  db.prepare(`UPDATE drivers SET status='suspended' WHERE id=?`).run(req.params.id);
  req.session.flashSuccess = 'Akaunti imesimamishwa.';
  res.redirect('/admin/wasafirishaji');
});
router.post('/wasafirishaji/:id/rejesha', (req, res) => {
  db.prepare(`UPDATE drivers SET status='approved', imefutwa=0, futwa_na=NULL, futwa_wakati=NULL WHERE id=?`).run(req.params.id);
  req.session.flashSuccess = 'Akaunti imerejeshwa.';
  res.redirect('/admin/wasafirishaji');
});
router.post('/wasafirishaji/:id/futa', (req, res) => {
  const matokeo = deleteRecord('drivers', req.params.id, currentActor(res));
  req.session.flashSuccess = matokeo === 'soft'
    ? 'Akaunti imefichwa kwenye jukwaa (ufutaji kamili unahitaji Mmiliki).'
    : 'Akaunti imefutwa kabisa.';
  res.redirect('/admin/wasafirishaji');
});

// ---------- Maoni (Reviews) ----------
router.get('/maoni', (req, res) => {
  const filter = req.query.status || 'pending';
  const maoni = db.prepare(`SELECT r.*, s.jina_duka FROM reviews r JOIN sellers s ON s.id = r.seller_id
    WHERE r.status = ? ORDER BY r.created_at DESC`).all(filter);
  res.render('pages/admin/maoni', { title: 'Maoni ya Wanunuzi', maoni, filter });
});
router.post('/maoni/:id/chapisha', (req, res) => {
  db.prepare(`UPDATE reviews SET status='published' WHERE id=?`).run(req.params.id);
  req.session.flashSuccess = 'Maoni yamechapishwa.';
  res.redirect('/admin/maoni');
});
router.post('/maoni/:id/kataa', (req, res) => {
  db.prepare(`UPDATE reviews SET status='rejected' WHERE id=?`).run(req.params.id);
  req.session.flashSuccess = 'Maoni yamekataliwa.';
  res.redirect('/admin/maoni');
});
router.post('/maoni/:id/futa', (req, res) => {
  const matokeo = deleteRecord('reviews', req.params.id, currentActor(res));
  req.session.flashSuccess = matokeo === 'soft' ? 'Maoni yamefichwa (Mmiliki bado anayaona).' : 'Maoni yamefutwa.';
  res.redirect('/admin/maoni');
});
router.post('/maoni/:id/rejesha', requireOwner, (req, res) => {
  restoreRecord('reviews', req.params.id);
  req.session.flashSuccess = 'Maoni yamerejeshwa.';
  res.redirect('/admin/maoni');
});

// ---------- Malalamiko ----------
router.get('/malalamiko', (req, res) => {
  const malalamiko = db.prepare(`SELECT c.*, s.jina_duka FROM complaints c LEFT JOIN sellers s ON s.id = c.seller_id
    ORDER BY c.created_at DESC`).all();
  res.render('pages/admin/malalamiko', { title: 'Malalamiko', malalamiko });
});
router.post('/malalamiko/:id/hali', (req, res) => {
  const { status } = req.body;
  db.prepare(`UPDATE complaints SET status=? WHERE id=?`).run(status, req.params.id);
  req.session.flashSuccess = 'Hali ya lalamiko imesasishwa.';
  res.redirect('/admin/malalamiko');
});

// ================= USAFIRISHAJI (Public/Protected/Private) — Wasimamizi & Mmiliki wanaona yote =================
router.get('/usafirishaji', (req, res) => {
  const filter = req.query.hali || 'zote';
  let sql = `SELECT dr.*, p.jina as bidhaa_jina, s.jina_duka, d.jina as driver_jina, b.jina as buyer_jina
    FROM delivery_requests dr
    LEFT JOIN products p ON p.id = dr.product_id
    LEFT JOIN sellers s ON s.id = dr.seller_id
    LEFT JOIN drivers d ON d.id = dr.driver_id
    LEFT JOIN buyers b ON b.id = dr.buyer_id`;
  const params = [];
  if (filter !== 'zote') { sql += ` WHERE dr.status = ?`; params.push(filter); }
  sql += ` ORDER BY dr.imefutwa ASC, dr.created_at DESC LIMIT 200`;
  const orodha = db.prepare(sql).all(...params);
  res.render('pages/admin/usafirishaji', { title: 'Usafirishaji (Ufuatiliaji Kamili)', orodha, filter });
});

router.get('/usafirishaji/:id', (req, res) => {
  const item = db.prepare(`SELECT dr.*, p.jina as bidhaa_jina, s.jina_duka, s.simu as seller_simu,
      d.jina as driver_jina, d.simu as driver_simu, b.jina as buyer_jina, b.simu as buyer_simu
    FROM delivery_requests dr
    LEFT JOIN products p ON p.id = dr.product_id
    LEFT JOIN sellers s ON s.id = dr.seller_id
    LEFT JOIN drivers d ON d.id = dr.driver_id
    LEFT JOIN buyers b ON b.id = dr.buyer_id
    WHERE dr.id = ?`).get(req.params.id);
  if (!item) return res.redirect('/admin/usafirishaji');
  const ujumbe = db.prepare(`SELECT * FROM delivery_notes WHERE delivery_id = ? ORDER BY created_at ASC`).all(item.id);
  res.render('pages/admin/usafirishaji-onyesho', { title: 'Usafirishaji #' + item.id, item, ujumbe });
});

router.post('/usafirishaji/:id/futa', (req, res) => {
  const matokeo = deleteRecord('delivery_requests', req.params.id, currentActor(res));
  req.session.flashSuccess = matokeo === 'soft'
    ? 'Rekodi hii ya usafirishaji imefichwa (bado inapatikana kwa Mmiliki tu — masuala ya usafirishaji ni nyeti).'
    : 'Rekodi ya usafirishaji imefutwa kabisa.';
  res.redirect('/admin/usafirishaji');
});
router.post('/usafirishaji/:id/rejesha', requireOwner, (req, res) => {
  restoreRecord('delivery_requests', req.params.id);
  req.session.flashSuccess = 'Rekodi imerejeshwa.';
  res.redirect('/admin/usafirishaji/' + req.params.id);
});

router.get('/migogoro', requireOwner, (req, res) => {
  const migogoro = db.prepare(`SELECT d.*, dr.escrow_amount, dr.payment_status, b.jina as buyer_name
    FROM disputes d JOIN delivery_requests dr ON dr.id=d.delivery_id
    LEFT JOIN buyers b ON b.id=d.buyer_id ORDER BY d.created_at DESC`).all();
  res.render('pages/admin/migogoro', { title: 'Migogoro na Refunds', migogoro });
});

router.post('/migogoro/:id/resolve', requireOwner, (req, res) => {
  const dispute = db.prepare('SELECT * FROM disputes WHERE id=?').get(req.params.id);
  if (!dispute) return res.redirect('/admin/migogoro');
  const decision = ['refund', 'release', 'under_review', 'escalated'].includes(req.body.decision) ? req.body.decision : 'under_review';
  const delivery = db.prepare('SELECT * FROM delivery_requests WHERE id=?').get(dispute.delivery_id);
  if (decision === 'refund') {
    db.prepare(`UPDATE delivery_requests SET payment_status='refunded', escrow_refunded_at=CURRENT_TIMESTAMP WHERE id=?`).run(delivery.id);
  } else if (decision === 'release' && delivery.payment_status === 'held') {
    db.prepare(`UPDATE delivery_requests SET payment_status='released', escrow_released_at=CURRENT_TIMESTAMP WHERE id=?`).run(delivery.id);
  }
  const finalStatus = decision === 'refund' ? 'refunded' : decision === 'release' ? 'resolved' : decision;
  db.prepare(`UPDATE disputes SET status=?, resolution=?, refund_amount=?, resolved_at=CASE WHEN ? IN ('refunded','resolved') THEN CURRENT_TIMESTAMP ELSE resolved_at END WHERE id=?`)
    .run(finalStatus, decision, decision === 'refund' ? delivery.escrow_amount : 0, finalStatus, dispute.id);
  req.session.flashSuccess = decision === 'refund' ? 'Refund imerekodiwa.' : 'Malipo yameachiliwa kwa muuzaji.';
  res.redirect('/admin/migogoro');
});

// ================= MAOMBI YA KUBORESHA KIWANGO (PESA — Mmiliki Pekee) =================
router.get('/upgrade', requireOwner, (req, res) => {
  const filter = req.query.status || 'pending';
  const maombi = db.prepare(`SELECT * FROM upgrade_requests WHERE status = ? ORDER BY created_at DESC`).all(filter);
  const enriched = maombi.map(m => {
    const account = m.account_type === 'seller'
      ? db.prepare('SELECT jina_duka as jina, simu FROM sellers WHERE id=?').get(m.account_id)
      : db.prepare('SELECT jina, simu FROM drivers WHERE id=?').get(m.account_id);
    return { ...m, account };
  });
  res.render('pages/admin/upgrade', { title: 'Maombi ya Kuboresha', maombi: enriched, filter });
});
router.post('/upgrade/:id/idhinisha', requireOwner, (req, res) => {
  const request = db.prepare('SELECT * FROM upgrade_requests WHERE id=?').get(req.params.id);
  if (request) {
    const table = request.account_type === 'seller' ? 'sellers' : 'drivers';
    db.prepare(`UPDATE ${table} SET tier=? WHERE id=?`).run(request.kiwango_kilichoombwa, request.account_id);
    db.prepare(`UPDATE upgrade_requests SET status='approved' WHERE id=?`).run(request.id);
    req.session.flashSuccess = `Kiwango kimeboreshwa hadi ${request.kiwango_kilichoombwa}.`;
  }
  res.redirect('/admin/upgrade');
});
router.post('/upgrade/:id/kataa', requireOwner, (req, res) => {
  db.prepare(`UPDATE upgrade_requests SET status='rejected' WHERE id=?`).run(req.params.id);
  req.session.flashSuccess = 'Ombi la upgrade limekataliwa.';
  res.redirect('/admin/upgrade');
});

// ================= MATANGAZO (Ads zilizolipiwa + Matangazo ya kawaida — picha/video) =================
router.get('/matangazo', (req, res) => {
  const matangazo = db.prepare(`SELECT * FROM matangazo ORDER BY created_at DESC`).all();
  res.render('pages/admin/matangazo', { title: 'Matangazo', matangazo });
});
router.post('/matangazo/ongeza', upload.images.single('picha_faili'), (req, res) => {
  const { kichwa, maelezo, kiungo, aina, muundo, video, mtangazaji, duration_days } = req.body;
  if (!kichwa) {
    req.session.flashError = 'Kichwa cha tangazo ni lazima.';
    return res.redirect('/admin/matangazo');
  }
  if (aina === 'ad' && res.locals.isStaff && !res.locals.isOwner) {
    req.session.flashError = 'Kuweka Ads (matangazo yanayolipiwa) ni jambo la kifedha — Mmiliki pekee.';
    return res.redirect('/admin/matangazo');
  }
  const picha = req.file ? req.file.filename : null;
    const days = Math.max(1, Math.min(365, Number(duration_days) || 7));
    const fileSizeMb = req.file ? req.file.size / (1024 * 1024) : 0;
    const amount = aina === 'ad' ? Math.ceil(Math.max(1, fileSizeMb) * days * 500) : 0;
    const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
      db.prepare(`INSERT INTO matangazo (kichwa, maelezo, kiungo, active, status, aina, muundo, picha, video, mtangazaji,
        kiasi_kilicholipwa, file_size_mb, duration_days, starts_at, expires_at)
        VALUES (?,?,?,0,'pending',?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?)`)
      .run(kichwa, maelezo || null, kiungo || null, aina === 'ad' ? 'ad' : 'kawaida', muundo || 'picha',
        picha, video || null, mtangazaji || null, amount, fileSizeMb, days, expiresAt);
  req.session.flashSuccess = 'Tangazo limeongezwa.';
  res.redirect('/admin/matangazo');
});
router.post('/matangazo/:id/approve', requireOwner, (req, res) => {
  db.prepare(`UPDATE matangazo SET status='approved', active=1 WHERE id=?`).run(req.params.id);
  req.session.flashSuccess = 'Tangazo limekaguliwa na kuchapishwa.';
  res.redirect('/admin/matangazo');
});
router.post('/matangazo/:id/toggle', (req, res) => {
  const m = db.prepare('SELECT * FROM matangazo WHERE id=?').get(req.params.id);
  if (m) db.prepare(`UPDATE matangazo SET active=? WHERE id=?`).run(m.active ? 0 : 1, m.id);
  res.redirect('/admin/matangazo');
});
router.post('/matangazo/:id/futa', (req, res) => {
  const m = db.prepare('SELECT * FROM matangazo WHERE id=?').get(req.params.id);
  if (m && m.aina === 'ad' && res.locals.isStaff && !res.locals.isOwner) {
    req.session.flashError = 'Kuondoa Ad iliyolipiwa ni jambo la kifedha — Mmiliki pekee.';
    return res.redirect('/admin/matangazo');
  }
  db.prepare(`DELETE FROM matangazo WHERE id=?`).run(req.params.id);
  res.redirect('/admin/matangazo');
});

// ---------- Bidhaa (udhibiti wa jumla) ----------
router.get('/bidhaa', (req, res) => {
  const bidhaa = db.prepare(`SELECT p.*, s.jina_duka FROM products p JOIN sellers s ON s.id = p.seller_id
    ORDER BY p.created_at DESC LIMIT 200`).all();
  res.render('pages/admin/bidhaa', { title: 'Bidhaa Zote', bidhaa });
});
router.post('/bidhaa/:id/futa', (req, res) => {
  const bidhaa = db.prepare('SELECT picha FROM products WHERE id=?').get(req.params.id);
  const matokeo = deleteRecord('products', req.params.id, currentActor(res));
  if (matokeo === 'hard' && bidhaa) {
    try { upload.removeFiles(JSON.parse(bidhaa.picha || '[]')); } catch { /* ignore invalid legacy image data */ }
  }
  req.session.flashSuccess = matokeo === 'soft' ? 'Bidhaa imefichwa.' : 'Bidhaa imeondolewa kwenye jukwaa.';
  res.redirect('/admin/bidhaa');
});

// ================= WASIMAMIZI (Staff) — Mmiliki Pekee Anaweza Kusajili/Kusimamia =================
router.get('/wasimamizi', requireOwner, (req, res) => {
  const wasimamizi = db.prepare(`SELECT * FROM staff ORDER BY created_at DESC`).all();
  res.render('pages/admin/wasimamizi', { title: 'Wasimamizi', wasimamizi });
});
router.post('/wasimamizi/ongeza', requireOwner, (req, res) => {
  const { jina, simu, email, dhima, password } = req.body;
  if (!jina || !simu || !email || !password) {
    req.session.flashError = 'Jaza jina, simu, barua pepe, na password ya msimamizi.';
    return res.redirect('/admin/wasimamizi');
  }
  const existing = db.prepare('SELECT id FROM staff WHERE simu = ? OR email = ?').get(simu.trim(), email.trim());
  if (existing) {
    req.session.flashError = 'Simu au barua pepe hii tayari imesajiliwa kama msimamizi.';
    return res.redirect('/admin/wasimamizi');
  }
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`INSERT INTO staff (jina, simu, email, password_hash, dhima, status) VALUES (?,?,?,?,?,'active')`)
    .run(jina.trim(), simu.trim(), email.trim(), hash, dhima || null);
  req.session.flashSuccess = 'Msimamizi mpya amesajiliwa. Ana ufikiaji wa kila kitu ISIPOKUWA masuala ya pesa.';
  res.redirect('/admin/wasimamizi');
});
router.post('/wasimamizi/:id/simamisha', requireOwner, (req, res) => {
  db.prepare(`UPDATE staff SET status='suspended' WHERE id=?`).run(req.params.id);
  req.session.flashSuccess = 'Msimamizi amesimamishwa.';
  res.redirect('/admin/wasimamizi');
});
router.post('/wasimamizi/:id/washa', requireOwner, (req, res) => {
  db.prepare(`UPDATE staff SET status='active' WHERE id=?`).run(req.params.id);
  req.session.flashSuccess = 'Msimamizi amerejeshwa.';
  res.redirect('/admin/wasimamizi');
});
router.post('/wasimamizi/:id/futa', requireOwner, (req, res) => {
  db.prepare(`DELETE FROM staff WHERE id=?`).run(req.params.id);
  req.session.flashSuccess = 'Msimamizi amefutwa kabisa.';
  res.redirect('/admin/wasimamizi');
});

// ================= MIPANGILIO YA ADA (PESA — Mmiliki Pekee) =================
router.get('/mipangilio', requireOwner, (req, res) => {
  const sellerPricing = getSellerPricing();
  const driverPricing = getDriverPricing();
  res.render('pages/admin/mipangilio', { title: 'Mipangilio ya Ada', sellerPricing, driverPricing, admin: res.locals.currentAdmin });
});
router.post('/mipangilio/ada-wauzaji', requireOwner, (req, res) => {
  const { BRONZE, SILVER, GOLD } = req.body;
  setSetting('seller_prices', { FREE: 0, BRONZE: Number(BRONZE), SILVER: Number(SILVER), GOLD: Number(GOLD) });
  req.session.flashSuccess = 'Ada za wauzaji zimesasishwa.';
  res.redirect('/admin/mipangilio');
});
router.post('/mipangilio/ada-wasafirishaji', requireOwner, (req, res) => {
  const pricing = getDriverPricing();
  ['bodaboda', 'gari_ndogo', 'gari_kubwa', 'lori'].forEach(aina => {
    pricing[aina] = {
      FREE: 0,
      BRONZE: Number(req.body[`${aina}_BRONZE`]),
      SILVER: Number(req.body[`${aina}_SILVER`]),
      GOLD: Number(req.body[`${aina}_GOLD`]),
    };
  });
  setSetting('driver_prices', pricing);
  req.session.flashSuccess = 'Ada za wasafirishaji zimesasishwa.';
  res.redirect('/admin/mipangilio');
});
router.post('/mipangilio/password', (req, res) => {
  const { password_mpya } = req.body;
  if (!res.locals.isOwner) {
    req.session.flashError = 'Huna ruhusa ya kubadilisha password hii.';
    return res.redirect('/admin/mipangilio');
  }
  if (password_mpya && password_mpya.length >= 6) {
    const hash = bcrypt.hashSync(password_mpya, 10);
    db.prepare('UPDATE admins SET password_hash=? WHERE id=?').run(hash, res.locals.currentAdmin.id);
    req.session.flashSuccess = 'Password ya admin imebadilishwa.';
  } else {
    req.session.flashError = 'Password lazima iwe na herufi/tarakimu angalau 6.';
  }
  res.redirect('/admin/mipangilio');
});

router.post('/toka', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/ingia'));
});

module.exports = router;
