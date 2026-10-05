-- The person's look for the app (colors, background design, fonts), kept on their account so every
-- device they sign in on matches. style is the app's own JSON; style_at says which copy is newest.
ALTER TABLE profiles ADD COLUMN style TEXT;
ALTER TABLE profiles ADD COLUMN style_at INTEGER;
