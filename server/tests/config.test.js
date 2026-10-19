import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig } from '../config.js';

test('development defaults and explicit local test actor', () => {
  const config = loadConfig({ APP_ENV: 'development', ENABLE_TEST_ACTOR: 'true' });
  assert.equal(config.appEnv, 'development');
  assert.equal(config.host, '127.0.0.1');
  assert.equal(config.enableTestActor, true);
  assert.ok(config.databasePath.endsWith('development.sqlite'));
});

test('test requires an isolated database path', () => {
  assert.throws(() => loadConfig({ APP_ENV: 'test' }), /DATABASE_PATH/);
  assert.equal(loadConfig({ APP_ENV: 'test', DATABASE_PATH: 'test.sqlite' }).appEnv, 'test');
});

test('rejects invalid environment, port, and actor flag', () => {
  assert.throws(() => loadConfig({}), /APP_ENV/);
  assert.throws(() => loadConfig({ APP_ENV: 'other' }), /APP_ENV/);
  assert.throws(() => loadConfig({ APP_ENV: 'development', PORT: '0' }), /PORT/);
  assert.throws(() => loadConfig({ APP_ENV: 'development', PORT: '123x' }), /PORT/);
  assert.throws(() => loadConfig({ APP_ENV: 'development', ENABLE_TEST_ACTOR: 'yes' }), /ENABLE_TEST_ACTOR/);
  assert.throws(() => loadConfig({ APP_ENV: 'development', ENABLE_TEST_ACTOR: 'true', HOST: '0.0.0.0' }), /loopback/);
  assert.throws(() => loadConfig({ APP_ENV: 'development', ENABLE_TEST_ACTOR: 'true', NODE_ENV: 'production' }), /production NODE_ENV/);
});

test('demo and production fail closed on test actor flag', () => {
  for (const appEnv of ['demo', 'production']) {
    assert.throws(() => loadConfig({ APP_ENV: appEnv, DATABASE_PATH: '/durable/demo.sqlite', ENABLE_TEST_ACTOR: 'true' }), /forbidden/);
    assert.throws(() => loadConfig({ APP_ENV: appEnv }), /DATABASE_PATH/);
  }
});
