CREATE TABLE profiles (
  user_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
