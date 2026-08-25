-- ============================================================
-- AGRICHAIN 360 — Migration 010: Automatic trial default
-- Every new buyer_profiles row automatically gets a 3-day trial.
-- No application code needed — the database handles it.
-- ============================================================
ALTER TABLE buyer_profiles ALTER COLUMN trial_expires_at
  SET DEFAULT NOW() + INTERVAL '3 days';

-- Backfill: give existing buyers a fresh 3-day trial
UPDATE buyer_profiles
SET trial_expires_at = NOW() + INTERVAL '3 days',
    subscription_tier = 'trial'
WHERE trial_expires_at IS NULL;
