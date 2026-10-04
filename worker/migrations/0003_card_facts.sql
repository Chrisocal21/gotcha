-- Real-world facts about the animal (JSON), recorded when the card is made.
ALTER TABLE cards ADD COLUMN facts TEXT NOT NULL DEFAULT '{}';
