-- Feedback from testers, reports about players, and an index so the global daily count is quick.
CREATE TABLE feedback (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'feedback',   -- feedback, bug or idea
  message    TEXT NOT NULL,
  app_info   TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX idx_feedback_created ON feedback (created_at);

CREATE TABLE reports (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id    TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  target_name    TEXT NOT NULL,
  reason         TEXT NOT NULL,
  created_at     TEXT NOT NULL,
  UNIQUE (reporter_id, target_user_id)
);

CREATE INDEX idx_cards_created ON cards (created_at);
