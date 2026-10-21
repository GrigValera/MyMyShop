import { randomUUID } from 'node:crypto';
import Fastify, { LogController } from 'fastify';
import { assertSchemaReady } from './db/migrate.js';
import { createProfileRepository } from './profile/profileRepository.js';
import { createProfileService } from './profile/profileService.js';
import { resolveActor } from './auth/resolveActor.js';
import { readSessionCookie, sessionCookie, cookieName } from './auth/cookie.js';
import { createSessionRepository } from './auth/sessionRepository.js';
import { createSessionService } from './auth/sessionService.js';
import { createDemoIdentityVerifier } from './auth/demoIdentityVerifier.js';

const errorMessages = {
  validation: 'Invalid request',
  unauthorized: 'Authentication required',
  not_found: 'Resource not found',
  conflict: 'Request conflicts with current state',
  dependency_unavailable: 'Dependency unavailable',
  internal: 'Internal server error',
  forbidden: 'Operation is not available',
  invalid_credentials: 'Invalid credentials',
};

function sendError(reply, status, code, requestId) {
  return reply.code(status).send({ code, message: errorMessages[code], requestId, retryable: status >= 500 });
}

export function buildApp({ config, db, logger = { level: config.logLevel } }) {
  assertSchemaReady(db);
  const app = Fastify({
    logger,
    logController: new LogController({ disableRequestLogging: true }),
    ajv: { customOptions: { removeAdditional: false, coerceTypes: false } },
    requestIdHeader: false,
    genReqId: () => randomUUID(),
  });
  const profileService = createProfileService(createProfileRepository(db));
  const sessionService = createSessionService(createSessionRepository(db));
  const verifyDemoIdentity = createDemoIdentityVerifier(db);

  function requireOrigin(request, reply) {
    if (request.headers.origin !== config.publicOrigin) {
      sendError(reply, 403, 'forbidden', request.id);
      return false;
    }
    return true;
  }
  function sessionFromRequest(request) {
    if (config.appEnv === 'production') return null;
    return sessionService.find(readSessionCookie(request.headers.cookie, config));
  }
  function sessionBody(row) {
    return { status: 'authenticated', user: { id: row.actor_id ?? row.actorId, name: row.display_name ?? row.name }, mode: 'demo', expiresAt: row.expires_at ?? row.expiresAt,
      capabilities: { demoSignIn: config.enableDemoSignIn } };
  }

  app.addHook('onRequest', (request, reply, done) => {
    request.startedAt = process.hrtime.bigint();
    reply.header('X-Request-Id', request.id);
    reply.header('X-Content-Type-Options', 'nosniff');
    done();
  });

  app.addHook('onResponse', (request, reply, done) => {
    const durationMs = Number(process.hrtime.bigint() - request.startedAt) / 1e6;
    request.log.info({
      requestId: request.id,
      method: request.method,
      route: request.routeOptions?.url ?? 'unmatched',
      status: reply.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    }, 'request completed');
    done();
  });

  app.setErrorHandler((error, request, reply) => {
    if (error.validation || error.statusCode === 400 || error.statusCode === 415) return sendError(reply, 400, 'validation', request.id);
    request.log.error({ requestId: request.id, category: 'internal' }, 'request failed');
    return sendError(reply, 500, 'internal', request.id);
  });
  app.setNotFoundHandler((request, reply) => sendError(reply, 404, 'not_found', request.id));

  app.get('/api/v1/health', () => ({ status: 'ok' }));
  app.get('/api/v1/ready', (request, reply) => {
    try {
      assertSchemaReady(db);
      return { status: 'ready' };
    } catch {
      request.log.error({ requestId: request.id, category: 'dependency_unavailable' }, 'readiness failed');
      return sendError(reply, 503, 'dependency_unavailable', request.id);
    }
  });

  app.post('/api/v1/session', { schema: { body: {
    type: 'object', additionalProperties: false, required: ['email', 'password'],
    properties: {
      email: { type: 'string', minLength: 3, maxLength: 254, pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
      password: { type: 'string', minLength: 1, maxLength: 128 },
    },
  } } }, async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    if (!requireOrigin(request, reply)) return reply;
    if (!config.enableDemoSignIn || !['development', 'test', 'demo'].includes(config.appEnv)) return sendError(reply, 403, 'forbidden', request.id);
    const actorId = await verifyDemoIdentity(request.body);
    if (!actorId) return sendError(reply, 401, 'invalid_credentials', request.id);
    const row = sessionService.start(actorId, readSessionCookie(request.headers.cookie, config));
    reply.header('Set-Cookie', sessionCookie(config, row.token));
    return reply.code(201).send(sessionBody(row));
  });

  app.get('/api/v1/session', (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    const row = sessionFromRequest(request);
    if (row) return sessionBody(row);
    if (request.headers.cookie?.split(';').some(part => part.trim().startsWith(`${cookieName(config)}=`))) reply.header('Set-Cookie', sessionCookie(config));
    return { status: 'anonymous', user: null, capabilities: { demoSignIn: config.enableDemoSignIn } };
  });

  app.delete('/api/v1/session', (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    if (!requireOrigin(request, reply)) return reply;
    if (request.body !== undefined) return sendError(reply, 400, 'validation', request.id);
    sessionService.end(readSessionCookie(request.headers.cookie, config));
    reply.header('Set-Cookie', sessionCookie(config));
    return reply.code(204).send();
  });

  const profileSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['displayName'],
    properties: { displayName: { type: 'string', minLength: 1, maxLength: 80, pattern: '\\S' } },
  };
  const meOptions = { preHandler: (request, reply, done) => {
    reply.header('Cache-Control', 'no-store');
    const session = sessionFromRequest(request);
    const hasSessionCookie = request.headers.cookie?.split(';').some(part => part.trim().startsWith(`${cookieName(config)}=`));
    request.actorId = session?.actor_id ?? (!hasSessionCookie ? resolveActor(request, config) : null);
    if (!request.actorId) return sendError(reply, 401, 'unauthorized', request.id);
    if (request.method !== 'GET' && session && !requireOrigin(request, reply)) return reply;
    done();
  } };

  app.get('/api/v1/me', meOptions, request => profileService.get(request.actorId));
  app.patch('/api/v1/me', {
    ...meOptions,
    schema: { body: profileSchema },
  }, request => profileService.update(request.actorId, request.body.displayName.trim()));

  return app;
}
