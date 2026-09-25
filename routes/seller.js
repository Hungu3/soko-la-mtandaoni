// routes/seller.js — Dashibodi ya Muuzaji (Duka Langu)
const express = require('express');
const router = express.Router();
const { db, sellerLimits, getSellerPricing, syncSellerSubscription } = require('../db/db');
const { requireSeller } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(requireSeller);

// ---------- Dashibodi ----------
router.get('/', (req, res) => {
  const s = res.locals.currentSeller;
  const idadiBidhaa = db.prepare('SELECT COUNT(*) c FROM products WHERE seller_id = ?').get(s.id).c;
  const maoniMapya = db.prepare(`SELECT COUNT(*) c FROM reviews WHERE seller_id = ? AND status = 'published'`).get(s.id).c;
  const maombiUsafirishaji = db.prepare(`SELECT * FROM delivery_requests WHERE seller_id = ? AND imefutwa = 0 ORDER BY created_at DESC LIMIT 5`).all(s.id);
  const limits = sellerLimits(s.tier);

  res.render('pages/seller/dashboard', {
    title: 'Duka Langu', idadiBidhaa, maoniMapya, maombiUsafirishaji, limits,
  });
});

// ---------- Mipangilio ya Duka ----------
router.get('/mipangilio', (req, res) => {
  res.render('pages/seller/mipangilio', { title: 'Mipangilio ya Duka' });
});

router.post('/mipangilio', upload.single('picha_duka'), (req, res) => {
  const s = res.locals.currentSeller;
  const { jina_duka, aina_bidhaa, location, maelezo_duka, siku_kufunguliwa, email, latitude, longitude, theme_color } = req.body;

  let sql = `UPDATE sellers SET jina_duka=?, aina_bidhaa=?, location=?, maelezo_duka=?, siku_kufunguliwa=?, email=?, theme_color=?`;
  const params = [jina_duka, aina_bidhaa, location, maelezo_duka, siku_kufunguliwa, email || null, ['indigo', 'emerald', 'sunset', 'ocean'].includes(theme_color) ? theme_color : 'indigo'];
  if (latitude && longitude) {
    sql += `, latitude=?, longitude=?`;
    params.push(Number(latitude), Number(longitude));
  }
  if (req.file) {
    sql += `, picha_duka=?`;
    params.push(req.file.filename);
  }
  sql += ` WHERE id = ?`;
  params.push(s.id);
  db.prepare(sql).run(...params);

  req.session.flashSuccess = 'Mipangilio ya duka imesasishwa.';
  res.redirect('/duka-langu/mipangilio');
});

// ---------- Bidhaa: Orodha ----------
router.get('/bidhaa', (req, res) => {
  const s = res.locals.currentSeller;
  const bidhaa = db.prepare('SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC').all(s.id);
  const limits = sellerLimits(s.tier);
  res.render('pages/seller/bidhaa-orodha', { title: 'Bidhaa Zangu', bidhaa, limits });
});

// ---------- Bidhaa: Ongeza ----------
router.get('/bidhaa/ongeza', (req, res) => {
  const s = res.locals.currentSeller;
  const idadiBidhaa = db.prepare('SELECT COUNT(*) c FROM products WHERE seller_id = ?').get(s.id).c;
  const limits = sellerLimits(s.tier);
  if (idadiBidhaa >= limits.bidhaa) {
    req.session.flashError = `Umefikia kikomo cha bidhaa ${limits.bidhaa} kwa kiwango cha ${s.tier}. Boresha (upgrade) kuongeza zaidi.`;
    return res.redirect('/duka-langu/upgrade');
  }
  res.render('pages/seller/bidhaa-form', { title: 'Ongeza Bidhaa', bidhaaItem: null, limits });
});

router.post('/bidhaa/ongeza', upload.array('picha', 10), (req, res) => {
  const s = res.locals.currentSeller;
  const limits = sellerLimits(s.tier);
  const idadiBidhaa = db.prepare('SELECT COUNT(*) c FROM products WHERE seller_id = ?').get(s.id).c;

  if (idadiBidhaa >= limits.bidhaa) {
    req.session.flashError = `Umefikia kikomo cha bidhaa ${limits.bidhaa}. Boresha kiwango chako.`;
    return res.redirect('/duka-langu/upgrade');
  }

  const { jina, kategoria, bei, maelezo, gharama_usafirishaji, idadi } = req.body;
  if (!jina || !bei) {
    req.session.flashError = 'Jina la bidhaa na bei ni lazima.';
    return res.redirect('/duka-langu/bidhaa/ongeza');
  }

  let picha = (req.files || []).map(f => f.filename);
  if (picha.length > limits.picha) {
    picha = picha.slice(0, limits.picha);
    req.session.flashError = `Kiwango chako (${s.tier}) kinaruhusu picha ${limits.picha} kwa bidhaa — picha za ziada hazikuhifadhiwa.`;
  }

  db.prepare(`INSERT INTO products (seller_id, jina, kategoria, bei, maelezo, gharama_usafirishaji, idadi, hali, picha)
              VALUES (?,?,?,?,?,?,?,'ipo',?)`)
    .run(s.id, jina.trim(), kategoria || null, Number(bei), maelezo || null, gharama_usafirishaji || null, Number(idadi) || 1, JSON.stringify(picha));

  req.session.flashSuccess = 'Bidhaa imeongezwa kwenye duka lako.';
  res.redirect('/duka-langu/bidhaa');
});

// ---------- Bidhaa: Hariri ----------
router.get('/bidhaa/:id/hariri', (req, res) => {
  const s = res.locals.currentSeller;
  const bidhaaItem = db.prepare('SELECT * FROM products WHERE id = ? AND seller_id = ?').get(req.params.id, s.id);
  if (!bidhaaItem) return res.redirect('/duka-langu/bidhaa');
  const limits = sellerLimits(s.tier);
  res.render('pages/seller/bidhaa-form', { title: 'Hariri Bidhaa', bidhaaItem, limits });
});

router.post('/bidhaa/:id/hariri', upload.array('picha', 10), (req, res) => {
  const s = res.locals.currentSeller;
  const bidhaaItem = db.prepare('SELECT * FROM products WHERE id = ? AND seller_id = ?').get(req.params.id, s.id);
  if (!bidhaaItem) return res.redirect('/duka-langu/bidhaa');

  const { jina, kategoria, bei, maelezo, gharama_usafirishaji, idadi, hali } = req.body;
  const limits = sellerLimits(s.tier);

  let picha = JSON.parse(bidhaaItem.picha || '[]');
  const mpya = (req.files || []).map(f => f.filename);
  if (mpya.length) {
    picha = [...picha, ...mpya].slice(0, limits.picha === Infinity ? undefined : limits.picha);
  }

  db.prepare(`UPDATE products SET jina=?, kategoria=?, bei=?, maelezo=?, gharama_usafirishaji=?, idadi=?, hali=?, picha=? WHERE id=?`)
    .run(jina, kategoria || null, Number(bei), maelezo || null, gharama_usafirishaji || null, Number(idadi) || 1, hali || 'ipo', JSON.stringify(picha), bidhaaItem.id);

  req.session.flashSuccess = 'Bidhaa imesasishwa.';
  res.redirect('/duka-langu/bidhaa');
});

router.post('/bidhaa/:id/futa', (req, res) => {
  const s = res.locals.currentSeller;
  db.prepare('DELETE FROM products WHERE id = ? AND seller_id = ?').run(req.params.id, s.id);
  req.session.flashSuccess = 'Bidhaa imeondolewa kwenye duka lako.';
  res.redirect('/duka-langu/bidhaa');
});

// ---------- Maoni (Reviews) — kutegemea kiwango ----------
router.get('/maoni', (req, res) => {
  const s = res.locals.currentSeller;
  if (s.tier === 'FREE') {
    return res.render('pages/seller/maoni-limited', { title: 'Maoni ya Wateja' });
  }
  const maoni = db.prepare(`SELECT * FROM reviews WHERE seller_id = ? ORDER BY created_at DESC`).all(s.id);
  const canReply = ['SILVER', 'GOLD'].includes(s.tier);
  res.render('pages/seller/maoni', { title: 'Maoni ya Wateja', maoni, canReply });
});

router.post('/maoni/:id/jibu', (req, res) => {
  const s = res.locals.currentSeller;
  if (!['SILVER', 'GOLD'].includes(s.tier)) {
    req.session.flashError = 'Kujibu maoni kunahitaji kiwango cha SILVER au GOLD.';
    return res.redirect('/duka-langu/maoni');
  }
  const review = db.prepare('SELECT * FROM reviews WHERE id = ? AND seller_id = ?').get(req.params.id, s.id);
  if (review) {
    db.prepare('UPDATE reviews SET jibu_muuzaji = ? WHERE id = ?').run(req.body.jibu, review.id);
    req.session.flashSuccess = 'Jibu lako limehifadhiwa.';
  }
  res.redirect('/duka-langu/maoni');
});

// ---------- Kuboresha Kiwango (Upgrade) ----------
router.get('/upgrade', (req, res) => {
  const seller = syncSellerSubscription(res.locals.currentSeller.id);
  const pricing = getSellerPricing();
  const requests = db.prepare(`SELECT * FROM upgrade_requests WHERE account_type='seller' AND account_id=? ORDER BY created_at DESC`).all(seller.id);
  res.render('pages/seller/upgrade', { title: 'Boresha Duka Lako', pricing, requests, seller });
});

router.post('/upgrade', (req, res) => {
  const s = res.locals.currentSeller;
  const { kiwango, njia_malipo, payment_ref } = req.body;
  const pricing = getSellerPricing();
  if (!['BRONZE', 'SILVER', 'GOLD'].includes(kiwango)) {
    req.session.flashError = 'Chagua kiwango sahihi.';
    return res.redirect('/duka-langu/upgrade');
  }
  if (!njia_malipo || !payment_ref || payment_ref.trim().length < 4) {
    req.session.flashError = 'Chagua njia ya malipo na weka namba ya muamala kabla ya kuendelea.';
    return res.redirect('/duka-langu/upgrade');
  }
  const started = new Date();
  const expires = new Date(started.getTime() + 30 * 86400000);
  db.prepare(`UPDATE sellers SET tier=?, subscription_tier=?, subscription_started_at=?, subscription_expires_at=?, renewal_prompted=0 WHERE id=?`)
    .run(kiwango, kiwango, started.toISOString(), expires.toISOString(), s.id);
  db.prepare(`UPDATE products SET online=1 WHERE seller_id=? AND imefutwa=0`).run(s.id);
  db.prepare(`INSERT INTO upgrade_requests (account_type, account_id, kiwango_kilichoombwa, njia_malipo, payment_ref, amount, status)
              VALUES ('seller', ?, ?, ?, ?, ?, 'approved')`).run(s.id, kiwango, njia_malipo, payment_ref.trim(), pricing[kiwango]);
  req.session.flashSuccess = `Malipo yamepokelewa. Duka lako limeboreshwa hadi ${kiwango} kwa siku 30.`;
  res.redirect('/duka-langu/upgrade');
});

// ---------- Maombi ya Usafirishaji kwa bidhaa za duka hili ----------
router.get('/usafirishaji', (req, res) => {
  const s = res.locals.currentSeller;
  const maombi = db.prepare(`SELECT dr.*, p.jina as bidhaa_jina FROM delivery_requests dr
    LEFT JOIN products p ON p.id = dr.product_id
    WHERE dr.seller_id = ? AND dr.imefutwa = 0 ORDER BY dr.created_at DESC`).all(s.id);
  res.render('pages/seller/usafirishaji', { title: 'Usafirishaji', maombi });
});

// KUMBUKA: Usafirishaji wa PUBLIC na PROTECTED sasa unaanzishwa na MNUNUZI aliyesajiliwa
// (kutoka kwenye ukurasa wa bidhaa), ili aunganishwe moja kwa moja na muuzaji na msafirishaji
// kukubaliana bei. Hapa muuzaji anaweza kurekodi usafirishaji wa PRIVATE tu (yeye/mnunuzi
// wanapanga wenyewe nje ya jukwaa).
router.post('/usafirishaji/ongeza', (req, res) => {
  const s = res.locals.currentSeller;
  const { buyer_name, buyer_simu, eneo_kuchukua, eneo_kupeleka } = req.body;
  db.prepare(`INSERT INTO delivery_requests (product_id, seller_id, aina, buyer_name, buyer_simu, eneo_kuchukua, eneo_kupeleka, status)
              VALUES (NULL, ?, 'private', ?, ?, ?, ?, 'imekubaliwa')`)
    .run(s.id, buyer_name || null, buyer_simu || null, eneo_kuchukua || null, eneo_kupeleka || null);
  req.session.flashSuccess = 'Usafirishaji wa Private umerekodiwa.';
  res.redirect('/duka-langu/usafirishaji');
});

module.exports = router;
