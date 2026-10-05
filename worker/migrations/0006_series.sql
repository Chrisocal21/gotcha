-- Every card records the series it was caught in. Founders Edition is everything caught before public launch.
ALTER TABLE cards ADD COLUMN series TEXT NOT NULL DEFAULT 'founders';
