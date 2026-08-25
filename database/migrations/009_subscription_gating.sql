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

-- Seed the three tiers
INSERT INTO subscription_plans (name, display_name, monthly_price, currency, features, is_active, created_at)
VALUES
  ('basic', 'Basic Access', 150000, 'UGX',
   '["marketplace_full","farmer_contacts","basic_quality_metrics"]'::jsonb, true, NOW()),
  ('premium', 'Premium Access', 350000, 'UGX',
   '["marketplace_full","farmer_contacts","basic_quality_metrics","download_certificates","batch_provenance","direct_ordering"]'::jsonb, true, NOW()),
  ('investor', 'Investor / NGO Tier', 500000, 'UGX',
   '["marketplace_full","farmer_contacts","basic_quality_metrics","download_certificates","batch_provenance","direct_ordering","regional_analytics"]'::jsonb, true, NOW())
ON CONFLICT (name) DO UPDATE SET
  monthly_price = EXCLUDED.monthly_price,
  features = EXCLUDED.features,
  is_active = true;
