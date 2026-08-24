-- ============================================================
-- AGRICHAIN 360 — Migration 007: encrypted field storage
-- national_id now stores AES-256-GCM ciphertext (v1:iv:tag:ct),
-- which is longer than the previous plain 30-char field.
-- ============================================================
ALTER TABLE farmers ALTER COLUMN national_id TYPE VARCHAR(255);
