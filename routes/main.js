// routes/main.js — Kurasa za wazi kwa kila mtu (Hakuna login inayohitajika, isipokuwa panapoonyeshwa)
const express = require('express');
const router = express.Router();
const { db, getSellerPricing, getDriverPricing, syncSellerSubscription } = require('../db/db');
const { requireBuyer } = require('../middleware/auth');

function verificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.use((req, res, next) => {
  db.prepare(`SELECT id FROM sellers WHERE subscription_tier <> 'FREE' AND subscription_expires_at <= CURRENT_TIMESTAMP`)
    .all().forEach(seller => syncSellerSubscription(seller.id));
  next();
});

// ---------- Ukurasa wa Nyumbani ----------
router.get('/', (req, res) => {
  // Matangazo yamegawanyika: "ads" (yaliyolipiwa) na "kawaida" (ya kijamii/matangazo ya kawaida) —
  // yote yanaonekana upande wa kulia (kama Facebook), yakiwa na picha au video + maelezo.
  const ads = db.prepare(`SELECT * FROM matangazo WHERE active = 1 AND imefutwa=0 AND status='approved' AND aina = 'ad' ORDER BY created_at DESC LIMIT 6`).all();
  const matangazoKawaida = db.prepare(`SELECT * FROM matangazo WHERE active = 1 AND imefutwa=0 AND status='approved' AND aina != 'ad' ORDER BY created_at DESC LIMIT 10`).all();

  const maduka = db.prepare(`SELECT * FROM sellers WHERE status = 'approved' AND imefutwa = 0
    ORDER BY CASE tier WHEN 'GOLD' THEN 4 WHEN 'SILVER' THEN 3 WHEN 'BRONZE' THEN 2 ELSE 1 END DESC, created_at DESC LIMIT 8`).all();
  const bidhaaMpya = db.prepare(`SELECT p.*, s.jina_duka, s.location FROM products p
    JOIN sellers s ON s.id = p.seller_id
    WHERE s.status = 'approved' AND s.imefutwa = 0 AND p.hali = 'ipo' AND p.idadi > 0 AND p.imefutwa = 0 AND COALESCE(p.online, 1) = 1
    ORDER BY p.created_at DESC LIMIT 8`).all();

  res.render('pages/home', {
    title: 'Soko la Mtandaoni — Nunua na Uza Popote Tanzania',
    ads, matangazoKawaida, maduka, bidhaaMpya,
  });
});

// ---------- Tafuta bidhaa/maduka ----------
router.get('/tafuta', (req, res) => {
  const q = (req.query.q || '').trim();
  const location = (req.query.location || '').trim();
  const kategoria = (req.query.kategoria || '').trim();

  let sql = `SELECT p.*, s.jina_duka, s.location, s.tier FROM products p
             JOIN sellers s ON s.id = p.seller_id
             WHERE s.status = 'approved' AND s.imefutwa = 0 AND p.hali = 'ipo' AND p.idadi > 0 AND p.imefutwa = 0 AND COALESCE(p.online, 1) = 1`;
  const params = [];
  if (q) {
    sql += ` AND (p.jina LIKE ? OR p.maelezo LIKE ? OR s.jina_duka LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (kategoria) {
    sql += ` AND p.kategoria LIKE ?`;
    params.push(`%${kategoria}%`);
  }
  if (location) {
    sql += ` AND s.location LIKE ?`;
    params.push(`%${location}%`);
  }
  sql += ` ORDER BY CASE s.tier WHEN 'GOLD' THEN 4 WHEN 'SILVER' THEN 3 WHEN 'BRONZE' THEN 2 ELSE 1 END DESC, p.created_at DESC LIMIT 60`;

  const matokeo = db.prepare(sql).all(...params);
  res.render('pages/tafuta', { title: `Matokeo ya "${q || kategoria || location || 'Bidhaa Zote'}"`, matokeo, q, kategoria, location });
});

// ---------- Ukurasa wa Duka ----------
router.get('/duka/:id', (req, res) => {
  const duka = db.prepare(`SELECT * FROM sellers WHERE id = ? AND status = 'approved' AND imefutwa = 0`).get(req.params.id);
  if (!duka) return res.status(404).render('pages/haipo', { title: 'Duka Halipo', ujumbe: 'Duka hili halipo au bado halijaidhinishwa.' });

  syncSellerSubscription(duka.id);
  const bidhaa = db.prepare(`SELECT * FROM products WHERE seller_id = ? AND hali='ipo' AND idadi>0 AND imefutwa = 0 AND COALESCE(online, 1) = 1 ORDER BY created_at DESC`).all(duka.id);
  const maoni = db.prepare(`SELECT * FROM reviews WHERE seller_id = ? AND status = 'published' AND imefutwa=0 ORDER BY created_at DESC LIMIT 20`).all(duka.id);
  const wastaniRating = maoni.length ? (maoni.reduce((a, r) => a + r.rating, 0) / maoni.length).toFixed(1) : null;

  res.render('pages/duka', { title: duka.jina_duka, duka, bidhaa, maoni, wastaniRating });
});

// ---------- Ukurasa wa Bidhaa ----------
router.get('/bidhaa/:id', (req, res) => {
  const bidhaa = db.prepare(`SELECT p.*, s.jina_duka, s.simu, s.location, s.tier, s.status as duka_status, s.imefutwa as duka_imefutwa
    FROM products p JOIN sellers s ON s.id = p.seller_id
    WHERE p.id = ? AND p.imefutwa=0 AND p.hali='ipo' AND p.idadi>0 AND COALESCE(p.online, 1) = 1`).get(req.params.id);
  if (!bidhaa || bidhaa.duka_status !== 'approved' || bidhaa.duka_imefutwa) {
    return res.status(404).render('pages/haipo', { title: 'Bidhaa Haipo', ujumbe: 'Bidhaa hii haipo au duka lake halijaidhinishwa.' });
  }
  const bidhaaZingine = db.prepare(`SELECT * FROM products WHERE seller_id = ? AND id != ? AND hali='ipo' AND idadi>0 AND imefutwa = 0 AND COALESCE(online, 1) = 1 ORDER BY created_at DESC LIMIT 4`).all(bidhaa.seller_id, bidhaa.id);
  res.render('pages/bidhaa', { title: bidhaa.jina, bidhaa, bidhaaZingine });
});

// ---------- Kuacha Maoni (Review) ----------
router.post('/bidhaa/:id/maoni', (req, res) => {
  const bidhaa = db.prepare(`SELECT p.* FROM products p JOIN sellers s ON s.id=p.seller_id
    WHERE p.id=? AND p.imefutwa=0 AND p.hali='ipo' AND p.idadi>0 AND COALESCE(p.online,1)=1
      AND s.status='approved' AND s.imefutwa=0`).get(req.params.id);
  if (!bidhaa) return res.redirect('/');
  const { buyer_name, rating, maoni } = req.body;
  if (!buyer_name || !maoni) {
    req.session.flashError = 'Tafadhali jaza jina lako na maoni yako.';
    return res.redirect(`/bidhaa/${bidhaa.id}#maoni`);
  }
  db.prepare(`INSERT INTO reviews (seller_id, product_id, buyer_name, rating, maoni, status)
              VALUES (?, ?, ?, ?, ?, 'pending')`)
    .run(bidhaa.seller_id, bidhaa.id, buyer_name.trim(), Math.min(5, Math.max(1, Number(rating) || 5)), maoni.trim());
  req.session.flashSuccess = 'Asante! Maoni yako yametumwa na yatapitiwa kabla ya kuchapishwa.';
  res.redirect(`/bidhaa/${bidhaa.id}#maoni`);
});

// ============================================================================
// USAFIRISHAJI WA PUBLIC / PROTECTED — mnunuzi LAZIMA awe amesajiliwa/ameingia.
// Mnunuzi, Muuzaji, na Msafirishaji wataunganishwa kwenye "mazungumzo" moja
// kukubaliana bei ya usafirishaji. Admin/Wasimamizi wanaona kila kitu.
// (Usafirishaji wa PRIVATE haupitii jukwaa hivyo hauhitaji hili — mnunuzi na
// muuzaji wanapanga wenyewe kama ilivyoelezwa kwenye ukurasa wa bidhaa.)
// ============================================================================

router.get('/bidhaa/:id/omba-usafirishaji', requireBuyer, (req, res) => {
  const aina = req.query.aina === 'protected' ? 'protected' : 'public';
  const bidhaa = db.prepare(`SELECT p.*, s.jina_duka, s.location as seller_location FROM products p
    JOIN sellers s ON s.id = p.seller_id WHERE p.id = ? AND p.imefutwa=0 AND p.hali='ipo' AND p.idadi>0
      AND COALESCE(p.online,1)=1 AND s.status='approved' AND s.imefutwa=0`).get(req.params.id);
  if (!bidhaa) return res.redirect('/');
  res.render('pages/omba-usafirishaji', { title: 'Omba Usafirishaji', bidhaa, aina });
});

router.post('/bidhaa/:id/omba-usafirishaji', requireBuyer, (req, res) => {
  const bidhaa = db.prepare(`SELECT p.* FROM products p JOIN sellers s ON s.id=p.seller_id
    WHERE p.id=? AND p.imefutwa=0 AND p.hali='ipo' AND p.idadi>0 AND COALESCE(p.online,1)=1
      AND s.status='approved' AND s.imefutwa=0`).get(req.params.id);
  if (!bidhaa) return res.redirect('/');
  const buyer = res.locals.currentBuyer;
  const { aina, eneo_kupeleka, gharama_iliyopendekezwa, kupeleka_lat, kupeleka_lng } = req.body;
  const ainaSalama = aina === 'protected' ? 'protected' : 'public';
  const priceText = typeof gharama_iliyopendekezwa === 'string' ? gharama_iliyopendekezwa.trim() : '';
  const proposedPrice = priceText ? Number(priceText) : null;
  const latitudeText = typeof kupeleka_lat === 'string' ? kupeleka_lat.trim() : '';
  const longitudeText = typeof kupeleka_lng === 'string' ? kupeleka_lng.trim() : '';
  const latitude = latitudeText ? Number(latitudeText) : null;
  const longitude = longitudeText ? Number(longitudeText) : null;

  if (typeof eneo_kupeleka !== 'string' || !eneo_kupeleka.trim() || eneo_kupeleka.trim().length > 300) {
    req.session.flashError = 'Tafadhali weka eneo la kupeleka bidhaa.';
    return res.redirect(`/bidhaa/${bidhaa.id}/omba-usafirishaji?aina=${ainaSalama}`);
  }
  if (priceText && (!Number.isFinite(proposedPrice) || proposedPrice < 0)) {
    req.session.flashError = 'Bei inayopendekezwa lazima iwe namba halali isiyo chini ya sifuri.';
    return res.redirect(`/bidhaa/${bidhaa.id}/omba-usafirishaji?aina=${ainaSalama}`);
  }
  if (Boolean(latitudeText) !== Boolean(longitudeText)
      || (latitudeText && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
        || !Number.isFinite(longitude) || longitude < -180 || longitude > 180))) {
    req.session.flashError = 'Eneo la ramani halijakamilika au coordinates si sahihi. Tafuta eneo tena.';
    return res.redirect(`/bidhaa/${bidhaa.id}/omba-usafirishaji?aina=${ainaSalama}`);
  }

  const info = db.prepare(`INSERT INTO delivery_requests
    (product_id, seller_id, aina, buyer_id, buyer_name, buyer_simu, eneo_kuchukua, eneo_kupeleka,
    kupeleka_lat, kupeleka_lng, gharama_iliyopendekezwa, pickup_code, delivery_code, status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, 'inasubiri')`)
    .run(bidhaa.id, bidhaa.seller_id, ainaSalama, buyer.id, buyer.jina, buyer.simu,
          null, eneo_kupeleka.trim(), latitude, longitude,
          proposedPrice, verificationCode(), verificationCode());

        if (proposedPrice !== null) {
    db.prepare(`INSERT INTO delivery_notes (delivery_id, mtumaji_aina, mtumaji_jina, ujumbe, bei_pendekezwa)
                VALUES (?, 'mnunuzi', ?, ?, ?)`)
            .run(info.lastInsertRowid, buyer.jina, 'Nimependekeza bei ya usafirishaji.', proposedPrice);
  }

  req.session.flashSuccess = 'Ombi lako la usafirishaji limetumwa. Utaunganishwa na muuzaji na msafirishaji kukubaliana bei.';
  res.redirect(`/usafirishaji/${info.lastInsertRowid}`);
});

// ---------- Ukurasa wa Mazungumzo ya Usafirishaji (Mnunuzi + Muuzaji + Msafirishaji) ----------
router.get('/usafirishaji/:id', (req, res) => {
  const item = db.prepare(`SELECT dr.*, p.jina as bidhaa_jina, s.jina_duka, s.simu as seller_simu, s.id as seller_id_ref,
      d.jina as driver_jina, d.simu as driver_simu, b.jina as buyer_jina_ref, b.id as buyer_id_ref
    FROM delivery_requests dr
    LEFT JOIN products p ON p.id = dr.product_id
    LEFT JOIN sellers s ON s.id = dr.seller_id
    LEFT JOIN drivers d ON d.id = dr.driver_id
    LEFT JOIN buyers b ON b.id = dr.buyer_id
    WHERE dr.id = ?`).get(req.params.id);
  if (!item) return res.redirect('/');

  // Ruhusa: mnunuzi mwenyewe, muuzaji husika, msafirishaji aliyepewa order, au Admin/Staff (wanatumia /admin/usafirishaji).
  const niMnunuzi = res.locals.currentBuyer && res.locals.currentBuyer.id === item.buyer_id;
  const niMuuzaji = res.locals.currentSeller && res.locals.currentSeller.id === item.seller_id;
  const niMsafirishaji = res.locals.currentDriver && res.locals.currentDriver.id === item.driver_id;
  const niMsimamizi = res.locals.isOwner || res.locals.isStaff;

  if (!niMnunuzi && !niMuuzaji && !niMsafirishaji && !niMsimamizi) {
    req.session.flashError = 'Huna ruhusa ya kuona mazungumzo haya ya usafirishaji.';
    return res.redirect('/');
  }

  const ujumbe = db.prepare(`SELECT * FROM delivery_notes WHERE delivery_id = ? ORDER BY created_at ASC`).all(item.id);
  const chat = db.prepare(`SELECT * FROM chat_messages WHERE delivery_id=? ORDER BY created_at ASC`).all(item.id);
  let miminiaina = 'admin';
  if (niMnunuzi) miminiaina = 'mnunuzi';
  else if (niMuuzaji) miminiaina = 'muuzaji';
  else if (niMsafirishaji) miminiaina = 'msafirishaji';

  const disputes = db.prepare('SELECT * FROM disputes WHERE delivery_id=? ORDER BY created_at DESC').all(item.id);
  res.render('pages/usafirishaji-thread', { title: 'Usafirishaji #' + item.id, item, ujumbe, chat, disputes, miminiaina, niMsimamizi });
});

router.post('/usafirishaji/:id/ujumbe', (req, res) => {
  const item = db.prepare('SELECT * FROM delivery_requests WHERE id = ?').get(req.params.id);
  if (!item) return res.redirect('/');

  const niMnunuzi = res.locals.currentBuyer && res.locals.currentBuyer.id === item.buyer_id;
  const niMuuzaji = res.locals.currentSeller && res.locals.currentSeller.id === item.seller_id;
  const niMsafirishaji = res.locals.currentDriver && res.locals.currentDriver.id === item.driver_id;
  const niMsimamizi = res.locals.isOwner || res.locals.isStaff;

  if (!niMnunuzi && !niMuuzaji && !niMsafirishaji && !niMsimamizi) {
    return res.redirect('/');
  }

  let mtumajiAina = 'admin', mtumajiJina = res.locals.isOwner ? res.locals.currentAdmin.jina : (res.locals.currentStaff ? res.locals.currentStaff.jina : 'Msimamizi');
  if (niMnunuzi) { mtumajiAina = 'mnunuzi'; mtumajiJina = res.locals.currentBuyer.jina; }
  else if (niMuuzaji) { mtumajiAina = 'muuzaji'; mtumajiJina = res.locals.currentSeller.jina_duka; }
  else if (niMsafirishaji) { mtumajiAina = 'msafirishaji'; mtumajiJina = res.locals.currentDriver.jina; }

  const ujumbe = typeof req.body.ujumbe === 'string' ? req.body.ujumbe.trim() : '';
  const priceText = typeof req.body.bei_pendekezwa === 'string' ? req.body.bei_pendekezwa.trim() : '';
  const kubali_bei = req.body.kubali_bei;
  const proposedPrice = priceText ? Number(priceText) : null;
  if (ujumbe.length > 2000 || (priceText && (!Number.isFinite(proposedPrice) || proposedPrice < 0))) {
    req.session.flashError = 'Ujumbe au bei umezidi kiwango au si sahihi.';
    return res.redirect('/usafirishaji/' + item.id);
  }

  if (ujumbe) {
    db.prepare(`INSERT INTO delivery_notes (delivery_id, mtumaji_aina, mtumaji_jina, ujumbe, bei_pendekezwa)
                VALUES (?,?,?,?,?)`)
      .run(item.id, mtumajiAina, mtumajiJina, ujumbe, proposedPrice);
  }
  if (proposedPrice !== null) {
    db.prepare(`UPDATE delivery_requests SET gharama_iliyopendekezwa = ?, gharama_imekubaliwa=0 WHERE id = ?`).run(proposedPrice, item.id);
  }
  if (kubali_bei === '1' && (niMnunuzi || niMuuzaji)) {
    db.prepare(`UPDATE delivery_requests SET gharama_imekubaliwa = 1 WHERE id = ?`).run(item.id);
    db.prepare(`INSERT INTO delivery_notes (delivery_id, mtumaji_aina, mtumaji_jina, ujumbe)
                VALUES (?,?,?,'Amekubali bei ya usafirishaji iliyopendekezwa.')`).run(item.id, mtumajiAina, mtumajiJina);
  }

  res.redirect('/usafirishaji/' + item.id);
});

router.post('/usafirishaji/:id/chat', (req, res) => {
  const item = db.prepare('SELECT * FROM delivery_requests WHERE id=?').get(req.params.id);
  if (!item) return res.redirect('/');
  const participants = [
    res.locals.currentBuyer && { type: 'buyer', id: res.locals.currentBuyer.id, name: res.locals.currentBuyer.jina },
    res.locals.currentSeller && { type: 'seller', id: res.locals.currentSeller.id, name: res.locals.currentSeller.jina_duka },
    res.locals.currentDriver && { type: 'driver', id: res.locals.currentDriver.id, name: res.locals.currentDriver.jina },
  ].filter(Boolean);
  const participant = participants.find(p => (p.type === 'buyer' && p.id === item.buyer_id) || (p.type === 'seller' && p.id === item.seller_id) || (p.type === 'driver' && p.id === item.driver_id));
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  if (!participant || !message || message.length > 2000) return res.redirect('/usafirishaji/' + item.id);
  db.prepare(`INSERT INTO chat_messages (delivery_id, sender_type, sender_id, sender_name, message) VALUES (?,?,?,?,?)`)
    .run(item.id, participant.type, participant.id, participant.name, message);
  res.redirect('/usafirishaji/' + item.id);
});

router.post('/usafirishaji/:id/dispute', requireBuyer, (req, res) => {
  const item = db.prepare('SELECT * FROM delivery_requests WHERE id=? AND buyer_id=?').get(req.params.id, res.locals.currentBuyer.id);
  if (!item) return res.redirect('/');
  const openDispute = db.prepare(`SELECT id FROM disputes WHERE delivery_id=? AND status NOT IN ('resolved','refunded')`).get(item.id);
  if (openDispute) {
    req.session.flashError = 'Tayari kuna mgogoro unaosubiri kushughulikiwa kwenye oda hii.';
    return res.redirect('/usafirishaji/' + item.id);
  }
  if (!req.body.details || !req.body.details.trim()) {
    req.session.flashError = 'Eleza kwa kifupi sababu ya kufungua mgogoro.';
    return res.redirect('/usafirishaji/' + item.id);
  }
  db.prepare(`INSERT INTO disputes (delivery_id, buyer_id, reason, details) VALUES (?,?,?,?)`)
    .run(item.id, res.locals.currentBuyer.id, ['item_not_received', 'item_damaged', 'wrong_item', 'other'].includes(req.body.reason) ? req.body.reason : 'other', req.body.details.trim());
  req.session.flashSuccess = 'Mgogoro umefunguliwa na umepelekwa kwa Admin.';
  res.redirect('/usafirishaji/' + item.id);
});

router.post('/usafirishaji/:id/payment', requireBuyer, (req, res) => {
  const item = db.prepare('SELECT * FROM delivery_requests WHERE id=? AND buyer_id=?').get(req.params.id, res.locals.currentBuyer.id);
  if (!item || !item.gharama_imekubaliwa || item.payment_status !== 'not_started') return res.redirect('/usafirishaji/' + req.params.id);
  const amount = Number(req.body.amount);
  const agreedAmount = Number(item.gharama_iliyopendekezwa);
  const reference = typeof req.body.payment_reference === 'string' ? req.body.payment_reference.trim() : '';
  if (!Number.isFinite(amount) || amount <= 0 || amount !== agreedAmount || reference.length < 4 || reference.length > 120) {
    req.session.flashError = 'Kiasi lazima kilingane na bei iliyokubaliwa, na payment reference iwe sahihi.';
    return res.redirect('/usafirishaji/' + item.id);
  }
  const result = db.prepare(`UPDATE delivery_requests SET payment_status='reported', payment_reference=?, escrow_amount=?
    WHERE id=? AND buyer_id=? AND gharama_imekubaliwa=1 AND payment_status='not_started'`)
    .run(reference, amount, item.id, res.locals.currentBuyer.id);
  if (!result.changes) {
    req.session.flashError = 'Taarifa ya malipo tayari imewasilishwa au oda imebadilika.';
    return res.redirect('/usafirishaji/' + item.id);
  }
  req.session.flashSuccess = 'Reference imepokelewa na inasubiri Mmiliki ahakiki malipo. Pesa hazijathibitishwa na mfumo wa malipo.';
  res.redirect('/usafirishaji/' + item.id);
});

// ---------- Malalamiko ----------
router.get('/malalamiko', (req, res) => {
  const maduka = db.prepare(`SELECT id, jina_duka FROM sellers WHERE status = 'approved' AND imefutwa = 0 ORDER BY jina_duka`).all();
  res.render('pages/malalamiko', { title: 'Tuma Malalamiko', maduka });
});
router.post('/malalamiko', (req, res) => {
  const { jina, simu, seller_id, maelezo } = req.body;
  if (!jina || !maelezo) {
    req.session.flashError = 'Tafadhali jaza jina lako na maelezo ya malalamiko.';
    return res.redirect('/malalamiko');
  }
  db.prepare(`INSERT INTO complaints (seller_id, jina, simu, maelezo) VALUES (?,?,?,?)`)
    .run(seller_id || null, jina.trim(), simu || '', maelezo.trim());
  req.session.flashSuccess = 'Malalamiko yako yamepokelewa. Tutawasiliana ndani ya saa 48.';
  res.redirect('/malalamiko');
});

// ---------- Viwango vya Usajili (Bei) ----------
router.get('/viwango', (req, res) => {
  const sellerPricing = getSellerPricing();
  const driverPricing = getDriverPricing();
  res.render('pages/viwango', { title: 'Viwango vya Usajili', sellerPricing, driverPricing });
});

// ---------- Kuhusu / Jinsi Inavyofanya Kazi ----------
router.get('/kuhusu', (req, res) => {
  res.render('pages/kuhusu', { title: 'Kuhusu Soko la Mtandaoni' });
});

router.get('/mwongozo', (req, res) => {
  const tutorials = [
    { title: 'Mwongozo wa Mnunuzi', description: 'Kutafuta bidhaa, kuwasiliana na muuzaji na kuomba usafirishaji.', videoId: process.env.SOKO_TUTORIAL_BUYER },
    { title: 'Mwongozo wa Muuzaji', description: 'Kufungua duka, kuweka eneo, kusimamia bidhaa na kushughulikia oda.', videoId: process.env.SOKO_TUTORIAL_SELLER },
    { title: 'Mwongozo wa Mwasafirishaji', description: 'Kukamilisha usajili, kupokea safari na kuthibitisha pickup na delivery.', videoId: process.env.SOKO_TUTORIAL_DRIVER },
    { title: 'Mwongozo wa Msimamizi', description: 'Kusimamia maombi, matangazo, malalamiko na kazi za kila siku.', videoId: process.env.SOKO_TUTORIAL_ADMIN },
  ].map(tutorial => ({
    ...tutorial,
    embedUrl: /^[A-Za-z0-9_-]{11}$/.test(tutorial.videoId || '')
      ? `https://www.youtube-nocookie.com/embed/${tutorial.videoId}`
      : null,
  }));
  res.render('pages/mwongozo', { title: 'Video za Mwongozo', tutorials });
});

router.get('/privacy', (req, res) => {
  res.render('pages/privacy', { title: 'Privacy Policy' });
});

router.get('/terms', (req, res) => {
  res.render('pages/terms', { title: 'Terms of Service' });
});

module.exports = router;
