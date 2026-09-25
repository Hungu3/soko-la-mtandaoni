// middleware/auth.js — Kulinda routes kulingana na aina ya mtumiaji aliyeingia
const { db, syncSellerSubscription, syncDriverSubscription } = require('../db/db');

function loadCurrentUser(req, res, next) {
  res.locals.currentSeller = null;
  res.locals.currentDriver = null;
  res.locals.currentBuyer = null;
  res.locals.currentAdmin = null;
  res.locals.currentStaff = null;
  res.locals.isOwner = false;   // Admin/Mmiliki — anaona/anadhibiti kila kitu (pamoja na pesa)
  res.locals.isStaff = false;   // Msimamizi aliyesajiliwa na Admin — kila kitu ISIPOKUWA pesa

  if (req.session.sellerId) {
    res.locals.currentSeller = db.prepare('SELECT * FROM sellers WHERE id = ?').get(req.session.sellerId) || null;
  }
  if (req.session.driverId) {
    res.locals.currentDriver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.session.driverId) || null;
  }
  if (req.session.buyerId) {
    res.locals.currentBuyer = db.prepare('SELECT * FROM buyers WHERE id = ?').get(req.session.buyerId) || null;
  }
  if (req.session.adminId) {
    res.locals.currentAdmin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.session.adminId) || null;
    if (res.locals.currentAdmin) res.locals.isOwner = true;
  }
  if (req.session.staffId) {
    res.locals.currentStaff = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.session.staffId) || null;
    if (res.locals.currentStaff && res.locals.currentStaff.status === 'active') res.locals.isStaff = true;
  }
  next();
}

function requireSeller(req, res, next) {
  if (!res.locals.currentSeller) {
    req.session.flashError = 'Tafadhali ingia kama muuzaji kufikia ukurasa huu.';
    return res.redirect('/ingia?aina=muuzaji');
  }
  res.locals.currentSeller = syncSellerSubscription(res.locals.currentSeller.id);
  if (res.locals.currentSeller.imefutwa) {
    return res.render('pages/subiri-idhini', { aina: 'duka', status: 'suspended' });
  }
  if (res.locals.currentSeller.status !== 'approved') {
    return res.render('pages/subiri-idhini', { aina: 'duka', status: res.locals.currentSeller.status });
  }
  next();
}

function requireDriver(req, res, next) {
  if (!res.locals.currentDriver) {
    req.session.flashError = 'Tafadhali ingia kama mwasafirishaji kufikia ukurasa huu.';
    return res.redirect('/ingia?aina=mwasafirishaji');
  }
  res.locals.currentDriver = syncDriverSubscription(res.locals.currentDriver.id);
  if (res.locals.currentDriver.imefutwa) {
    return res.render('pages/subiri-idhini', { aina: 'usafirishaji', status: 'suspended' });
  }
  if (res.locals.currentDriver.status !== 'approved') {
    return res.render('pages/subiri-idhini', { aina: 'usafirishaji', status: res.locals.currentDriver.status });
  }
  next();
}

// Kwa kuomba usafirishaji wa PUBLIC/PROTECTED — mnunuzi LAZIMA awe amesajiliwa na kuingia.
function requireBuyer(req, res, next) {
  if (!res.locals.currentBuyer) {
    req.session.flashError = 'Usafirishaji wa Public/Protected unahitaji uwe umesajiliwa na kuingia kama mnunuzi.';
    req.session.rudiBaada = req.originalUrl;
    return res.redirect('/ingia?aina=mnunuzi');
  }
  if (res.locals.currentBuyer.imefutwa) {
    req.session.flashError = 'Akaunti yako imesimamishwa. Wasiliana na Admin.';
    return res.redirect('/');
  }
  next();
}

// Inaruhusu Admin (Mmiliki) NA Staff (Msimamizi) — wote wanaweza kufikia /admin/*.
// Vizuizi vya masuala ya pesa vinasimamiwa na requireOwner kwenye routes maalum.
function requireAdmin(req, res, next) {
  if (!res.locals.currentAdmin && !res.locals.isStaff) {
    return res.redirect('/admin/ingia');
  }
  if (!req.session.admin2faVerified) return res.redirect('/admin/2fa');
  next();
}

// Kwa kurasa/vitendo vya PESA TU (ada, upgrade, mapato) — Mmiliki (Admin) pekee.
function requireOwner(req, res, next) {
  if (!res.locals.isOwner) {
    req.session.flashError = 'Sehemu hii inahusu masuala ya pesa — Mmiliki pekee ndiye mwenye ruhusa.';
    return res.redirect('/admin');
  }
  next();
}

// Kitambulisho cha "actor" anayefanya kitendo — kinatumika kwa deleteRecord() kuamua
// kama ufutaji uwe "kamili" (Admin) au "laini" (Staff, kinachoonekana kwa Admin tu).
function currentActor(res) {
  if (res.locals.isOwner) return { type: 'admin', id: res.locals.currentAdmin.id, name: res.locals.currentAdmin.jina };
  if (res.locals.isStaff) return { type: 'staff', id: res.locals.currentStaff.id, name: res.locals.currentStaff.jina };
  return null;
}

module.exports = { loadCurrentUser, requireSeller, requireDriver, requireBuyer, requireAdmin, requireOwner, currentActor };
