CREATE TABLE actor_profiles (
  actor_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 80),
  updated_at TEXT NOT NULL
);
