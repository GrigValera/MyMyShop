import path from 'node:path';

const environments = new Set(['development', 'test', 'demo', 'production']);
const levels = new Set(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']);

export function loadConfig(env = process.env) {
  const appEnv = env.APP_ENV;
  if (!environments.has(appEnv)) throw new Error('Invalid APP_ENV');

  const host = env.HOST ?? '127.0.0.1';
  if (!host || /\s/.test(host)) throw new Error('Invalid HOST');

  const rawPort = env.PORT ?? '3000';
  if (!/^[0-9]+$/.test(rawPort) || Number(rawPort) < 1 || Number(rawPort) > 65535) {
    throw new Error('Invalid PORT');
  }

  const logLevel = env.LOG_LEVEL ?? 'info';
  if (!levels.has(logLevel)) throw new Error('Invalid LOG_LEVEL');

  const actorFlag = env.ENABLE_TEST_ACTOR ?? 'false';
  if (actorFlag !== 'true' && actorFlag !== 'false') throw new Error('Invalid ENABLE_TEST_ACTOR');
  const enableTestActor = actorFlag === 'true';
  const demoFlag = env.ENABLE_DEMO_SIGN_IN ?? 'false';
  if (!['true', 'false'].includes(demoFlag)) throw new Error('Invalid ENABLE_DEMO_SIGN_IN');
  const enableDemoSignIn = demoFlag === 'true';
  if (enableDemoSignIn && !['development', 'test', 'demo'].includes(appEnv)) throw new Error('Demo sign-in is forbidden in this APP_ENV');
  if (enableTestActor && !['development', 'test'].includes(appEnv)) {
    throw new Error('Test actor is forbidden in this APP_ENV');
  }
  if (enableTestActor && env.NODE_ENV === 'production') {
    throw new Error('Test actor is forbidden with production NODE_ENV');
  }
  if (enableTestActor && !['127.0.0.1', 'localhost', '::1'].includes(host)) {
    throw new Error('Test actor requires a loopback HOST');
  }

  const databasePath = env.DATABASE_PATH ?? (appEnv === 'development' ? 'server/data/development.sqlite' : undefined);
  if (!databasePath || databasePath.trim() === '' || databasePath === ':memory:') {
    throw new Error('DATABASE_PATH is required');
  }
  if (['demo', 'production'].includes(appEnv) && !path.isAbsolute(databasePath)) {
    throw new Error('DATABASE_PATH must be absolute in demo and production');
  }
  const publicOrigin = env.PUBLIC_ORIGIN;
  if (!publicOrigin) throw new Error('PUBLIC_ORIGIN is required');
  let origin;
  try { origin = new URL(publicOrigin); } catch { throw new Error('Invalid PUBLIC_ORIGIN'); }
  if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== publicOrigin || origin.username || origin.password) throw new Error('Invalid PUBLIC_ORIGIN');
  if (['demo', 'production'].includes(appEnv) && origin.protocol !== 'https:') throw new Error('Public origin requires HTTPS');
  if (origin.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)) throw new Error('HTTP requires loopback origin');

  return Object.freeze({
    appEnv, host, port: Number(rawPort), logLevel, enableTestActor,
    databasePath: path.resolve(databasePath), publicOrigin, enableDemoSignIn,
  });
}
