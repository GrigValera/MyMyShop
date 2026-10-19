const allowedActors = new Set(['reviewer', 'second-reviewer']);

export function resolveActor(request, config) {
  if (!config.enableTestActor || !['development', 'test'].includes(config.appEnv)) return null;
  const actor = request.headers['x-test-actor'];
  return typeof actor === 'string' && allowedActors.has(actor) ? actor : null;
}
