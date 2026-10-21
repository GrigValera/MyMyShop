export function createProfileRepository(db) {
  const find = db.prepare('SELECT actor_id, display_name, updated_at FROM actor_profiles WHERE actor_id = ?');
  const upsert = db.prepare(`
    INSERT INTO actor_profiles (actor_id, display_name, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(actor_id) DO UPDATE SET display_name = excluded.display_name, updated_at = excluded.updated_at
  `);
  const ensureTestActor = db.prepare("INSERT OR IGNORE INTO actors (id, kind, created_at) VALUES (?, 'test', ?)");

  return {
    findByActorId(actorId) {
      return find.get(actorId) ?? null;
    },
    save(actorId, displayName, updatedAt) {
      ensureTestActor.run(actorId, updatedAt);
      upsert.run(actorId, displayName, updatedAt);
      return find.get(actorId);
    },
  };
}
