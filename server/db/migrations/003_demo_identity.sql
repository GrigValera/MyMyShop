CREATE TABLE demo_identities (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  actor_id TEXT NOT NULL UNIQUE REFERENCES actors(id) ON DELETE CASCADE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL
);

INSERT INTO actors (id, kind, created_at)
VALUES ('demo-reviewer', 'demo', '2026-10-19T00:00:00.000Z')
ON CONFLICT(id) DO UPDATE SET kind = 'demo';
INSERT INTO actor_profiles (actor_id, display_name, updated_at)
VALUES ('demo-reviewer', 'Demo User', '2026-10-19T00:00:00.000Z')
ON CONFLICT(actor_id) DO NOTHING;
INSERT INTO demo_identities (email, actor_id, password_salt, password_hash)
VALUES (
  'demo@mymyshop.dev', 'demo-reviewer',
  '312218d45530583681194e39086f1dcb',
  '8893bf1b2535a9fa22da7ca49ae1fe32f7cdcb75dddad35a1b9ade2e6a47221e7fbef4b97559e4ae56f9f83503d0a801c482166f9828a79a14b90242287d6143'
);
