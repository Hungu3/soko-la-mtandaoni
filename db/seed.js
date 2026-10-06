// seed.js — Tengeneza akaunti ya kwanza ya Admin (na data ya majaribio, hiari)
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db } = require('./db');

function seedAdmin() {
  const production = ['production', 'test'].includes(process.env.NODE_ENV);
  const existingAdmin = db.prepare('SELECT id FROM admins LIMIT 1').get();
  if (production && existingAdmin) return;

  const email = process.env.ADMIN_EMAIL || (production ? '' : 'admin@soko.co.tz');
  const password = process.env.ADMIN_PASSWORD || (production ? '' : 'Soko@2026');
  if (production && (!email || password.length < 12)) {
    throw new Error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters before first production start.');
  }
  const jina = 'Msimamizi Mkuu';

  const existing = db.prepare('SELECT id FROM admins WHERE email = ?').get(email);
  if (existing) {
    console.log('Admin tayari yupo.');
    return;
  }
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO admins (jina, email, password_hash) VALUES (?, ?, ?)').run(jina, email, hash);
  console.log('======================================');
  console.log(' AKAUNTI YA ADMIN IMETENGENEZWA');
  console.log(` Barua pepe: ${email}`);
  console.log(' (Badilisha password hii baada ya kuingia mara ya kwanza!)');
  console.log('======================================');
}

function seedDemo() {
  if (['production', 'test'].includes(process.env.NODE_ENV)) return;
  const count = db.prepare('SELECT COUNT(*) c FROM sellers').get().c;
  if (count > 0) return; // demo data tayari ipo au kuna data halisi

  const pass = bcrypt.hashSync('demo1234', 10);

  const insSeller = db.prepare(`INSERT INTO sellers
    (jina_duka, aina_bidhaa, simu, email, location, kitambulisho, password_hash, status, tier, maelezo_duka, siku_kufunguliwa, latitude, longitude)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);

  const s1 = insSeller.run('Duka la Mama Amina', 'Nguo na Vitambaa', '0712345678', 'mamaamina@mfano.co.tz', 'Kariakoo, Dar es Salaam', 'DEMO-ID-1', pass, 'approved', 'BRONZE', 'Tunauza vitenge, khanga na nguo za watoto kwa bei nafuu.', 'Jumatatu - Jumamosi, 8:00 - 18:00', -6.816463, 39.281359);
  const s2 = insSeller.run('Mazao Fresh Morogoro', 'Mazao na Vyakula', '0713456789', 'mazaofresh@mfano.co.tz', 'Soko Kuu, Morogoro', 'DEMO-ID-2', pass, 'approved', 'SILVER', 'Mazao mapya kutoka shambani moja kwa moja - mahindi, mchele, maharage.', 'Kila siku, 6:00 - 19:00', -6.827220, 37.663840);
  const s3 = insSeller.run('Vifaa vya Ujenzi Tanga', 'Vifaa vya Ujenzi', '0714567890', 'vifaatanga@mfano.co.tz', 'Tanga Mjini', 'DEMO-ID-3', pass, 'pending', 'FREE', 'Saruji, nondo, na vifaa vingine vya ujenzi.', 'Jumatatu - Ijumaa, 7:30 - 17:00', -5.068890, 39.098030);

  const insProduct = db.prepare(`INSERT INTO products
    (seller_id, jina, kategoria, bei, maelezo, gharama_usafirishaji, idadi, hali)
    VALUES (?,?,?,?,?,?,?,?)`);

  insProduct.run(s1.lastInsertRowid, 'Kitenge cha Ankara', 'Nguo', 25000, 'Kitenge halisi cha Ankara, mita 6.', 'Anza 3000 TSH', 15, 'ipo');
  insProduct.run(s1.lastInsertRowid, 'Khanga Jozi', 'Nguo', 18000, 'Khanga mbili za rangi za kuvutia.', 'Anza 3000 TSH', 30, 'ipo');
  insProduct.run(s2.lastInsertRowid, 'Mchele Kilo 25', 'Mazao', 75000, 'Mchele mzuri wa Mbeya, gunia la kilo 25.', 'Bure ndani ya Morogoro Mjini', 40, 'ipo');
  insProduct.run(s2.lastInsertRowid, 'Maharage Kilo 5', 'Mazao', 22000, 'Maharage safi ya asili.', 'Anza 2000 TSH', 60, 'ipo');

  const insDriver = db.prepare(`INSERT INTO drivers
    (jina, simu, email, aina_gari, namba_usajili, leseni, eneo_huduma, kitambulisho, password_hash, status, tier)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  insDriver.run('Juma Mwasafirishaji', '0715678901', 'juma.dereva@mfano.co.tz', 'bodaboda', 'T123ABC', 'DL-0001', 'Kariakoo, Ilala', 'DEMO-ID-D1', pass, 'approved', 'BRONZE');
  insDriver.run('Hamisi Dereva', '0716789012', 'hamisi.dereva@mfano.co.tz', 'gari_ndogo', 'T456DEF', 'DL-0002', 'Morogoro Mjini', 'DEMO-ID-D2', pass, 'pending', 'FREE');

  // Mnunuzi wa mfano (akaunti kamili) — kwa ajili ya kujaribu "Omba Usafirishaji" mara moja
  db.prepare(`INSERT INTO buyers (jina, simu, email, anwani, password_hash) VALUES (?,?,?,?,?)`)
    .run('Asha Mnunuzi', '0717890123', 'asha.mnunuzi@mfano.co.tz', 'Mikocheni, Dar es Salaam', pass);

  // Msimamizi (Staff) wa mfano — ana ufikiaji wa kila kitu isipokuwa masuala ya pesa
  db.prepare(`INSERT INTO staff (jina, simu, email, password_hash, dhima, status) VALUES (?,?,?,?,?,'active')`)
    .run('Neema Msimamizi', '0718901234', 'neema.msimamizi@mfano.co.tz', pass, 'Msimamizi wa Wauzaji na Wasafirishaji');

  // Matangazo ya mfano: moja "Ad" (imelipiwa) na moja "ya kawaida"
  db.prepare(`INSERT INTO matangazo (kichwa, maelezo, active, aina, muundo, mtangazaji, kiasi_kilicholipwa)
              VALUES (?,?,1,'ad','picha',?,?)`)
    .run('M-Pesa kwa Biashara Yako', 'Fungua akaunti ya M-Pesa Biashara leo, malipo rahisi kwa wateja wako.', 'Vodacom Tanzania', 150000);
  db.prepare(`INSERT INTO matangazo (kichwa, maelezo, active, aina, muundo) VALUES (?,?,1,'kawaida','picha')`)
    .run('Karibu Soko la Mtandaoni!', 'Sajili duka lako leo bure na uanze kuuza kwa wanunuzi wa Tanzania nzima.');

  console.log('Data ya majaribio (demo) imewekwa: maduka 3, bidhaa 4, wasafirishaji 2, mnunuzi 1, msimamizi 1.');
  console.log('   Mnunuzi wa mfano: simu 0717890123 / barua pepe asha.mnunuzi@mfano.co.tz / password demo1234');
  console.log('   Msimamizi wa mfano: simu 0718901234 / barua pepe neema.msimamizi@mfano.co.tz / password demo1234');
}

seedAdmin();
seedDemo();
