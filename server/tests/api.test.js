import assert from 'node:assert/strict';
import test from 'node:test';
import { buildApp } from '../app.js';
import { openDatabase } from '../db/connection.js';
import { temporaryDatabase, testConfig } from './helpers.js';

function createApp(t, config = testConfig) {
  const { db, databasePath } = temporaryDatabase(t);
  const app = buildApp({ config, db, logger: false });
  t.after(() => app.close());
  return { app, db, databasePath };
}

function assertError(response, status, code) {
  assert.equal(response.statusCode, status);
  const body = response.json();
  assert.deepEqual(Object.keys(body).sort(), ['code', 'message', 'requestId', 'retryable']);
  assert.equal(body.code, code);
  assert.equal(body.requestId, response.headers['x-request-id']);
  assert.doesNotMatch(JSON.stringify(body), /sqlite|stack|\.db|\.sqlite|SELECT|C:\\/i);
}

test('health, readiness, headers, request IDs and safe not-found', async t => {
  const { app, db } = createApp(t);
  const health = await app.inject({ method: 'GET', url: '/api/v1/health', headers: { 'x-request-id': 'client-choice' } });
  assert.deepEqual(health.json(), { status: 'ok' });
  assert.equal(health.headers['x-content-type-options'], 'nosniff');
  assert.notEqual(health.headers['x-request-id'], 'client-choice');
  const ready = await app.inject({ method: 'GET', url: '/api/v1/ready' });
  assert.deepEqual(ready.json(), { status: 'ready' });
  assert.notEqual(ready.headers['x-request-id'], health.headers['x-request-id']);
  assertError(await app.inject({ method: 'GET', url: '/api/v1/no-route' }), 404, 'not_found');
  db.exec('DROP TABLE schema_migrations');
  assertError(await app.inject({ method: 'GET', url: '/api/v1/ready' }), 503, 'dependency_unavailable');
});

test('unexpected database failure has a safe 500 response', async t => {
  const { app, db } = createApp(t);
  db.exec('DROP TABLE actor_profiles');
  const response = await app.inject({ method: 'GET', url: '/api/v1/me', headers: { 'x-test-actor': 'reviewer' } });
  assertError(response, 500, 'internal');
});

test('protected profile validates, persists, and isolates actors', async t => {
  const { app, db, databasePath } = createApp(t);
  assertError(await app.inject({ method: 'GET', url: '/api/v1/me' }), 401, 'unauthorized');
  assertError(await app.inject({ method: 'GET', url: '/api/v1/me', headers: { 'x-test-actor': 'arbitrary' } }), 401, 'unauthorized');

  const reviewer = { 'x-test-actor': 'reviewer' };
  const second = { 'x-test-actor': 'second-reviewer' };
  const initial = await app.inject({ method: 'GET', url: '/api/v1/me', headers: reviewer });
  assert.equal(initial.statusCode, 200);
  assert.equal(initial.headers['cache-control'], 'no-store');
  assert.deepEqual(initial.json(), { actorId: 'reviewer', displayName: null, updatedAt: null });

  const updated = await app.inject({ method: 'PATCH', url: '/api/v1/me', headers: reviewer, payload: { displayName: 'Reviewer One' } });
  assert.equal(updated.statusCode, 200);
  assert.equal(updated.headers['cache-control'], 'no-store');
  assert.equal(updated.json().displayName, 'Reviewer One');
  assert.equal((await app.inject({ method: 'GET', url: '/api/v1/me', headers: reviewer })).json().displayName, 'Reviewer One');
  assert.equal((await app.inject({ method: 'GET', url: '/api/v1/me', headers: second })).json().displayName, null);

  assertError(await app.inject({ method: 'PATCH', url: '/api/v1/me', headers: second, payload: { actorId: 'reviewer', displayName: 'Intruder' } }), 400, 'validation');
  assert.equal(db.prepare('SELECT display_name FROM actor_profiles WHERE actor_id = ?').get('reviewer').display_name, 'Reviewer One');
  await app.close();
  db.close();

  const reopened = openDatabase(databasePath);
  const nextApp = buildApp({ config: testConfig, db: reopened, logger: false });
  const afterRestart = await nextApp.inject({ method: 'GET', url: '/api/v1/me', headers: reviewer });
  assert.equal(afterRestart.json().displayName, 'Reviewer One');
  await nextApp.close();
  reopened.close();
});

test('invalid profile bodies and malformed JSON use normalized errors', async t => {
  const { app } = createApp(t);
  const headers = { 'x-test-actor': 'reviewer' };
  for (const payload of [{}, { displayName: 42 }, { displayName: '' }, { displayName: ' '.repeat(3) }, { displayName: 'x'.repeat(81) }, { displayName: 'x', extra: true }, { actorId: 'second-reviewer', displayName: 'x' }]) {
    assertError(await app.inject({ method: 'PATCH', url: '/api/v1/me', headers, payload }), 400, 'validation');
  }
  assertError(await app.inject({ method: 'PATCH', url: '/api/v1/me', headers: { ...headers, 'content-type': 'application/json' }, payload: '{broken' }), 400, 'validation');
});

test('test actor is unavailable when disabled even with a valid header', async t => {
  const { app } = createApp(t, { ...testConfig, enableTestActor: false, appEnv: 'demo' });
  assertError(await app.inject({ method: 'GET', url: '/api/v1/me', headers: { 'x-test-actor': 'reviewer' } }), 401, 'unauthorized');
});
