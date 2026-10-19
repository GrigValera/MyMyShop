import { loadConfig } from './config.js';
import { openDatabase } from './db/connection.js';
import { buildApp } from './app.js';

let app;
let db;
try {
  const config = loadConfig();
  db = openDatabase(config.databasePath);
  app = buildApp({ config, db });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, async () => {
      try {
        await app.close();
        db.close();
      } finally {
        process.exit(0);
      }
    });
  }
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  process.stderr.write(`Server startup failed: ${error.message}\n`);
  await app?.close();
  db?.close();
  process.exitCode = 1;
}
