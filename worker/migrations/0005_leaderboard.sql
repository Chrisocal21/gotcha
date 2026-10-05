-- Leaderboard identity. Nobody appears on the board until they pick a screen name or approve a real
-- name. board_name is the only thing other players ever see.
ALTER TABLE profiles ADD COLUMN board_name TEXT;
ALTER TABLE profiles ADD COLUMN board_kind TEXT; -- 'screen' or 'real'
ALTER TABLE profiles ADD COLUMN board_at TEXT;

CREATE UNIQUE INDEX idx_profiles_board_name ON profiles (lower(board_name)) WHERE board_name IS NOT NULL;
CREATE INDEX idx_cards_user_species ON cards (user_id, species);
