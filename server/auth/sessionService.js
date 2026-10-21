import { createHash, randomBytes } from 'node:crypto';

const ttlMs = 7 * 24 * 60 * 60 * 1000;
const hash = token => createHash('sha256').update(token).digest('hex');

export function createSessionService(repository, now = () => Date.now()) {
  function find(token) {
    if (!token) return null;
    const row = repository.find(hash(token));
    return row && Date.parse(row.expires_at) > now() ? row : null;
  }
  return {
    find,
    start(actorId, previousToken) {
      const token = randomBytes(32).toString('base64url');
      const createdAt = new Date(now()).toISOString();
      const expiresAt = new Date(now() + ttlMs).toISOString();
      repository.createForActor(actorId, hash(token), createdAt, expiresAt, previousToken ? hash(previousToken) : null);
      const row = repository.find(hash(token));
      return { token, actorId, expiresAt, name: row.display_name };
    },
    end(token) { if (token) repository.remove(hash(token)); },
  };
}
