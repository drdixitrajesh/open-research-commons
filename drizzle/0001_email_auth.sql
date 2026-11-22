CREATE TABLE auth_accounts (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  legacy_owner_id TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  profile_completed INTEGER NOT NULL DEFAULT 0 CHECK (profile_completed IN (0, 1)),
  mobile_ciphertext TEXT
);
--> statement-breakpoint
CREATE TABLE auth_challenges (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL,
  legacy_owner_id TEXT,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0)
);
--> statement-breakpoint
CREATE INDEX auth_challenges_expiry ON auth_challenges (expires_at);
--> statement-breakpoint
CREATE TABLE auth_sessions (
  session_hash TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL REFERENCES auth_accounts(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX auth_sessions_expiry ON auth_sessions (expires_at);
--> statement-breakpoint
CREATE TABLE auth_rate_limits (
  scope TEXT NOT NULL,
  identifier TEXT NOT NULL,
  reset_at INTEGER NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count > 0),
  PRIMARY KEY (scope, identifier, reset_at)
);
--> statement-breakpoint
CREATE INDEX auth_rate_limits_expiry ON auth_rate_limits (reset_at);
