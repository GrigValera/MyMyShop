import assert from 'node:assert/strict';
import test from 'node:test';
import { buildApp } from '../app.js';
import { openDatabase } from '../db/connection.js';
import { temporaryDatabase, testConfig } from './helpers.js';
import { readSessionCookie, sessionCookie } from '../auth/cookie.js';
import { createHash } from 'node:crypto';

const origin = { origin: testConfig.publicOrigin };
const credentials = { email: 'demo@mymyshop.dev', password: 'DemoShop-2026!' };
const tokenCookie = response => response.headers['set-cookie'].split(';')[0];
function appFor(t, config = testConfig) {
  const { db, databasePath } = temporaryDatabase(t);
  const app = buildApp({ config, db, logger: false });
  t.after(() => app.close());
  return { app, db, databasePath };
}
async function signIn(app, cookie, payload = credentials, requestOrigin = origin) {
  return app.inject({ method: 'POST', url: '/api/v1/session', headers: { ...requestOrigin, ...(cookie ? { cookie } : {}) }, payload });
}
const session = (app, cookie) => app.inject({ method: 'GET', url: '/api/v1/session', headers: cookie ? { cookie } : {} });

test('credentials are checked on the server and failures create no session', async t => {
  const { app, db } = appFor(t);
  for (const payload of [
    { ...credentials, email: 'other@mymyshop.dev' },
    { ...credentials, password: 'incorrect' },
  ]) {
    const response = await signIn(app, null, payload);
    assert.equal(response.statusCode, 401);
    assert.equal(response.json().code, 'invalid_credentials');
    assert.equal(response.headers['set-cookie'], undefined);
    assert.equal(response.json().retryable, false);
  }
  for (const payload of [{}, { email: credentials.email }, { ...credentials, email: 'not-an-email' }, { ...credentials, password: '' }, { ...credentials, extra: true }]) {
    assert.equal((await signIn(app, null, payload)).statusCode, 400);
  }
  const malformed = await app.inject({ method: 'POST', url: '/api/v1/session', headers: { ...origin, 'content-type': 'application/json' }, payload: '{bad' });
  assert.equal(malformed.statusCode, 400);
  const noBody = await app.inject({ method: 'POST', url: '/api/v1/session', headers: origin });
  assert.equal(noBody.statusCode, 400);
  assert.equal(noBody.headers['set-cookie'], undefined);
  assert.equal(db.prepare('SELECT count(*) AS n FROM sessions').get().n, 0);
  assert.equal((await session(app)).json().status, 'anonymous');
});

test('production rejects and clears a valid demo session from the same database', async t => {
  const { db } = temporaryDatabase(t);
  const publicOrigin = 'https://shop.example';
  const demoConfig = { ...testConfig, appEnv: 'demo', publicOrigin, enableTestActor: false };
  const productionConfig = { ...demoConfig, appEnv: 'production', enableDemoSignIn: false, enableTestActor: true };
  const demo = buildApp({ config: demoConfig, db, logger: false });
  const production = buildApp({ config: productionConfig, db, logger: false });
  t.after(() => Promise.all([demo.close(), production.close()]));
  const created = await signIn(demo, null, credentials, { origin: publicOrigin });
  assert.equal(created.statusCode, 201);
  const cookie = tokenCookie(created);
  assert.equal((await session(demo, cookie)).json().status, 'authenticated');
  const rejected = await session(production, cookie);
  assert.equal(rejected.json().status, 'anonymous');
  assert.match(rejected.headers['set-cookie'], /Max-Age=0/);
  assert.equal((await production.inject({ method: 'GET', url: '/api/v1/me', headers: { cookie, 'x-test-actor': 'reviewer' } })).statusCode, 401);
  assert.equal((await session(demo, cookie)).json().status, 'authenticated');
});

test('old credentialless demo sessions cannot restore after identity migration', async t => {
  const { app, db } = appFor(t);
  const token = 'a'.repeat(43);
  const tokenHash = createHash('sha256').update(token).digest('hex');
  db.prepare('INSERT INTO actors VALUES (?, ?, ?)').run('old-demo-actor', 'demo', new Date().toISOString());
  db.prepare('INSERT INTO actor_profiles VALUES (?, ?, ?)').run('old-demo-actor', 'Old Demo', new Date().toISOString());
  db.prepare('INSERT INTO sessions VALUES (?, ?, ?, ?)').run(tokenHash, 'old-demo-actor', new Date().toISOString(), new Date(Date.now() + 86_400_000).toISOString());
  const cookie = `mymyshop-dev-session=${token}`;
  assert.equal((await session(app, cookie)).json().status, 'anonymous');
  assert.equal((await app.inject({ method: 'GET', url: '/api/v1/me', headers: { cookie } })).statusCode, 401);
});

test('request logs omit passwords and session tokens', async t => {
  const { db } = temporaryDatabase(t);
  const lines = [];
  const app = buildApp({ config: testConfig, db, logger: { level: 'info', stream: { write: line => lines.push(line) } } });
  t.after(() => app.close());
  const response = await signIn(app);
  assert.equal(response.statusCode, 201);
  await session(app, tokenCookie(response));
  const logs = lines.join('');
  assert.ok(logs.includes('request completed'));
  assert.doesNotMatch(logs, /DemoShop-2026!|demo@mymyshop\.dev|mymyshop-dev-session|password_hash|token_hash/);
});

test('verified demo identity restores and rotates its session', async t => {
  const { app, db, databasePath } = appFor(t);
  const initial = await session(app);
  assert.deepEqual(initial.json(), { status: 'anonymous', user: null, capabilities: { demoSignIn: true } });
  assert.equal(initial.headers['cache-control'], 'no-store');
  const first = await signIn(app);
  assert.equal(first.statusCode, 201);
  const cookie = tokenCookie(first);
  assert.match(cookie, /^mymyshop-dev-session=[A-Za-z0-9_-]{43}$/);
  assert.doesNotMatch(JSON.stringify(first.json()), /mymyshop-dev-session|token_hash/);
  assert.equal(first.json().status, 'authenticated');
  assert.equal((await session(app, cookie)).json().user.id, first.json().user.id);
  assert.equal(db.prepare('SELECT length(token_hash) AS n FROM sessions').get().n, 64);
  const second = await signIn(app);
  assert.equal(second.json().user.id, first.json().user.id);
  assert.equal((await session(app, cookie)).json().status, 'anonymous');
  assert.equal((await app.inject({ method: 'GET', url: '/api/v1/me', headers: { cookie: tokenCookie(second) } })).json().displayName, 'Demo User');
  const rotated = await signIn(app, cookie);
  assert.equal((await session(app, cookie)).json().status, 'anonymous');
  assert.equal((await session(app, tokenCookie(rotated))).json().status, 'authenticated');
  assert.equal(db.prepare("SELECT count(*) AS n FROM actors WHERE kind = 'demo'").get().n, 1);
  await app.close(); db.close();
  const reopened = openDatabase(databasePath);
  const next = buildApp({ config: testConfig, db: reopened, logger: false });
  assert.equal((await session(next, tokenCookie(rotated))).json().status, 'authenticated');
  await next.close(); reopened.close();
});

test('cookie parser rejects duplicates and malformed token values', () => {
  const token = 'a'.repeat(43);
  const cookie = `mymyshop-dev-session=${token}`;
  assert.equal(readSessionCookie(cookie, testConfig), token);
  assert.equal(readSessionCookie(`${cookie}; ${cookie}`, testConfig), null);
  assert.equal(readSessionCookie('mymyshop-dev-session=bad', testConfig), null);
  assert.match(sessionCookie(testConfig), /HttpOnly; SameSite=Lax; Max-Age=0/);
  assert.doesNotMatch(sessionCookie(testConfig, token), /Secure/);
});

test('profile persists through cookie and logout revokes access idempotently', async t => {
  const { app } = appFor(t);
  const created = await signIn(app);
  const cookie = tokenCookie(created);
  const me = await app.inject({ method: 'GET', url: '/api/v1/me', headers: { cookie } });
  assert.equal(me.json().actorId, created.json().user.id);
  const updated = await app.inject({ method: 'PATCH', url: '/api/v1/me', headers: { cookie, ...origin }, payload: { displayName: 'Alice' } });
  assert.equal(updated.json().displayName, 'Alice');
  assert.equal((await app.inject({ method: 'GET', url: '/api/v1/me', headers: { cookie } })).json().displayName, 'Alice');
  for (let i = 0; i < 2; i++) {
    const result = await app.inject({ method: 'DELETE', url: '/api/v1/session', headers: { cookie, ...origin } });
    assert.equal(result.statusCode, 204);
    assert.match(result.headers['set-cookie'], /Max-Age=0/);
  }
  assert.equal((await session(app, cookie)).json().status, 'anonymous');
  assert.equal((await app.inject({ method: 'GET', url: '/api/v1/me', headers: { cookie } })).statusCode, 401);
  const again = await signIn(app);
  assert.equal(again.json().user.id, created.json().user.id);
  assert.equal(again.json().user.name, 'Alice');
  assert.equal((await app.inject({ method: 'GET', url: '/api/v1/me', headers: { cookie: tokenCookie(again) } })).json().displayName, 'Alice');
});

test('invalid, expired, and malformed cookie never grants access', async t => {
  const { app, db } = appFor(t);
  const created = await signIn(app);
  const cookie = tokenCookie(created);
  const invalid = cookie.replace(/.$/, 'x');
  assert.equal((await session(app, invalid)).json().status, 'anonymous');
  db.prepare('UPDATE sessions SET expires_at = ?').run('2000-01-01T00:00:00.000Z');
  const expired = await session(app, cookie);
  assert.equal(expired.json().status, 'anonymous');
  assert.match(expired.headers['set-cookie'], /Max-Age=0/);
  assert.equal((await app.inject({ method: 'GET', url: '/api/v1/me', headers: { cookie, 'x-test-actor': 'reviewer' } })).statusCode, 401);
});

test('origin, body, mode, error contract and HTTPS cookie policy', async t => {
  const { app } = appFor(t);
  for (const headers of [{}, { origin: 'https://evil.example' }]) {
    const response = await app.inject({ method: 'POST', url: '/api/v1/session', headers, payload: credentials });
    assert.equal(response.statusCode, 403);
    assert.deepEqual(Object.keys(response.json()).sort(), ['code', 'message', 'requestId', 'retryable']);
    assert.equal(response.json().requestId, response.headers['x-request-id']);
  }
  assert.equal((await app.inject({ method: 'POST', url: '/api/v1/session', headers: origin, payload: {} })).statusCode, 400);
  assert.equal((await app.inject({ method: 'POST', url: '/api/v1/session', headers: { ...origin, 'content-type': 'text/plain' }, payload: 'x' })).statusCode, 400);
  const created = await signIn(app);
  const cookie = tokenCookie(created);
  assert.equal((await app.inject({ method: 'PATCH', url: '/api/v1/me', headers: { cookie, origin: 'https://evil.example' }, payload: { displayName: 'Evil' } })).statusCode, 403);
  assert.equal((await app.inject({ method: 'DELETE', url: '/api/v1/session', headers: { cookie, origin: 'https://evil.example' } })).statusCode, 403);
  assert.equal((await session(app, cookie)).json().status, 'authenticated');
  const disabled = appFor(t, { ...testConfig, enableDemoSignIn: false, enableTestActor: false });
  assert.equal((await signIn(disabled.app)).statusCode, 403);
  assert.equal((await session(disabled.app)).json().capabilities.demoSignIn, false);
  const https = appFor(t, { ...testConfig, appEnv: 'demo', enableTestActor: false, publicOrigin: 'https://shop.example' });
  const secure = await signIn(https.app, null, credentials, { origin: 'https://shop.example' });
  assert.match(secure.headers['set-cookie'], /^__Host-mymyshop-session=/);
  assert.match(secure.headers['set-cookie'], /HttpOnly; SameSite=Lax; Secure/);
});
