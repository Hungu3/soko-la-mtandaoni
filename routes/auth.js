// routes/auth.js — Usajili na kuingia kwa Wauzaji, Wasafirishaji, Wanunuzi
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const { db } = require('../db/db');
const upload = require('../middleware/upload');

function renderRegistrationError(req, res, view, title, missingFields, message) {
  const formData = { ...req.body };
  delete formData.password;
  delete formData.password_confirm;
  for (const files of Object.values(req.files || {})) {
    for (const file of files) fs.unlink(file.path, () => {});
  }
  return res.status(400).render(view, {
    title,
    flashError: message,
    formData,
    missingFields,
  });
}

function missingValues(values) {
  return Object.entries(values)
    .filter(([, value]) => !String(value || '').trim())
    .map(([field]) => field);
}

// =================== USAJILI WA MUUZAJI ===================
router.get('/jisajili/muuzaji', (req, res) => {
  res.render('pages/jisajili-muuzaji', { title: 'Jisajili — Fungua Duka', formData: {}, missingFields: [] });
});

router.post('/jisajili/muuzaji', upload.fields([{ name: 'kitambulisho', maxCount: 1 }, { name: 'picha_duka', maxCount: 1 }]), (req, res) => {
  const { jina_duka, aina_bidhaa, simu, email, location, password, siku_kufunguliwa, maelezo_duka, latitude, longitude } = req.body;

  const missingFields = missingValues({ jina_duka, aina_bidhaa, simu, email, location, password, siku_kufunguliwa, maelezo_duka });
  const validCoordinates = latitude !== '' && longitude !== ''
    && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
    && Number(latitude) >= -90 && Number(latitude) <= 90
    && Number(longitude) >= -180 && Number(longitude) <= 180;
  if (!validCoordinates) missingFields.push('latitude', 'longitude');
  if (missingFields.length) {
    return renderRegistrationError(req, res, 'pages/jisajili-muuzaji', 'Jisajili — Fungua Duka', missingFields, 'Kuna taarifa zinazokosekana au eneo la ramani halijachaguliwa. Sehemu zilizoangaziwa ndizo za kujaza.');
  }
  if (!req.files?.kitambulisho?.[0]) {
    return renderRegistrationError(req, res, 'pages/jisajili-muuzaji', 'Jisajili — Fungua Duka', ['kitambulisho'], 'Pakia nakala ya kitambulisho ili kuendelea.');
  }
  if (!req.files?.picha_duka?.[0]) {
    return renderRegistrationError(req, res, 'pages/jisajili-muuzaji', 'Jisajili — Fungua Duka', ['picha_duka'], 'Pakia picha ya duka au nembo ili kuendelea.');
  }
  const existing = db.prepare('SELECT id FROM sellers WHERE simu = ? OR email = ?').get(simu.trim(), email.trim());
  if (existing) {
    return renderRegistrationError(req, res, 'pages/jisajili-muuzaji', 'Jisajili — Fungua Duka', ['simu', 'email'], 'Namba ya simu au barua pepe hii tayari imesajiliwa kama duka.');
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
  res.render('pages/jisajili-mwasafirishaji', { title: 'Jisajili — Wa Usafirishaji', formData: {}, missingFields: [] });
});

router.post('/jisajili/mwasafirishaji', upload.fields([{ name: 'kitambulisho', maxCount: 1 }, { name: 'leseni_faili', maxCount: 1 }]), (req, res) => {
  const { jina, simu, email, aina_gari, namba_usajili, leseni, eneo_huduma, password } = req.body;

  const missingFields = missingValues({ jina, simu, email, aina_gari, namba_usajili, leseni, eneo_huduma, password });
  if (missingFields.length) {
    return renderRegistrationError(req, res, 'pages/jisajili-mwasafirishaji', 'Jisajili — Wa Usafirishaji', missingFields, 'Kuna taarifa zinazokosekana. Sehemu zilizoangaziwa ndizo za kujaza.');
  }
  const validGari = ['bodaboda', 'gari_ndogo', 'gari_kubwa', 'lori'];
  if (!validGari.includes(aina_gari)) {
    return renderRegistrationError(req, res, 'pages/jisajili-mwasafirishaji', 'Jisajili — Wa Usafirishaji', ['aina_gari'], 'Chagua aina sahihi ya gari.');
  }
  if (!req.files?.kitambulisho?.[0] || !req.files?.leseni_faili?.[0]) {
    const missingFiles = [];
    if (!req.files?.kitambulisho?.[0]) missingFiles.push('kitambulisho');
    if (!req.files?.leseni_faili?.[0]) missingFiles.push('leseni_faili');
    return renderRegistrationError(req, res, 'pages/jisajili-mwasafirishaji', 'Jisajili — Wa Usafirishaji', missingFiles, 'Pakia faili zilizoangaziwa ili kuendelea.');
  }
  const existing = db.prepare('SELECT id FROM drivers WHERE simu = ? OR email = ?').get(simu.trim(), email.trim());
  if (existing) {
    return renderRegistrationError(req, res, 'pages/jisajili-mwasafirishaji', 'Jisajili — Wa Usafirishaji', ['simu', 'email'], 'Namba ya simu au barua pepe hii tayari imesajiliwa kama mwasafirishaji.');
  }

  const kitambulisho = req.files.kitambulisho[0].filename;
  const leseniFaili = req.files.leseni_faili[0].filename;
  const hash = bcrypt.hashSync(password, 10);

  const info = db.prepare(`INSERT INTO drivers
    (jina, simu, email, aina_gari, namba_usajili, leseni, eneo_huduma, kitambulisho, leseni_file, password_hash, status, tier)
    VALUES (?,?,?,?,?,?,?,?,?,?,'pending','FREE')`)
    .run(jina.trim(), simu.trim(), email.trim(), aina_gari, namba_usajili.trim(), leseni.trim(), eneo_huduma.trim(), kitambulisho, leseniFaili, hash);

  req.session.driverId = info.lastInsertRowid;
  req.session.flashSuccess = 'Ombi lako la usajili limetumwa! Litakaguliwa na Admin kabla ya kuidhinishwa.';
  res.redirect('/safari-yangu');
});

// =================== USAJILI WA MNUNUZI ===================
// Kwa ununuzi wa kawaida, usajili si wa lazima. LAKINI kwa usafirishaji wa PUBLIC/PROTECTED,
// mnunuzi anahitajika kuwa amesajiliwa (angalia routes/seller.js) — hivyo taarifa hapa ni
// za lazima ili akaunti iwe kamili na salama tangu mwanzo.
router.get('/jisajili/mnunuzi', (req, res) => {
  res.render('pages/jisajili-mnunuzi', { title: 'Jisajili kama Mnunuzi', formData: {}, missingFields: [] });
});

router.post('/jisajili/mnunuzi', (req, res) => {
  const { jina, simu, email, anwani, password } = req.body;
  const missingFields = missingValues({ jina, simu, email, anwani, password });
  if (missingFields.length) {
    return renderRegistrationError(req, res, 'pages/jisajili-mnunuzi', 'Jisajili kama Mnunuzi', missingFields, 'Kuna taarifa zinazokosekana. Sehemu zilizoangaziwa ndizo za kujaza.');
  }
  const existing = db.prepare('SELECT id FROM buyers WHERE simu = ? OR email = ?').get(simu.trim(), email.trim());
  if (existing) {
    return renderRegistrationError(req, res, 'pages/jisajili-mnunuzi', 'Jisajili kama Mnunuzi', ['simu', 'email'], 'Namba au barua pepe hii tayari imesajiliwa. Jaribu kuingia.');
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

router.post('/ingia', (req, res, next) => {
  const { aina, utambulisho, password } = req.body;
  const kitafutwa = (utambulisho || '').trim();

  let table, sessionKey, redirectOk, redirectFail;
  if (aina === 'muuzaji') { table = 'sellers'; sessionKey = 'sellerId'; redirectOk = '/duka-langu'; redirectFail = '/ingia?aina=muuzaji'; }
  else if (aina === 'mwasafirishaji') { table = 'drivers'; sessionKey = 'driverId'; redirectOk = '/safari-yangu'; redirectFail = '/ingia?aina=mwasafirishaji'; }
  else if (aina === 'mnunuzi') { table = 'buyers'; sessionKey = 'buyerId'; redirectOk = '/'; redirectFail = '/ingia?aina=mnunuzi'; }
  else {
    req.session.flashError = 'Chagua aina sahihi ya akaunti.';
    return res.redirect('/ingia?aina=mnunuzi');
  }

  const user = db.prepare(`SELECT * FROM ${table} WHERE simu = ? OR email = ?`).get(kitafutwa, kitafutwa);
  if (!user || !user.password_hash || !bcrypt.compareSync(password || '', user.password_hash)) {
    req.session.flashError = 'Namba ya simu / barua pepe au password si sahihi.';
    return res.redirect(redirectFail);
  }
  if (user.imefutwa) {
    req.session.flashError = 'Akaunti hii imesimamishwa. Wasiliana na Admin kwa maelezo zaidi.';
    return res.redirect(redirectFail);
  }
  const returnTo = req.session.rudiBaada;
  const safeReturnTo = typeof returnTo === 'string'
    && returnTo.startsWith('/') && !returnTo.startsWith('//') && !returnTo.includes('\\')
    ? returnTo : null;
  req.session.regenerate(error => {
    if (error) return next(error);
    req.session[sessionKey] = user.id;
    if (aina === 'mnunuzi' && safeReturnTo) return res.redirect(safeReturnTo);
    res.redirect(redirectOk);
  });
});

router.post('/toka', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
