// server.js — Soko la Mtandaoni — Mfumo Kamili wa Biashara Mtandaoni
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const methodOverride = require('method-override');

const { db } = require('./db/db'); // hakikisha database & schema vimeandaliwa
require('./db/seed'); // tengeneza admin & demo data ikiwa hazipo

const mainRoutes = require('./routes/main');
const authRoutes = require('./routes/auth');
const sellerRoutes = require('./routes/seller');
const driverRoutes = require('./routes/driver');
const adminRoutes = require('./routes/admin');
const { loadCurrentUser } = require('./middleware/auth');
const rateLimit = require('./middleware/rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
app.locals.currentYear = new Date().getFullYear();
const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET;
if (isProduction && (!sessionSecret || sessionSecret.length < 32)) {
  throw new Error('Production requires SESSION_SECRET with at least 32 characters.');
}
if (isProduction) app.set('trust proxy', 1);

const DATA_DIR = path.resolve(process.env.SOKO_DATA_DIR || path.join(__dirname, 'data'));
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });
const UPLOAD_DIR = path.resolve(process.env.SOKO_UPLOAD_DIR || path.join(__dirname, 'public', 'uploads'));
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---------- View Engine ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---------- Vitendaji vya Msaada kwenye Views (EJS helpers) ----------
app.locals.fmtMoney = (n) => {
  if (n === Infinity) return 'Isiyo na Kikomo';
  const num = Number(n) || 0;
  return num.toLocaleString('sw-TZ') + ' TSH';
};
app.locals.fmtNum = (n) => (n === Infinity ? 'Isiyo na Kikomo' : Number(n).toLocaleString('sw-TZ'));
app.locals.firstPhoto = (jsonStr) => {
  try {
    const arr = JSON.parse(jsonStr || '[]');
    return arr && arr.length ? '/uploads/' + arr[0] : null;
  } catch { return null; }
};
app.locals.allPhotos = (jsonStr) => {
  try { return JSON.parse(jsonStr || '[]'); } catch { return []; }
};
app.locals.safeJson = (value) => JSON.stringify(value)
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e')
  .replace(/&/g, '\\u0026')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');
app.locals.timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr + 'Z').getTime()) / 1000;
  if (diff < 60) return 'sasa hivi';
  if (diff < 3600) return Math.floor(diff / 60) + ' dakika zilizopita';
  if (diff < 86400) return Math.floor(diff / 3600) + ' saa zilizopita';
  return Math.floor(diff / 86400) + ' siku zilizopita';
};
app.locals.ainaGariJina = (aina) => ({
  bodaboda: 'Bodaboda', gari_ndogo: 'Gari Ndogo', gari_kubwa: 'Gari Kubwa', lori: 'Lori',
}[aina] || aina);

// ---------- Middleware za Msingi ----------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(rateLimit({ max: 100 }));
app.use(methodOverride('_method'));
app.use('/public', (req, res, next) => {
  if (req.path === '/uploads' || req.path.startsWith('/uploads/')) return res.sendStatus(404);
  next();
}, express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new FileStore({ path: path.join(DATA_DIR, 'sessions'), logFn: function(){} }),
  secret: sessionSecret || 'local-development-session-secret-only',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30, // siku 30
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
  },
}));

app.use((req, res, next) => {
  res.locals.currentYear = app.locals.currentYear || new Date().getFullYear();
  const timeoutMs = 20 * 60 * 1000;
  const now = Date.now();
  if (req.session.lastActivity && now - req.session.lastActivity > timeoutMs) {
    const hadAdmin = req.session.adminId || req.session.staffId;
    req.session.destroy(() => {
      if (hadAdmin) return res.redirect('/admin/ingia?timeout=1');
      next();
    });
    return;
  }
  req.session.lastActivity = now;
  next();
});

app.get('/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(503).json({ status: 'unavailable' });
  }
});

// ---------- Taarifa za jumla kwa kila ukurasa (locals) ----------
app.use(loadCurrentUser);
app.use((req, res, next) => {
  res.locals.flashSuccess = req.session.flashSuccess || null;
  res.locals.flashError = req.session.flashError || null;
  res.locals.path = req.path;
  delete req.session.flashSuccess;
  delete req.session.flashError;
  next();
});

app.get('/uploads/:filename', (req, res, next) => {
  const filename = path.basename(req.params.filename);
  const privateDocument = db.prepare(`SELECT 1 FROM sellers WHERE kitambulisho=?
    UNION ALL SELECT 1 FROM drivers WHERE kitambulisho=? OR leseni_file=? LIMIT 1`)
    .get(filename, filename, filename);
  const privileged = (res.locals.isOwner || res.locals.isStaff) && req.session.admin2faVerified;
  if (privateDocument && !privileged) return res.sendStatus(404);

  const publicStoreImage = db.prepare(`SELECT 1 FROM sellers
    WHERE picha_duka=? AND status='approved' AND imefutwa=0 LIMIT 1`).get(filename);
  const publicAdImage = db.prepare(`SELECT 1 FROM matangazo
    WHERE picha=? AND active=1 AND status='approved' AND imefutwa=0 LIMIT 1`).get(filename);
  const productImages = db.prepare(`SELECT p.picha FROM products p JOIN sellers s ON s.id=p.seller_id
    WHERE p.imefutwa=0 AND p.hali='ipo' AND p.idadi>0 AND COALESCE(p.online,1)=1 AND s.status='approved' AND s.imefutwa=0`).all();
  const publicProductImage = productImages.some(product => app.locals.allPhotos(product.picha).includes(filename));
  const adminProductImage = privileged
    && db.prepare('SELECT picha FROM products').all().some(product => app.locals.allPhotos(product.picha).includes(filename));

  const adminReference = privileged && Boolean(db.prepare(`
    SELECT 1 FROM sellers WHERE picha_duka=? OR kitambulisho=?
    UNION ALL SELECT 1 FROM drivers WHERE kitambulisho=? OR leseni_file=?
    UNION ALL SELECT 1 FROM matangazo WHERE picha=?
    LIMIT 1`).get(filename, filename, filename, filename, filename));
  if (!publicStoreImage && !publicAdImage && !publicProductImage && !adminProductImage && !adminReference) return res.sendStatus(404);

  res.sendFile(path.join(UPLOAD_DIR, filename), error => {
    if (error && !res.headersSent) res.sendStatus(error.statusCode === 404 ? 404 : 500);
  });
});

// ---------- Routes ----------
app.use('/', mainRoutes);
app.use('/', authRoutes);
app.use('/duka-langu', sellerRoutes);
app.use('/safari-yangu', driverRoutes);
app.use('/portal-siri', adminRoutes);
app.use('/admin', (req, res) => res.redirect(307, '/portal-siri' + req.url));

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).render('pages/haipo', { title: 'Ukurasa Haupo', ujumbe: 'Ukurasa unaoutafuta haupo.' });
});

// ---------- Kushughulikia Makosa ----------
app.use((err, req, res, next) => {
  console.error(err);
  if (err.message && err.message.includes('Aina ya faili')) {
    req.session.flashError = err.message;
    return res.redirect('back');
  }
  res.status(500).render('pages/haipo', { title: 'Hitilafu Imetokea', ujumbe: 'Samahani, hitilafu ya kiufundi imetokea. Jaribu tena.' });
});

app.listen(PORT, () => {
  console.log(`\n🛒 Soko la Mtandaoni linaendesha: http://localhost:${PORT}\n`);
});
