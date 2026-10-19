function present(row, actorId) {
  return {
    actorId,
    displayName: row?.display_name ?? null,
    updatedAt: row?.updated_at ?? null,
  };
}

export function createProfileService(repository, now = () => new Date().toISOString()) {
  return {
    get(actorId) {
      return present(repository.findByActorId(actorId), actorId);
    },
    update(actorId, displayName) {
      return present(repository.save(actorId, displayName, now()), actorId);
    },
  };
}
