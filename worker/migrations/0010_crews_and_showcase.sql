-- Crews: small invite-only groups (family, friends, a class) with their own leaderboard.
CREATE TABLE crews (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  owner TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE crew_members (
  crew_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  joined_at TEXT NOT NULL,
  PRIMARY KEY (crew_id, user_id)
);
CREATE INDEX idx_crew_members_user ON crew_members (user_id);

-- Up to three card ids the player chose to show on their public page, favorite first.
ALTER TABLE profiles ADD COLUMN showcase TEXT;
