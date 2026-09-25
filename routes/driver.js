// routes/driver.js — Dashibodi ya Mwasafirishaji (Safari Yangu)
const express = require('express');
const router = express.Router();
const { db, driverLimits, getDriverPricing, syncDriverSubscription } = require('../db/db');
const { requireDriver } = require('../middleware/auth');

router.use(requireDriver);

router.get('/', (req, res) => {
  const d = res.locals.currentDriver;
  const limits = driverLimits(d.aina_gari, d.tier);
  const ordersMwezi = db.prepare(`SELECT COUNT(*) c FROM delivery_requests
    WHERE driver_id = ? AND status IN ('imekubaliwa','inasafirishwa','imewasili')
    AND created_at >= date('now','start of month')`).get(d.id).c;
  const zinazoendelea = db.prepare(`SELECT dr.*, p.jina as bidhaa_jina, s.jina_duka, s.location as seller_location
    FROM delivery_requests dr LEFT JOIN products p ON p.id = dr.product_id
    LEFT JOIN sellers s ON s.id = dr.seller_id
    WHERE dr.driver_id = ? AND dr.status IN ('imekubaliwa','inasafirishwa') AND dr.imefutwa = 0
    ORDER BY dr.created_at DESC`).all(d.id);

  res.render('pages/driver/dashboard', { title: 'Safari Yangu', limits, ordersMwezi, zinazoendelea });
});

// ---------- Maombi Mapya (Public Delivery, hayajapewa dereva bado) ----------
router.get('/maombi', (req, res) => {
  const d = res.locals.currentDriver;
  const limits = driverLimits(d.aina_gari, d.tier);
  const ordersMwezi = db.prepare(`SELECT COUNT(*) c FROM delivery_requests
    WHERE driver_id = ? AND status IN ('imekubaliwa','inasafirishwa','imewasili')
    AND created_at >= date('now','start of month')`).get(d.id).c;

  let maombi = [];
  let kikomoKimefikiwa = ordersMwezi >= limits.orders;
  if (!kikomoKimefikiwa) {
    maombi = db.prepare(`SELECT dr.*, p.jina as bidhaa_jina, s.jina_duka, s.location as seller_location
      FROM delivery_requests dr LEFT JOIN products p ON p.id = dr.product_id
      LEFT JOIN sellers s ON s.id = dr.seller_id
      WHERE dr.aina IN ('public','protected') AND dr.status = 'inasubiri' AND dr.driver_id IS NULL AND dr.imefutwa = 0
      ORDER BY dr.created_at ASC LIMIT 20`).all();
  }

  res.render('pages/driver/maombi', { title: 'Maombi ya Usafirishaji', maombi, kikomoKimefikiwa, limits, ordersMwezi });
});

router.post('/maombi/:id/kubali', (req, res) => {
  const d = res.locals.currentDriver;
  const limits = driverLimits(d.aina_gari, d.tier);
  const ordersMwezi = db.prepare(`SELECT COUNT(*) c FROM delivery_requests
    WHERE driver_id = ? AND status IN ('imekubaliwa','inasafirishwa','imewasili')
    AND created_at >= date('now','start of month')`).get(d.id).c;

  if (ordersMwezi >= limits.orders) {
    req.session.flashError = `Umefikia kikomo cha orders ${limits.orders} kwa mwezi huu. Boresha kiwango chako.`;
    return res.redirect('/safari-yangu/maombi');
  }

  const request = db.prepare(`SELECT * FROM delivery_requests WHERE id = ? AND status = 'inasubiri' AND driver_id IS NULL AND imefutwa = 0`).get(req.params.id);
  if (!request) {
    req.session.flashError = 'Ombi hili tayari limechukuliwa na mwasafirishaji mwingine.';
    return res.redirect('/safari-yangu/maombi');
  }
  db.prepare(`UPDATE delivery_requests SET driver_id = ?, status = 'imekubaliwa' WHERE id = ?`).run(d.id, request.id);
  db.prepare(`INSERT INTO delivery_notes (delivery_id, mtumaji_aina, mtumaji_jina, ujumbe)
              VALUES (?, 'msafirishaji', ?, 'Nimekubali kusafirisha order hii. Tuwasiliane kuhusu bei ya usafirishaji.')`)
    .run(request.id, d.jina);
  req.session.flashSuccess = 'Umekubali order! Nenda kwenye ukurasa wa mazungumzo kukubaliana bei ya usafirishaji na muuzaji/mnunuzi.';
  res.redirect('/usafirishaji/' + request.id);
});

router.post('/safari/:id/thibitisha-kuchukua', (req, res) => {
  const d = res.locals.currentDriver;
  const item = db.prepare(`SELECT * FROM delivery_requests WHERE id=? AND driver_id=?`).get(req.params.id, d.id);
  if (!item || item.pickup_code !== String(req.body.code || '').trim()) {
    req.session.flashError = 'Code ya kuchukua si sahihi.';
    return res.redirect('/usafirishaji/' + req.params.id);
  }
  db.prepare(`UPDATE delivery_requests SET verification_status='picked_up', pickup_verified_at=CURRENT_TIMESTAMP, status='inasafirishwa' WHERE id=?`).run(item.id);
  req.session.flashSuccess = 'Pickup imethibitishwa. Endelea na usafirishaji.';
  res.redirect('/usafirishaji/' + item.id);
});

router.post('/safari/:id/thibitisha-kufikisha', (req, res) => {
  const d = res.locals.currentDriver;
  const item = db.prepare(`SELECT * FROM delivery_requests WHERE id=? AND driver_id=?`).get(req.params.id, d.id);
  if (!item || item.delivery_code !== String(req.body.code || '').trim()) {
    req.session.flashError = 'Code ya kukabidhi si sahihi.';
    return res.redirect('/usafirishaji/' + req.params.id);
  }
  db.prepare(`UPDATE delivery_requests SET verification_status='delivered', delivery_verified_at=CURRENT_TIMESTAMP, status='imewasili', payment_status=CASE WHEN payment_status='held' THEN 'released' ELSE payment_status END, escrow_released_at=CASE WHEN payment_status='held' THEN CURRENT_TIMESTAMP ELSE escrow_released_at END WHERE id=?`).run(item.id);
  req.session.flashSuccess = 'Delivery imethibitishwa kwa code ya mnunuzi.';
  res.redirect('/usafirishaji/' + item.id);
});

router.post('/maombi/:id/kataa', (req, res) => {
  req.session.flashSuccess = 'Umekataa ombi hili.';
  res.redirect('/safari-yangu/maombi');
});

router.post('/safari/:id/inasafirishwa', (req, res) => {
  const d = res.locals.currentDriver;
  req.session.flashError = 'Tumia code ya pickup kuthibitisha kabla ya kuanza safari.';
  res.redirect('/usafirishaji/' + req.params.id);
});

router.post('/safari/:id/imewasili', (req, res) => {
  req.session.flashError = 'Tumia code ya delivery ya mnunuzi kuthibitisha kukabidhi.';
  res.redirect('/usafirishaji/' + req.params.id);
});

// ---------- Upgrade ----------
router.get('/upgrade', (req, res) => {
  const d = syncDriverSubscription(res.locals.currentDriver.id);
  const pricing = getDriverPricing()[d.aina_gari];
  const requests = db.prepare(`SELECT * FROM upgrade_requests WHERE account_type='driver' AND account_id=? ORDER BY created_at DESC`).all(d.id);
  res.render('pages/driver/upgrade', { title: 'Boresha Huduma Yako', pricing, requests });
});

router.post('/upgrade', (req, res) => {
  const d = res.locals.currentDriver;
  const { kiwango, njia_malipo, payment_ref } = req.body;
  const pricing = getDriverPricing()[d.aina_gari];
  if (!['BRONZE', 'SILVER', 'GOLD'].includes(kiwango)) {
    req.session.flashError = 'Chagua kiwango sahihi.';
    return res.redirect('/safari-yangu/upgrade');
  }
  if (!njia_malipo || !payment_ref || payment_ref.trim().length < 4) {
    req.session.flashError = 'Chagua njia ya malipo na weka namba ya muamala kabla ya kuendelea.';
    return res.redirect('/safari-yangu/upgrade');
  }
  const started = new Date();
  const expires = new Date(started.getTime() + 30 * 86400000);
  db.prepare(`UPDATE drivers SET tier=?, subscription_tier=?, subscription_started_at=?, subscription_expires_at=? WHERE id=?`)
    .run(kiwango, kiwango, started.toISOString(), expires.toISOString(), d.id);
  db.prepare(`INSERT INTO upgrade_requests (account_type, account_id, kiwango_kilichoombwa, njia_malipo, payment_ref, amount, status)
              VALUES ('driver', ?, ?, ?, ?, ?, 'approved')`).run(d.id, kiwango, njia_malipo, payment_ref.trim(), pricing[kiwango]);
  req.session.flashSuccess = `Malipo yamepokelewa. Huduma yako imeboreshwa hadi ${kiwango} kwa siku 30.`;
  res.redirect('/safari-yangu/upgrade');
});

module.exports = router;
