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
  assert.deepEqual(db.prepare('SELECT version FROM schema_migrations').all(), [{ version: '001_actor_profiles.sql' }]);
  applyMigrations(db);
  assert.equal(db.prepare('SELECT count(*) AS count FROM schema_migrations').get().count, 1);
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
