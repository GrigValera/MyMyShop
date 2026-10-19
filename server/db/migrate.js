import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../config.js';
import { openDatabase } from './connection.js';

const migrationsDir = fileURLToPath(new URL('./migrations/', import.meta.url));

export function migrationFiles(directory = migrationsDir) {
  return fs.readdirSync(directory).filter(name => /^\d+_[a-z0-9_]+\.sql$/.test(name)).sort();
}

export function assertSchemaReady(db, directory = migrationsDir) {
  const files = migrationFiles(directory);
  const table = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'").get();
  if (!table) throw new Error('Database migrations are required');
  const applied = db.prepare('SELECT version FROM schema_migrations ORDER BY version').all().map(row => row.version);
  if (files.length !== applied.length || files.some((name, index) => name !== applied[index])) {
    throw new Error('Database schema version does not match server migrations');
  }
  db.prepare('SELECT 1').get();
}

export function applyMigrations(db, directory = migrationsDir) {
  const files = migrationFiles(directory);
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
  const applied = new Set(db.prepare('SELECT version FROM schema_migrations').all().map(row => row.version));
  if ([...applied].some(version => !files.includes(version))) throw new Error('Unknown database migration');

  for (const name of files) {
    if (applied.has(name)) continue;
    const sql = fs.readFileSync(path.join(directory, name), 'utf8');
    db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(name, new Date().toISOString());
    })();
  }
  assertSchemaReady(db, directory);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let db;
  try {
    const config = loadConfig();
    db = openDatabase(config.databasePath);
    applyMigrations(db);
    process.stdout.write('Database migrations are current\n');
  } catch (error) {
    process.stderr.write(`Migration failed: ${error.message}\n`);
    process.exitCode = 1;
  } finally {
    db?.close();
  }
}
