CREATE TABLE submissions (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL,
  record_json TEXT NOT NULL CHECK (json_valid(record_json)),
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'changes_requested', 'registering', 'doi_failed', 'rejected', 'published', 'withdrawn')),
  note TEXT NOT NULL DEFAULT '',
  error_code TEXT,
  revision INTEGER NOT NULL DEFAULT 1,
  doi TEXT COLLATE NOCASE UNIQUE,
  doi_source TEXT CHECK (doi_source IN ('datacite', 'external')),
  landing_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT,
  lease_token TEXT,
  lease_until TEXT,
  CHECK (status NOT IN ('published', 'withdrawn') OR (doi IS NOT NULL AND doi_source IS NOT NULL AND published_at IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX submissions_owner ON submissions (owner_id, updated_at DESC);
--> statement-breakpoint
CREATE INDEX submissions_catalog ON submissions (status, published_at DESC, id DESC);
--> statement-breakpoint
CREATE INDEX submissions_country ON submissions (json_extract(record_json, '$.countryCode'), published_at DESC, id DESC)
WHERE status = 'published';
--> statement-breakpoint
CREATE INDEX submissions_queue ON submissions (status, updated_at DESC);
--> statement-breakpoint
CREATE TABLE uploads (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  media_type TEXT NOT NULL,
  size INTEGER NOT NULL CHECK (size > 0),
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX uploads_owner ON uploads (owner_id, created_at DESC);
--> statement-breakpoint
CREATE TABLE submission_uploads (
  upload_id TEXT PRIMARY KEY NOT NULL REFERENCES uploads(id),
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  position INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX submission_uploads_record ON submission_uploads (submission_id, position);
