// db.js — Muunganisho na muundo (schema) wa database ya Soko la Mtandaoni
// Inatumia "node:sqlite" iliyojengwa ndani ya Node.js yenyewe (tangu Node.js 22.5+) —
// haihitaji kusakinisha maktaba yoyote ya nje wala "kujenga" (compile) chochote, hivyo
// haihitaji Visual Studio Build Tools kwenye Windows.
const path = require('path');
const fs = require('fs');

let DatabaseSync;
try {
  ({ DatabaseSync } = require('node:sqlite'));
} catch (err) {
  console.error('\n=====================================================================');
  console.error('HITILAFU: Node.js yako haina "node:sqlite" iliyojengwa ndani yake.');
  console.error('Suluhisho: Sakinisha Node.js toleo la 22.5 au zaidi (LTS ya hivi karibuni)');
  console.error('kutoka https://nodejs.org kisha jaribu tena.');
  console.error('=====================================================================\n');
  throw err;
}

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'soko.db'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// ---------- VIWANGO (bidhaa/orders kwa kila tier) ----------
const SELLER_TIERS = {
  FREE:   { bidhaa: 20,  picha: 2,  bei: 0 },
  BRONZE: { bidhaa: 100, picha: 5,  bei: 10000 },
  SILVER: { bidhaa: 300, picha: 10, bei: 25000 },
  GOLD:   { bidhaa: Infinity, picha: Infinity, bei: 50000 },
};

const DRIVER_TIERS = {
  bodaboda:   { FREE: { orders: 5,  bei: 0 }, BRONZE: { orders: 40,  bei: 5000 },  SILVER: { orders: 150, bei: 12000 }, GOLD: { orders: Infinity, bei: 25000 } },
  gari_ndogo: { FREE: { orders: 8,  bei: 0 }, BRONZE: { orders: 60,  bei: 8000 },  SILVER: { orders: 250, bei: 18000 }, GOLD: { orders: Infinity, bei: 35000 } },
  gari_kubwa: { FREE: { orders: 10, bei: 0 }, BRONZE: { orders: 80,  bei: 12000 }, SILVER: { orders: 350, bei: 25000 }, GOLD: { orders: Infinity, bei: 50000 } },
  lori:       { FREE: { orders: 3,  bei: 0 }, BRONZE: { orders: 30,  bei: 15000 }, SILVER: { orders: 150, bei: 35000 }, GOLD: { orders: Infinity, bei: 70000 } },
};

// ---------- MUUNDO WA MSINGI (Schema ya awali — haiwezi kuathiri data iliyopo) ----------
db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jina TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  simu TEXT,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jina TEXT NOT NULL,
  simu TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  dhima TEXT,                              -- cheo/jukumu la msimamizi, mfano "Msimamizi wa Wauzaji"
  status TEXT NOT NULL DEFAULT 'active',   -- active | suspended
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sellers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jina_duka TEXT NOT NULL,
  aina_bidhaa TEXT NOT NULL,
  simu TEXT NOT NULL UNIQUE,
  email TEXT,
  location TEXT,
  kitambulisho TEXT,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  tier TEXT NOT NULL DEFAULT 'FREE',
  maelezo_duka TEXT,
  picha_duka TEXT,
  siku_kufunguliwa TEXT,
  onyo_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jina TEXT NOT NULL,
  simu TEXT NOT NULL UNIQUE,
  aina_gari TEXT NOT NULL,
  namba_usajili TEXT,
  leseni TEXT,
  eneo_huduma TEXT,
  kitambulisho TEXT,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  tier TEXT NOT NULL DEFAULT 'FREE',
  orders_used_month INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS buyers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jina TEXT NOT NULL,
  simu TEXT NOT NULL UNIQUE,
  anwani TEXT,
  password_hash TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  jina TEXT NOT NULL,
  kategoria TEXT,
  bei REAL NOT NULL DEFAULT 0,
  maelezo TEXT,
  gharama_usafirishaji TEXT,
  idadi INTEGER DEFAULT 1,
  hali TEXT DEFAULT 'ipo',
  picha TEXT DEFAULT '[]',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  maoni TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  jibu_muuzaji TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id INTEGER REFERENCES sellers(id) ON DELETE SET NULL,
  jina TEXT NOT NULL,
  simu TEXT,
  maelezo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS upgrade_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_type TEXT NOT NULL,
  account_id INTEGER NOT NULL,
  kiwango_kilichoombwa TEXT NOT NULL,
  njia_malipo TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  seller_id INTEGER REFERENCES sellers(id) ON DELETE SET NULL,
  driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
  aina TEXT NOT NULL DEFAULT 'public',
  buyer_name TEXT,
  buyer_simu TEXT,
  eneo_kuchukua TEXT,
  eneo_kupeleka TEXT,
  status TEXT NOT NULL DEFAULT 'inasubiri',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matangazo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kichwa TEXT NOT NULL,
  maelezo TEXT,
  picha TEXT,
  kiungo TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);

// ---------- MIGRATIONS (huongeza safu mpya kwenye database iliyopo bila kufuta data) ----------
function columnExists(table, column) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  return cols.some(c => c.name === column);
}
function addColumn(table, column, definition) {
  if (!columnExists(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// Barua pepe kwa wasafirishaji na wanunuzi (kwa ajili ya kuingia kwa email au namba)
addColumn('drivers', 'email', 'TEXT');
addColumn('buyers', 'email', 'TEXT');

// Ufutaji "laini" (soft delete): wasimamizi (staff) hawafuti kabisa — Admin bado anaona
// na anajua ni nani (staff gani) alifuta.
for (const t of ['sellers', 'drivers', 'products', 'reviews', 'matangazo', 'delivery_requests']) {
  addColumn(t, 'imefutwa', 'INTEGER DEFAULT 0');
  addColumn(t, 'futwa_na', 'TEXT');
  addColumn(t, 'futwa_wakati', 'TEXT');
}

// Matangazo: aina (Ad iliyolipiwa dhidi ya tangazo la kawaida), video, mtangazaji, kiasi
addColumn('matangazo', 'aina', "TEXT DEFAULT 'kawaida'"); // 'ad' | 'kawaida'
addColumn('matangazo', 'muundo', "TEXT DEFAULT 'picha'"); // 'picha' | 'video'
addColumn('matangazo', 'video', 'TEXT');
addColumn('matangazo', 'mtangazaji', 'TEXT');
addColumn('matangazo', 'kiasi_kilicholipwa', 'REAL');
addColumn('matangazo', 'seller_id', 'INTEGER REFERENCES sellers(id) ON DELETE SET NULL');
addColumn('matangazo', 'file_size_mb', 'REAL DEFAULT 0');
addColumn('matangazo', 'duration_days', 'INTEGER DEFAULT 7');
addColumn('matangazo', 'starts_at', 'TEXT');
addColumn('matangazo', 'expires_at', 'TEXT');
addColumn('matangazo', 'status', "TEXT DEFAULT 'approved'");

// Usafirishaji: kuunganisha na mnunuzi aliyesajiliwa + makubaliano ya bei ya usafirishaji
addColumn('delivery_requests', 'buyer_id', 'INTEGER REFERENCES buyers(id) ON DELETE SET NULL');
addColumn('delivery_requests', 'gharama_iliyopendekezwa', 'REAL');
addColumn('delivery_requests', 'gharama_imekubaliwa', 'INTEGER DEFAULT 0');

// Mazungumzo ya makubaliano ya bei ya usafirishaji kati ya Mnunuzi, Muuzaji na Msafirishaji
// (Admin/Wasimamizi wanaona yote). Kila ujumbe unaweza kubeba pendekezo la bei.
db.exec(`
CREATE TABLE IF NOT EXISTS delivery_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  delivery_id INTEGER NOT NULL REFERENCES delivery_requests(id) ON DELETE CASCADE,
  mtumaji_aina TEXT NOT NULL,     -- mnunuzi | muuzaji | msafirishaji | admin
  mtumaji_jina TEXT NOT NULL,
  ujumbe TEXT NOT NULL,
  bei_pendekezwa REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// Ramani ya Eneo (Location Map) — koordineti za GPS kwa duka, mnunuzi, na sehemu za
// kuchukua/kupeleka bidhaa. Zinatumika kuonyesha ramani halisi (Leaflet/OpenStreetMap).
addColumn('sellers', 'latitude', 'REAL');
addColumn('sellers', 'longitude', 'REAL');
addColumn('sellers', 'theme_color', "TEXT DEFAULT 'indigo'");
addColumn('sellers', 'subscription_tier', "TEXT DEFAULT 'FREE'");
addColumn('sellers', 'subscription_started_at', 'TEXT');
addColumn('sellers', 'subscription_expires_at', 'TEXT');
addColumn('sellers', 'renewal_prompted', 'INTEGER DEFAULT 0');
addColumn('sellers', 'kyc_status', "TEXT DEFAULT 'pending'");
addColumn('sellers', 'kyc_reviewed_at', 'TEXT');
addColumn('sellers', 'kyc_reviewed_by', 'TEXT');
addColumn('drivers', 'subscription_tier', "TEXT DEFAULT 'FREE'");
addColumn('drivers', 'subscription_started_at', 'TEXT');
addColumn('drivers', 'subscription_expires_at', 'TEXT');
addColumn('drivers', 'kyc_status', "TEXT DEFAULT 'pending'");
addColumn('drivers', 'kyc_reviewed_at', 'TEXT');
addColumn('drivers', 'kyc_reviewed_by', 'TEXT');
addColumn('admins', 'two_factor_enabled', 'INTEGER DEFAULT 1');
addColumn('staff', 'two_factor_enabled', 'INTEGER DEFAULT 1');
db.exec(`UPDATE sellers SET subscription_tier = tier
      WHERE subscription_tier IS NULL OR subscription_tier = ''
        OR (subscription_tier = 'FREE' AND tier <> 'FREE' AND subscription_started_at IS NULL)`);
db.exec(`UPDATE drivers SET subscription_tier = tier
      WHERE subscription_tier IS NULL OR subscription_tier = ''
        OR (subscription_tier = 'FREE' AND tier <> 'FREE' AND subscription_started_at IS NULL)`);
addColumn('buyers', 'latitude', 'REAL');
addColumn('buyers', 'longitude', 'REAL');
addColumn('delivery_requests', 'kuchukua_lat', 'REAL');
addColumn('delivery_requests', 'kuchukua_lng', 'REAL');
addColumn('delivery_requests', 'kupeleka_lat', 'REAL');
addColumn('delivery_requests', 'kupeleka_lng', 'REAL');
addColumn('delivery_requests', 'verification_status', "TEXT DEFAULT 'pending_pickup'");
addColumn('delivery_requests', 'pickup_code', 'TEXT');
addColumn('delivery_requests', 'delivery_code', 'TEXT');
addColumn('delivery_requests', 'pickup_verified_at', 'TEXT');
addColumn('delivery_requests', 'delivery_verified_at', 'TEXT');
addColumn('delivery_requests', 'proof_photo', 'TEXT');
addColumn('delivery_requests', 'payment_status', "TEXT DEFAULT 'not_started'");
addColumn('delivery_requests', 'payment_reference', 'TEXT');
addColumn('delivery_requests', 'escrow_amount', 'REAL DEFAULT 0');
addColumn('delivery_requests', 'escrow_released_at', 'TEXT');
addColumn('delivery_requests', 'escrow_refunded_at', 'TEXT');
addColumn('products', 'online', 'INTEGER DEFAULT 1');
addColumn('upgrade_requests', 'payment_ref', 'TEXT');
addColumn('upgrade_requests', 'amount', 'REAL');

db.exec(`
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  delivery_id INTEGER NOT NULL REFERENCES delivery_requests(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  sender_id INTEGER,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS disputes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  delivery_id INTEGER NOT NULL REFERENCES delivery_requests(id) ON DELETE CASCADE,
  buyer_id INTEGER REFERENCES buyers(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  resolution TEXT,
  refund_amount REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_type TEXT NOT NULL,
  actor_id INTEGER,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  details TEXT,
  ip_address TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// ---------- Bei za ada (zinaweza kubadilishwa na Admin, zimehifadhiwa DB) ----------
function getSetting(key, fallback) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  if (!row) return fallback;
  try { return JSON.parse(row.value); } catch { return fallback; }
}
function setSetting(key, value) {
  const json = JSON.stringify(value);
  db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(key, json);
}

function recordAudit(actor, action, entityType, entityId, details, ipAddress) {
  if (!actor) return;
  db.prepare(`INSERT INTO audit_logs (actor_type, actor_id, actor_name, action, entity_type, entity_id, details, ip_address)
              VALUES (?,?,?,?,?,?,?,?)`)
    .run(actor.type, actor.id || null, actor.name, action, entityType || null, entityId || null, details || null, ipAddress || null);
}

function getSellerPricing() {
  const defaults = { FREE: 0, BRONZE: 10000, SILVER: 25000, GOLD: 50000 };
  return getSetting('seller_prices', defaults);
}
function getDriverPricing() {
  const defaults = {
    bodaboda:   { FREE: 0, BRONZE: 5000,  SILVER: 12000, GOLD: 25000 },
    gari_ndogo: { FREE: 0, BRONZE: 8000,  SILVER: 18000, GOLD: 35000 },
    gari_kubwa: { FREE: 0, BRONZE: 12000, SILVER: 25000, GOLD: 50000 },
    lori:       { FREE: 0, BRONZE: 15000, SILVER: 35000, GOLD: 70000 },
  };
  return getSetting('driver_prices', defaults);
}

function sellerLimits(tier) {
  return SELLER_TIERS[tier] || SELLER_TIERS.FREE;
}
function driverLimits(ainaGari, tier) {
  const g = DRIVER_TIERS[ainaGari] || DRIVER_TIERS.bodaboda;
  return g[tier] || g.FREE;
}

function syncSellerSubscription(sellerId) {
  const seller = db.prepare('SELECT * FROM sellers WHERE id = ?').get(sellerId);
  if (!seller) return null;
  if (!seller.subscription_tier || seller.subscription_tier === 'FREE') {
    if (seller.tier !== 'FREE') db.prepare(`UPDATE sellers SET tier='FREE', subscription_tier='FREE' WHERE id=?`).run(seller.id);
    return { ...seller, tier: 'FREE', subscription_tier: 'FREE', expired: false };
  }
  const expired = seller.subscription_expires_at && new Date(seller.subscription_expires_at) <= new Date();
  if (!expired) return { ...seller, expired: false };

  const freeLimit = SELLER_TIERS.FREE.bidhaa;
  const products = db.prepare(`SELECT id FROM products WHERE seller_id=? AND imefutwa=0
    ORDER BY created_at DESC, id DESC`).all(seller.id);
  const keepIds = new Set(products.slice(0, freeLimit).map(product => product.id));
  db.prepare('UPDATE products SET online=0 WHERE seller_id=? AND imefutwa=0').run(seller.id);
  if (keepIds.size) db.prepare(`UPDATE products SET online=1 WHERE seller_id=? AND id IN (${[...keepIds].map(() => '?').join(',')})`).run(seller.id, ...keepIds);
  db.prepare(`UPDATE sellers SET tier='FREE', subscription_tier='FREE', renewal_prompted=1 WHERE id=?`).run(seller.id);
  return { ...seller, tier: 'FREE', subscription_tier: 'FREE', expired: true };
}

function syncDriverSubscription(driverId) {
  const driver = db.prepare('SELECT * FROM drivers WHERE id=?').get(driverId);
  if (!driver) return null;
  if (driver.subscription_tier === 'FREE' || !driver.subscription_tier) return { ...driver, tier: 'FREE' };
  if (driver.subscription_expires_at && new Date(driver.subscription_expires_at) <= new Date()) {
    db.prepare(`UPDATE drivers SET tier='FREE', subscription_tier='FREE' WHERE id=?`).run(driver.id);
    return { ...driver, tier: 'FREE' };
  }
  return driver;
}

// ---------- Ufutaji: Admin (mmiliki) = kabisa. Staff (msimamizi) = "laini" (soft) ----------
// actor = { type: 'admin' } au { type: 'staff', jina: 'Juma' }
function deleteRecord(table, id, actor) {
  if (actor && actor.type === 'staff') {
    db.prepare(`UPDATE ${table} SET imefutwa = 1, futwa_na = ?, futwa_wakati = CURRENT_TIMESTAMP WHERE id = ?`)
      .run('Msimamizi: ' + (actor.name || actor.jina), id);
    return 'soft';
  }
  db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  return 'hard';
}
function restoreRecord(table, id) {
  db.prepare(`UPDATE ${table} SET imefutwa = 0, futwa_na = NULL, futwa_wakati = NULL WHERE id = ?`).run(id);
}

module.exports = {
  db, SELLER_TIERS, DRIVER_TIERS,
  getSetting, setSetting, getSellerPricing, getDriverPricing,
  sellerLimits, driverLimits,
  syncSellerSubscription, syncDriverSubscription, recordAudit,
  deleteRecord, restoreRecord,
};
