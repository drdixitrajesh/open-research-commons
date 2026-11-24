CREATE TABLE event_registration_forms (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 240),
  event_type TEXT NOT NULL CHECK (event_type IN ('conference', 'seminar', 'symposium', 'workshop', 'webinar', 'other')),
  mode TEXT NOT NULL CHECK (mode IN ('', 'inPerson', 'online', 'hybrid')),
  is_open INTEGER NOT NULL CHECK (is_open IN (0, 1)),
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX event_registration_forms_owner_type_updated
  ON event_registration_forms (owner_id, event_type, updated_at DESC, id DESC);
--> statement-breakpoint
CREATE TABLE event_registration_participants (
  id TEXT PRIMARY KEY NOT NULL,
  form_id TEXT NOT NULL REFERENCES event_registration_forms(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 160),
  email TEXT NOT NULL COLLATE NOCASE,
  organization TEXT NOT NULL,
  country TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('', 'inPerson', 'online')),
  created_at TEXT NOT NULL,
  UNIQUE (form_id, email)
);
--> statement-breakpoint
CREATE INDEX event_registration_participants_form_created
  ON event_registration_participants (form_id, created_at DESC, id DESC);
