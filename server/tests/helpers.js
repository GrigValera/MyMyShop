import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDatabase } from '../db/connection.js';
import { applyMigrations } from '../db/migrate.js';

export function temporaryDatabase(t, migrate = true) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mymyshop-server-'));
  const databasePath = path.join(directory, 'test.sqlite');
  const db = openDatabase(databasePath);
  t.after(() => {
    if (db.open) db.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  if (migrate) applyMigrations(db);
  return { db, databasePath, directory };
}

export const testConfig = Object.freeze({
  appEnv: 'test', host: '127.0.0.1', port: 3000, logLevel: 'silent', enableTestActor: true,
});
