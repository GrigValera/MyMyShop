import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { applyMigrations, assertSchemaReady } from '../db/migrate.js';
import { buildApp } from '../app.js';
import { temporaryDatabase, testConfig } from './helpers.js';

test('fresh migration tracks version and repeated migration changes nothing', t => {
  const { db } = temporaryDatabase(t, false);
  assert.throws(() => assertSchemaReady(db), /migrations/);
  applyMigrations(db);
  assertSchemaReady(db);
  assert.deepEqual(db.prepare('SELECT version FROM schema_migrations').all(), [{ version: '001_actor_profiles.sql' }, { version: '002_sessions.sql' }, { version: '003_demo_identity.sql' }]);
  applyMigrations(db);
  assert.equal(db.prepare('SELECT count(*) AS count FROM schema_migrations').get().count, 3);
});

test('failed migration rolls back its schema and version', t => {
  const { db, directory } = temporaryDatabase(t, false);
  const migrationDir = path.join(directory, 'migrations');
  fs.mkdirSync(migrationDir);
  fs.writeFileSync(path.join(migrationDir, '001_broken.sql'), 'CREATE TABLE partial_change (id TEXT); INVALID SQL;');
  assert.throws(() => applyMigrations(db, migrationDir));
  assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name = 'partial_change'").get(), undefined);
  assert.equal(db.prepare('SELECT count(*) AS count FROM schema_migrations').get().count, 0);
});

test('server refuses a database with unapplied migrations', t => {
  const { db } = temporaryDatabase(t, false);
  assert.throws(() => buildApp({ config: testConfig, db, logger: false }), /migrations/);
});

test('session migration preserves existing profile rows and adds foreign keys', t => {
  const { db } = temporaryDatabase(t, false);
  db.exec("CREATE TABLE actor_profiles (actor_id TEXT PRIMARY KEY, display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 80), updated_at TEXT NOT NULL)");
  db.exec("CREATE TABLE schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
  db.prepare('INSERT INTO schema_migrations VALUES (?, ?)').run('001_actor_profiles.sql', '2026-01-01T00:00:00.000Z');
  db.prepare('INSERT INTO actor_profiles VALUES (?, ?, ?)').run('reviewer', 'Existing Name', '2026-01-01T00:00:00.000Z');
  applyMigrations(db);
  assert.equal(db.prepare('SELECT display_name FROM actor_profiles WHERE actor_id = ?').get('reviewer').display_name, 'Existing Name');
  assert.equal(db.prepare('SELECT kind FROM actors WHERE id = ?').get('reviewer').kind, 'test');
  assert.equal(db.pragma('foreign_key_check').length, 0);
  applyMigrations(db);
});

test('identity migration adopts an existing demo-reviewer without losing its profile', async t => {
  const { db } = temporaryDatabase(t, false);
  db.exec("CREATE TABLE actor_profiles (actor_id TEXT PRIMARY KEY, display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 80), updated_at TEXT NOT NULL)");
  db.exec("CREATE TABLE schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
  db.prepare('INSERT INTO schema_migrations VALUES (?, ?)').run('001_actor_profiles.sql', '2026-01-01T00:00:00.000Z');
  db.prepare('INSERT INTO actor_profiles VALUES (?, ?, ?)').run('demo-reviewer', 'Existing Reviewer', '2026-01-01T00:00:00.000Z');
  applyMigrations(db);
  assert.equal(db.prepare('SELECT kind FROM actors WHERE id = ?').get('demo-reviewer').kind, 'demo');
  assert.equal(db.prepare('SELECT display_name FROM actor_profiles WHERE actor_id = ?').get('demo-reviewer').display_name, 'Existing Reviewer');
  assert.equal(db.prepare('SELECT actor_id FROM demo_identities').get().actor_id, 'demo-reviewer');
  assert.deepEqual(db.pragma('foreign_key_check'), []);
  applyMigrations(db);
  const app = buildApp({ config: testConfig, db, logger: false });
  t.after(() => app.close());
  const login = await app.inject({ method: 'POST', url: '/api/v1/session', headers: { origin: testConfig.publicOrigin }, payload: { email: 'demo@mymyshop.dev', password: 'DemoShop-2026!' } });
  assert.equal(login.statusCode, 201);
  assert.deepEqual(login.json().user, { id: 'demo-reviewer', name: 'Existing Reviewer' });
});
