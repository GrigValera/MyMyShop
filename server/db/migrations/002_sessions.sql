CREATE TABLE actors (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('demo', 'test')),
  created_at TEXT NOT NULL
);

INSERT INTO actors (id, kind, created_at)
SELECT actor_id, 'test', updated_at FROM actor_profiles;

CREATE TABLE actor_profiles_new (
  actor_id TEXT PRIMARY KEY REFERENCES actors(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 80),
  updated_at TEXT NOT NULL
);
INSERT INTO actor_profiles_new SELECT * FROM actor_profiles;
DROP TABLE actor_profiles;
ALTER TABLE actor_profiles_new RENAME TO actor_profiles;

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX sessions_actor_id_idx ON sessions(actor_id);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);
