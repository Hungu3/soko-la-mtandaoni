// routes/auth.js — Usajili na kuingia kwa Wauzaji, Wasafirishaji, Wanunuzi
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../db/db');
const upload = require('../middleware/upload');

// =================== USAJILI WA MUUZAJI ===================
router.get('/jisajili/muuzaji', (req, res) => {
  res.render('pages/jisajili-muuzaji', { title: 'Jisajili — Fungua Duka' });
});

router.post('/jisajili/muuzaji', upload.fields([{ name: 'kitambulisho', maxCount: 1 }, { name: 'picha_duka', maxCount: 1 }]), (req, res) => {
  const { jina_duka, aina_bidhaa, simu, email, location, password, siku_kufunguliwa, maelezo_duka, latitude, longitude } = req.body;

  // Taarifa zote ni za lazima kwa ajili ya usalama na ukamilifu wa akaunti
  if (!jina_duka || !aina_bidhaa || !simu || !email || !location || !password || !siku_kufunguliwa || !maelezo_duka || !latitude || !longitude) {
    req.session.flashError = 'Tafadhali jaza taarifa ZOTE zilizoombwa (ikiwemo eneo kwenye ramani) — ni za lazima kwa ajili ya usalama.';
    return res.redirect('/jisajili/muuzaji');
  }
  if (!req.files?.kitambulisho?.[0]) {
    req.session.flashError = 'Tafadhali pakia nakala ya kitambulisho — ni ya lazima.';
    return res.redirect('/jisajili/muuzaji');
  }
  if (!req.files?.picha_duka?.[0]) {
    req.session.flashError = 'Tafadhali pakia picha ya duka/nembo — ni ya lazima.';
    return res.redirect('/jisajili/muuzaji');
  }
  const existing = db.prepare('SELECT id FROM sellers WHERE simu = ? OR email = ?').get(simu.trim(), email.trim());
  if (existing) {
    req.session.flashError = 'Namba ya simu au barua pepe hii tayari imesajiliwa kama duka.';
    return res.redirect('/jisajili/muuzaji');
  }

  const kitambulisho = req.files.kitambulisho[0].filename;
  const picha_duka = req.files.picha_duka[0].filename;
  const hash = bcrypt.hashSync(password, 10);

  const info = db.prepare(`INSERT INTO sellers
    (jina_duka, aina_bidhaa, simu, email, location, kitambulisho, password_hash, status, tier, maelezo_duka, picha_duka, siku_kufunguliwa, latitude, longitude)
    VALUES (?,?,?,?,?,?,?,'pending','FREE',?,?,?,?,?)`)
    .run(jina_duka.trim(), aina_bidhaa.trim(), simu.trim(), email.trim(), location.trim(), kitambulisho, hash, maelezo_duka.trim(), picha_duka, siku_kufunguliwa.trim(), Number(latitude), Number(longitude));

  req.session.sellerId = info.lastInsertRowid;
  req.session.flashSuccess = 'Ombi lako la usajili limetumwa! Duka lako litakaguliwa na Admin kabla ya kuidhinishwa.';
  res.redirect('/duka-langu');
});

// =================== USAJILI WA MWASAFIRISHAJI ===================
router.get('/jisajili/mwasafirishaji', (req, res) => {
  res.render('pages/jisajili-mwasafirishaji', { title: 'Jisajili — Wa Usafirishaji' });
});

router.post('/jisajili/mwasafirishaji', upload.fields([{ name: 'kitambulisho', maxCount: 1 }, { name: 'leseni_faili', maxCount: 1 }]), (req, res) => {
  const { jina, simu, email, aina_gari, namba_usajili, leseni, eneo_huduma, password } = req.body;

  if (!jina || !simu || !email || !aina_gari || !namba_usajili || !leseni || !eneo_huduma || !password) {
    req.session.flashError = 'Tafadhali jaza taarifa ZOTE zilizoombwa — ni za lazima kwa ajili ya usalama.';
    return res.redirect('/jisajili/mwasafirishaji');
  }
  const validGari = ['bodaboda', 'gari_ndogo', 'gari_kubwa', 'lori'];
  if (!validGari.includes(aina_gari)) {
    req.session.flashError = 'Chagua aina sahihi ya gari.';
    return res.redirect('/jisajili/mwasafirishaji');
  }
  if (!req.files?.kitambulisho?.[0] || !req.files?.leseni_faili?.[0]) {
    req.session.flashError = 'Tafadhali pakia nakala ya kitambulisho NA leseni ya udereva — ni za lazima.';
    return res.redirect('/jisajili/mwasafirishaji');
  }
  const existing = db.prepare('SELECT id FROM drivers WHERE simu = ? OR email = ?').get(simu.trim(), email.trim());
  if (existing) {
    req.session.flashError = 'Namba ya simu au barua pepe hii tayari imesajiliwa kama mwasafirishaji.';
    return res.redirect('/jisajili/mwasafirishaji');
  }

  const kitambulisho = req.files.kitambulisho[0].filename;
  const hash = bcrypt.hashSync(password, 10);

  const info = db.prepare(`INSERT INTO drivers
    (jina, simu, email, aina_gari, namba_usajili, leseni, eneo_huduma, kitambulisho, password_hash, status, tier)
    VALUES (?,?,?,?,?,?,?,?,?,'pending','FREE')`)
    .run(jina.trim(), simu.trim(), email.trim(), aina_gari, namba_usajili.trim(), leseni.trim(), eneo_huduma.trim(), kitambulisho, hash);

  req.session.driverId = info.lastInsertRowid;
  req.session.flashSuccess = 'Ombi lako la usajili limetumwa! Litakaguliwa na Admin kabla ya kuidhinishwa.';
  res.redirect('/safari-yangu');
});

// =================== USAJILI WA MNUNUZI ===================
// Kwa ununuzi wa kawaida, usajili si wa lazima. LAKINI kwa usafirishaji wa PUBLIC/PROTECTED,
// mnunuzi anahitajika kuwa amesajiliwa (angalia routes/seller.js) — hivyo taarifa hapa ni
// za lazima ili akaunti iwe kamili na salama tangu mwanzo.
router.get('/jisajili/mnunuzi', (req, res) => {
  res.render('pages/jisajili-mnunuzi', { title: 'Jisajili kama Mnunuzi' });
});

router.post('/jisajili/mnunuzi', (req, res) => {
  const { jina, simu, email, anwani, password } = req.body;
  if (!jina || !simu || !email || !anwani || !password) {
    req.session.flashError = 'Tafadhali jaza taarifa ZOTE — ni za lazima kwa ajili ya usalama na kufuatilia usafirishaji wako.';
    return res.redirect('/jisajili/mnunuzi');
  }
  const existing = db.prepare('SELECT id FROM buyers WHERE simu = ? OR email = ?').get(simu.trim(), email.trim());
  if (existing) {
    req.session.flashError = 'Namba au barua pepe hii tayari imesajiliwa. Jaribu kuingia.';
    return res.redirect('/jisajili/mnunuzi');
  }
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(`INSERT INTO buyers (jina, simu, email, anwani, password_hash) VALUES (?,?,?,?,?)`)
    .run(jina.trim(), simu.trim(), email.trim(), anwani.trim(), hash);
  req.session.buyerId = info.lastInsertRowid;
  req.session.flashSuccess = 'Umesajiliwa! Sasa unaweza kuomba usafirishaji na kufuatilia historia yako ya ununuzi.';
  res.redirect('/');
});

// =================== KUINGIA (LOGIN) — Muuzaji / Mwasafirishaji / Mnunuzi ===================
// Mtumiaji anaweza kuingia kwa NAMBA YA SIMU AU BARUA PEPE, pamoja na password.
router.get('/ingia', (req, res) => {
  const aina = req.query.aina || 'muuzaji';
  res.render('pages/ingia', { title: 'Ingia', aina });
});

router.post('/ingia', (req, res) => {
  const { aina, utambulisho, password } = req.body;
  const kitafutwa = (utambulisho || '').trim();

  let table, sessionKey, redirectOk, redirectFail;
  if (aina === 'muuzaji') { table = 'sellers'; sessionKey = 'sellerId'; redirectOk = '/duka-langu'; redirectFail = '/ingia?aina=muuzaji'; }
  else if (aina === 'mwasafirishaji') { table = 'drivers'; sessionKey = 'driverId'; redirectOk = '/safari-yangu'; redirectFail = '/ingia?aina=mwasafirishaji'; }
  else { table = 'buyers'; sessionKey = 'buyerId'; redirectOk = '/'; redirectFail = '/ingia?aina=mnunuzi'; }

  const user = db.prepare(`SELECT * FROM ${table} WHERE simu = ? OR email = ?`).get(kitafutwa, kitafutwa);
  if (!user || !user.password_hash || !bcrypt.compareSync(password || '', user.password_hash)) {
    req.session.flashError = 'Namba ya simu / barua pepe au password si sahihi.';
    return res.redirect(redirectFail);
  }
  if (user.imefutwa) {
    req.session.flashError = 'Akaunti hii imesimamishwa. Wasiliana na Admin kwa maelezo zaidi.';
    return res.redirect(redirectFail);
  }
  req.session[sessionKey] = user.id;
  if (aina === 'mnunuzi' && req.session.rudiBaada) {
    const rudi = req.session.rudiBaada;
    delete req.session.rudiBaada;
    return res.redirect(rudi);
  }
  res.redirect(redirectOk);
});

router.post('/toka', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
