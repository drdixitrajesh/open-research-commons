CREATE TABLE event_websites (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  record_json TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX event_websites_owner_updated ON event_websites (owner_id, event_type, updated_at DESC);
