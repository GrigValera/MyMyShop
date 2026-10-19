import { randomUUID } from 'node:crypto';
import Fastify, { LogController } from 'fastify';
import { assertSchemaReady } from './db/migrate.js';
import { createProfileRepository } from './profile/profileRepository.js';
import { createProfileService } from './profile/profileService.js';
import { resolveActor } from './auth/resolveActor.js';

const errorMessages = {
  validation: 'Invalid request',
  unauthorized: 'Authentication required',
  not_found: 'Resource not found',
  conflict: 'Request conflicts with current state',
  dependency_unavailable: 'Dependency unavailable',
  internal: 'Internal server error',
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
    if (error.validation || error.statusCode === 400) return sendError(reply, 400, 'validation', request.id);
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

  const profileSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['displayName'],
    properties: { displayName: { type: 'string', minLength: 1, maxLength: 80, pattern: '\\S' } },
  };
  const meOptions = { preHandler: (request, reply, done) => {
    reply.header('Cache-Control', 'no-store');
    request.actorId = resolveActor(request, config);
    if (!request.actorId) return sendError(reply, 401, 'unauthorized', request.id);
    done();
  } };

  app.get('/api/v1/me', meOptions, request => profileService.get(request.actorId));
  app.patch('/api/v1/me', {
    ...meOptions,
    schema: { body: profileSchema },
  }, request => profileService.update(request.actorId, request.body.displayName.trim()));

  return app;
}
