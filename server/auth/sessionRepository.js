export function createSessionRepository(db) {
  const createSession = db.prepare('INSERT INTO sessions (token_hash, actor_id, created_at, expires_at) VALUES (?, ?, ?, ?)');
  const find = db.prepare(`SELECT s.actor_id, s.expires_at, a.kind, p.display_name
    FROM sessions s JOIN actors a ON a.id = s.actor_id
    JOIN demo_identities i ON i.actor_id = a.id
    LEFT JOIN actor_profiles p ON p.actor_id = a.id WHERE s.token_hash = ?`);
  const remove = db.prepare('DELETE FROM sessions WHERE token_hash = ?');
  const cleanup = db.prepare('DELETE FROM sessions WHERE expires_at <= ?');
  const transaction = db.transaction((actorId, hash, now, expiresAt, previousHash) => {
    if (previousHash) remove.run(previousHash);
    db.prepare('DELETE FROM sessions WHERE actor_id = ?').run(actorId);
    cleanup.run(now);
    createSession.run(hash, actorId, now, expiresAt);
  });
  return {
    createForActor: transaction,
    find: hash => find.get(hash) ?? null,
    remove: hash => remove.run(hash),
  };
}
