-- TW-11 Phase 2: Email verification flow

ALTER TABLE players ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN verification_token TEXT;
ALTER TABLE players ADD COLUMN verification_expires_at DATETIME;
ALTER TABLE players ADD COLUMN verification_attempts INTEGER NOT NULL DEFAULT 0;

-- Existing players are grandfathered in as verified
UPDATE players SET email_verified = 1 WHERE email_verified = 0;
