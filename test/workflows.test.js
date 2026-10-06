'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const bcrypt = require('bcryptjs');

function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

function cookieFrom(response, fallback = '') {
  const collectedCookies = response.headers.getSetCookie?.() || [];
  const cookies = collectedCookies.length
    ? collectedCookies
    : [response.headers.get('set-cookie')].filter(Boolean);
  return cookies.length ? cookies.map(cookie => cookie.split(';')[0]).join('; ') : fallback;
}

async function request(base, route, { method = 'GET', data, cookie, redirect = 'manual' } = {}) {
  const headers = {};
  let body;
  if (data) {
    headers['content-type'] = 'application/x-www-form-urlencoded';
    body = new URLSearchParams(data);
  }
  if (cookie) headers.cookie = cookie;
  return fetch(base + route, { method, headers, body, redirect });
}

async function login(base, route, role, email, password, cookie = '') {
  const response = await request(base, route, {
    method: 'POST',
    data: { aina: role, utambulisho: email, password },
    cookie,
  });
  assert.equal(response.status, 302);
  return cookieFrom(response, cookie);
}

test('critical auth, KYC, delivery and payment workflows', async () => {
  const projectRoot = path.resolve(__dirname, '..');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'soko-workflow-test-'));
  const dataDir = path.join(tempRoot, 'data');
  const uploadDir = path.join(tempRoot, 'uploads');
  const port = await reservePort();
  const ownerEmail = 'owner@workflow.test';
  const ownerPassword = 'WorkflowOwnerPass2026!';
  const buyerPassword = 'WorkflowBuyerPass2026!';
  const driverPassword = 'WorkflowDriverPass2026!';
  const twoFactor = '918273';
  const childEnv = {
    ...process.env,
    NODE_ENV: 'test',
    PORT: String(port),
    SOKO_DATA_DIR: dataDir,
    SOKO_UPLOAD_DIR: uploadDir,
    SESSION_SECRET: 'workflow-test-secret-with-more-than-32-characters',
    ADMIN_EMAIL: ownerEmail,
    ADMIN_PASSWORD: ownerPassword,
    ADMIN_2FA_CODE: twoFactor,
  };
  const previousDataDir = process.env.SOKO_DATA_DIR;
  const previousUploadDir = process.env.SOKO_UPLOAD_DIR;
  process.env.SOKO_DATA_DIR = dataDir;
  process.env.SOKO_UPLOAD_DIR = uploadDir;
  const { db } = require('../db/db');
  const child = spawn(process.execPath, ['server.js'], { cwd: projectRoot, env: childEnv, stdio: ['ignore', 'ignore', 'pipe'] });
  let serverErrors = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', chunk => { serverErrors += chunk; });
  const base = `http://127.0.0.1:${port}`;

  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (child.exitCode !== null) throw new Error(`Test server exited with code ${child.exitCode}`);
      try {
        const response = await fetch(base + '/health');
        if (response.ok) { ready = true; break; }
      } catch { /* server is still starting */ }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.equal(ready, true, `isolated server should become healthy (exit=${child.exitCode}; errors=${serverErrors})`);
    assert.equal(db.prepare('SELECT COUNT(*) c FROM sellers').get().c, 0, 'production startup must not seed demo sellers');
    assert.equal(db.prepare('SELECT COUNT(*) c FROM drivers').get().c, 0, 'production startup must not seed demo drivers');

    const ownerLogin = await request(base, '/portal-siri/ingia', {
      method: 'POST', data: { utambulisho: ownerEmail, password: ownerPassword },
    });
    assert.equal(ownerLogin.status, 302, `owner login responded ${ownerLogin.status}`);
    assert.equal(ownerLogin.headers.get('location'), '/admin/2fa', `owner login went to ${ownerLogin.headers.get('location')}`);
    let ownerCookie = cookieFrom(ownerLogin);
    assert.match(ownerCookie, /connect\.sid=/, 'password login should issue a session cookie');
    const twoFactorResponse = await request(base, '/portal-siri/2fa', {
      method: 'POST', data: { code: twoFactor }, cookie: ownerCookie,
    });
    assert.equal(twoFactorResponse.status, 302, `2FA responded ${twoFactorResponse.status}`);
    assert.equal(twoFactorResponse.headers.get('location'), '/admin', `2FA went to ${twoFactorResponse.headers.get('location')}`);
    ownerCookie = cookieFrom(twoFactorResponse, ownerCookie);
    assert.match(ownerCookie, /connect\.sid=/, 'session cookie should remain available after 2FA');
    const challengePage = await request(base, '/portal-siri/2fa', { cookie: ownerCookie });
    assert.equal(challengePage.status, 200, `2FA challenge page returned ${challengePage.status}`);
    const ownerDashboard = await request(base, '/portal-siri/', { cookie: ownerCookie });
    assert.equal(ownerDashboard.status, 200, `owner dashboard after 2FA redirected to ${ownerDashboard.headers.get('location') || 'no location'}`);

    const passwordHash = bcrypt.hashSync('test-account-password', 4);
    const sellerResult = db.prepare(`INSERT INTO sellers
      (jina_duka, aina_bidhaa, simu, email, password_hash, status, kyc_status, kitambulisho)
      VALUES ('Duka la Test', 'Vyakula', '0700000001', 'seller@workflow.test', ?, 'pending', 'pending', 'private-id-proof.pdf')`)
      .run(passwordHash);
    const sellerId = Number(sellerResult.lastInsertRowid);
    fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(path.join(uploadDir, 'private-id-proof.pdf'), 'test identity document');
    fs.writeFileSync(path.join(uploadDir, 'orphan-image.png'), 'unreferenced upload');

    const anonymousDocument = await request(base, '/uploads/private-id-proof.pdf');
    assert.equal(anonymousDocument.status, 404, 'KYC file must not be public');
    const staticDocumentBypass = await request(base, '/public/uploads/private-id-proof.pdf');
    assert.equal(staticDocumentBypass.status, 404, 'KYC file must not be reachable through the general public static path');
    const orphanUpload = await request(base, '/uploads/orphan-image.png');
    assert.equal(orphanUpload.status, 404, 'unreferenced uploads must not be served');
    const sellerDocument = await request(base, `/portal-siri/nyaraka/seller/${sellerId}/kitambulisho`, { cookie: ownerCookie });
    assert.equal(sellerDocument.status, 200, 'verified owner can inspect KYC file');
    const ownerDocumentUrl = await request(base, '/uploads/private-id-proof.pdf', { cookie: ownerCookie });
    assert.equal(ownerDocumentUrl.status, 200, 'owner may access referenced KYC through the legacy media URL after 2FA');

    await request(base, `/portal-siri/wauzaji/${sellerId}/idhinisha`, { method: 'POST', cookie: ownerCookie });
    assert.equal(db.prepare('SELECT status FROM sellers WHERE id=?').get(sellerId).status, 'pending', 'seller without verified KYC remains pending');
    await request(base, `/portal-siri/wauzaji/${sellerId}/kyc`, { method: 'POST', data: { status: 'verified' }, cookie: ownerCookie });
    await request(base, `/portal-siri/wauzaji/${sellerId}/idhinisha`, { method: 'POST', cookie: ownerCookie });
    assert.equal(db.prepare('SELECT status FROM sellers WHERE id=?').get(sellerId).status, 'approved');

    const hiddenProductResult = db.prepare(`INSERT INTO products (seller_id, jina, bei, hali, imefutwa)
      VALUES (?, 'Bidhaa Iliyofichwa', 1000, 'ipo', 1)`).run(sellerId);
    const hiddenProductId = Number(hiddenProductResult.lastInsertRowid);
    const hiddenProductPage = await request(base, `/bidhaa/${hiddenProductId}`);
    assert.equal(hiddenProductPage.status, 404, 'soft-deleted products are inaccessible by direct URL');
    const outOfStockResult = db.prepare(`INSERT INTO products (seller_id, jina, bei, idadi, hali)
      VALUES (?, 'Bidhaa Imeisha', 1000, 0, 'ipo')`).run(sellerId);
    const outOfStockId = Number(outOfStockResult.lastInsertRowid);
    assert.equal((await request(base, `/bidhaa/${outOfStockId}`)).status, 404, 'zero-stock products are unavailable by direct URL');
    const sellerCookie = await login(base, '/ingia', 'muuzaji', 'seller@workflow.test', 'test-account-password');
    await request(base, '/duka-langu/upgrade', {
      method: 'POST', data: { kiwango: 'BRONZE', njia_malipo: 'M-Pesa', payment_ref: 'UPGRADE-TEST-1' }, cookie: sellerCookie,
    });
    assert.equal(db.prepare('SELECT tier FROM sellers WHERE id=?').get(sellerId).tier, 'FREE', 'payment reference alone must not activate a tier');
    const pendingUpgrade = db.prepare(`SELECT * FROM upgrade_requests WHERE account_type='seller' AND account_id=? AND status='pending'`).get(sellerId);
    assert.ok(pendingUpgrade, 'seller payment request should remain pending');

    const driverIds = [];
    const driverHash = bcrypt.hashSync(driverPassword, 4);
    for (let index = 1; index <= 2; index += 1) {
      const result = db.prepare(`INSERT INTO drivers
        (jina, simu, email, aina_gari, namba_usajili, leseni, eneo_huduma, password_hash, status, tier, kyc_status)
        VALUES (?, ?, ?, 'bodaboda', 'T123ABC', 'DL-TEST', 'Dar es Salaam', ?, 'approved', 'FREE', 'verified')`)
        .run(`Driver ${index}`, `070000000${index + 1}`, `driver${index}@workflow.test`, driverHash);
      driverIds.push(Number(result.lastInsertRowid));
    }
    const driverSessions = await Promise.all(driverIds.map((_, index) => login(
      base, '/ingia', 'mwasafirishaji', `driver${index + 1}@workflow.test`, driverPassword,
    )));

    const buyerResult = db.prepare(`INSERT INTO buyers (jina, simu, email, anwani, password_hash)
      VALUES ('Buyer Test', '0700000010', 'buyer@workflow.test', 'Dar es Salaam', ?)`)
      .run(bcrypt.hashSync(buyerPassword, 4));
    const buyerId = Number(buyerResult.lastInsertRowid);
    const invalidRoleLogin = await request(base, '/ingia', {
      method: 'POST', data: { aina: 'admin', utambulisho: 'buyer@workflow.test', password: buyerPassword },
    });
    assert.equal(invalidRoleLogin.headers.get('location'), '/ingia?aina=mnunuzi', 'unknown roles must not silently authenticate as buyers');
    const buyerCookie = await login(base, '/ingia', 'mnunuzi', 'buyer@workflow.test', buyerPassword);
    await request(base, `/bidhaa/${hiddenProductId}/omba-usafirishaji`, {
      method: 'POST', data: { aina: 'public', eneo_kupeleka: 'Kariakoo' }, cookie: buyerCookie,
    });
    assert.equal(db.prepare('SELECT COUNT(*) c FROM delivery_requests WHERE product_id=?').get(hiddenProductId).c, 0, 'hidden product cannot create a delivery order');
    await request(base, `/bidhaa/${outOfStockId}/omba-usafirishaji`, {
      method: 'POST', data: { aina: 'public', eneo_kupeleka: 'Kariakoo' }, cookie: buyerCookie,
    });
    assert.equal(db.prepare('SELECT COUNT(*) c FROM delivery_requests WHERE product_id=?').get(outOfStockId).c, 0, 'zero-stock product cannot create a delivery order');
    const orderResult = db.prepare(`INSERT INTO delivery_requests
      (seller_id, buyer_id, aina, buyer_name, buyer_simu, eneo_kupeleka, status, verification_status, pickup_code, delivery_code)
      VALUES (?, ?, 'public', 'Buyer Test', '0700000010', 'Kariakoo', 'inasubiri', 'pending_pickup', '123456', '654321')`)
      .run(sellerId, buyerId);
    const orderId = Number(orderResult.lastInsertRowid);

    const raceResults = await Promise.all(driverSessions.map(cookie => request(base, `/safari-yangu/maombi/${orderId}/kubali`, { method: 'POST', cookie })));
    assert.ok(raceResults.every(response => response.status === 302), `driver claim statuses: ${raceResults.map(response => response.status).join(',')}; server errors: ${serverErrors}`);
    const claimed = db.prepare('SELECT driver_id, status FROM delivery_requests WHERE id=?').get(orderId);
    assert.ok(driverIds.includes(claimed.driver_id));
    assert.equal(claimed.status, 'imekubaliwa');

    const assignedIndex = driverIds.indexOf(claimed.driver_id);
    const assignedCookie = driverSessions[assignedIndex];
    await request(base, `/safari-yangu/safari/${orderId}/thibitisha-kufikisha`, {
      method: 'POST', data: { code: '654321' }, cookie: assignedCookie,
    });
    assert.equal(db.prepare('SELECT status FROM delivery_requests WHERE id=?').get(orderId).status, 'imekubaliwa', 'delivery cannot happen before pickup');
    await request(base, `/safari-yangu/safari/${orderId}/thibitisha-kuchukua`, {
      method: 'POST', data: { code: '123456' }, cookie: assignedCookie,
    });
    assert.equal(db.prepare('SELECT status FROM delivery_requests WHERE id=?').get(orderId).status, 'inasafirishwa');
    await request(base, `/safari-yangu/safari/${orderId}/thibitisha-kufikisha`, {
      method: 'POST', data: { code: '654321' }, cookie: assignedCookie,
    });
    assert.equal(db.prepare('SELECT status FROM delivery_requests WHERE id=?').get(orderId).status, 'imewasili');

    const paymentOrder = db.prepare(`INSERT INTO delivery_requests
      (seller_id, buyer_id, aina, buyer_name, buyer_simu, eneo_kupeleka, status, verification_status,
       gharama_iliyopendekezwa, gharama_imekubaliwa, payment_status)
      VALUES (?, ?, 'protected', 'Buyer Test', '0700000010', 'Kariakoo', 'imekubaliwa', 'pending_pickup', 5000, 1, 'not_started')`)
      .run(sellerId, buyerId);
    const paymentOrderId = Number(paymentOrder.lastInsertRowid);
    await request(base, `/usafirishaji/${paymentOrderId}/payment`, {
      method: 'POST', data: { amount: '7000', payment_reference: 'PAYMENT-TEST-1' }, cookie: buyerCookie,
    });
    assert.equal(db.prepare('SELECT payment_status FROM delivery_requests WHERE id=?').get(paymentOrderId).payment_status, 'not_started', 'wrong amount must not enter the ledger');
    await request(base, `/usafirishaji/${paymentOrderId}/payment`, {
      method: 'POST', data: { amount: '5000', payment_reference: 'PAYMENT-TEST-1' }, cookie: buyerCookie,
    });
    assert.equal(db.prepare('SELECT payment_status FROM delivery_requests WHERE id=?').get(paymentOrderId).payment_status, 'reported');
    await request(base, `/portal-siri/usafirishaji/${paymentOrderId}/payment/verify`, { method: 'POST', cookie: ownerCookie });
    assert.equal(db.prepare('SELECT payment_status FROM delivery_requests WHERE id=?').get(paymentOrderId).payment_status, 'held');

    const upgradeId = pendingUpgrade.id;
    await request(base, `/portal-siri/upgrade/${upgradeId}/idhinisha`, { method: 'POST', cookie: ownerCookie });
    const expiryAfterApproval = db.prepare('SELECT subscription_expires_at FROM sellers WHERE id=?').get(sellerId).subscription_expires_at;
    assert.equal(db.prepare('SELECT status FROM upgrade_requests WHERE id=?').get(upgradeId).status, 'approved');
    assert.equal(db.prepare('SELECT tier FROM sellers WHERE id=?').get(sellerId).tier, 'BRONZE');
    await request(base, `/portal-siri/upgrade/${upgradeId}/idhinisha`, { method: 'POST', cookie: ownerCookie });
    assert.equal(db.prepare('SELECT subscription_expires_at FROM sellers WHERE id=?').get(sellerId).subscription_expires_at, expiryAfterApproval, 'replay cannot apply the same upgrade twice');

    const staffPassword = 'WorkflowStaffPass2026!';
    db.prepare(`INSERT INTO staff (jina, simu, email, password_hash, dhima, status) VALUES (?,?,?,?,?,'active')`)
      .run('Staff Test', '0700000099', 'staff@workflow.test', bcrypt.hashSync(staffPassword, 4), 'Review');
    const staffLogin = await request(base, '/portal-siri/ingia', {
      method: 'POST', data: { utambulisho: 'staff@workflow.test', password: staffPassword },
    });
    let staffCookie = cookieFrom(staffLogin);
    const staffTwoFactor = await request(base, '/portal-siri/2fa', {
      method: 'POST', data: { code: twoFactor }, cookie: staffCookie,
    });
    staffCookie = cookieFrom(staffTwoFactor, staffCookie);
    const staffFinancePage = await request(base, '/portal-siri/mipangilio', { cookie: staffCookie });
    assert.equal(staffFinancePage.status, 302);
    assert.equal(staffFinancePage.headers.get('location'), '/admin', 'staff must not access owner-only financial settings');

    await request(base, `/portal-siri/wauzaji/${sellerId}/kyc`, {
      method: 'POST', data: { status: 'rejected' }, cookie: ownerCookie,
    });
    const rejectedSeller = db.prepare('SELECT status, kyc_status FROM sellers WHERE id=?').get(sellerId);
    assert.equal(rejectedSeller.kyc_status, 'rejected');
    assert.equal(rejectedSeller.status, 'suspended', 'rejecting KYC on an approved seller must suspend access');
  } finally {
    if (child.exitCode === null) {
      await new Promise(resolve => {
        child.once('exit', resolve);
        child.kill();
      });
    }
    try { db.close(); } catch { /* test cleanup */ }
    if (previousDataDir === undefined) delete process.env.SOKO_DATA_DIR;
    else process.env.SOKO_DATA_DIR = previousDataDir;
    if (previousUploadDir === undefined) delete process.env.SOKO_UPLOAD_DIR;
    else process.env.SOKO_UPLOAD_DIR = previousUploadDir;
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
