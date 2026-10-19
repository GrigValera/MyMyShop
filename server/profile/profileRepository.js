export function createProfileRepository(db) {
  const find = db.prepare('SELECT actor_id, display_name, updated_at FROM actor_profiles WHERE actor_id = ?');
  const upsert = db.prepare(`
    INSERT INTO actor_profiles (actor_id, display_name, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(actor_id) DO UPDATE SET display_name = excluded.display_name, updated_at = excluded.updated_at
  `);

  return {
    findByActorId(actorId) {
      return find.get(actorId) ?? null;
    },
    save(actorId, displayName, updatedAt) {
      upsert.run(actorId, displayName, updatedAt);
      return find.get(actorId);
    },
  };
}
