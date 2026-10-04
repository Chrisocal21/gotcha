CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  is_statue INTEGER NOT NULL DEFAULT 0,
  rarity TEXT NOT NULL,
  description TEXT NOT NULL,
  traits TEXT NOT NULL,
  stats TEXT NOT NULL,
  special_name TEXT NOT NULL,
  special_description TEXT NOT NULL,
  art_key TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_cards_user ON cards (user_id, created_at DESC);

CREATE TABLE daily_counts (
  user_id TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
