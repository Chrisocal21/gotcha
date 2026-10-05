-- Special roles shown as a tag next to a name. Only the server sets this, never the app.
ALTER TABLE profiles ADD COLUMN role TEXT;
