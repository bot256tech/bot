-- ============================================================
-- AGRICHAIN 360 — Migration 009: Subscription Tiers & Trial
-- Adds trial tracking and subscription tier management.
-- Does NOT alter existing tables destructively.
-- ============================================================

-- Trial tracking on buyer profiles
ALTER TABLE buyer_profiles ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;
ALTER TABLE buyer_profiles ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(30) DEFAULT 'trial';
ALTER TABLE buyer_profiles ADD COLUMN IF NOT EXISTS subscription_billing VARCHAR(10) DEFAULT 'monthly';
ALTER TABLE buyer_profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

