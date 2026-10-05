-- local_day: the explorer's own calendar day when the card was caught, so the daily limit, streaks and
-- boards roll over at their midnight. Older cards keep the UTC day they were saved under.
ALTER TABLE cards ADD COLUMN local_day TEXT;
UPDATE cards SET local_day = substr(created_at, 1, 10) WHERE local_day IS NULL;
CREATE INDEX idx_cards_user_day ON cards (user_id, local_day);

-- wild: 1 for a wild species (not domestic, not a statue, not a sample). Worked out when the card is made.
ALTER TABLE cards ADD COLUMN wild INTEGER NOT NULL DEFAULT 0;
UPDATE cards SET wild = 1
  WHERE is_statue = 0 AND is_sample = 0 AND facts != '{}'
    AND json_extract(facts, '$.conservation_status') IS NOT NULL
    AND lower(json_extract(facts, '$.conservation_status')) NOT LIKE '%domestic%';
