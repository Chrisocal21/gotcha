-- Animal class gives every card its color identity (mammal, bird, insect, ...).
ALTER TABLE cards ADD COLUMN animal_class TEXT NOT NULL DEFAULT 'mammal';

-- Sample cards are made in mock mode (no OpenAI key). Kept apart so they can be repainted or removed.
ALTER TABLE cards ADD COLUMN is_sample INTEGER NOT NULL DEFAULT 0;

UPDATE cards SET is_sample = 1 WHERE art_key LIKE '%.svg';
UPDATE cards SET animal_class = 'insect' WHERE lower(species) IN ('honey bee', 'monarch butterfly');
UPDATE cards SET animal_class = 'bird' WHERE lower(species) IN ('american robin', 'mallard');
UPDATE cards SET animal_class = 'arachnid' WHERE lower(species) = 'cross orbweaver';
UPDATE cards SET animal_class = 'reptile' WHERE lower(species) = 'green anole';
