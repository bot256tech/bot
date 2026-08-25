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
INSERT INTO subscription_plans (name, description, monthly_price_ugx, features, is_active, created_at)
VALUES
  ('Basic Access', 'Full marketplace access, farmer contact info, basic quality metrics', 150000,
   '["marketplace_full","farmer_contacts","basic_quality_metrics"]'::jsonb, true, NOW()),
  ('Premium Access', 'All Basic + downloadable UNBS certificates, batch provenance, direct ordering', 350000,
   '["marketplace_full","farmer_contacts","basic_quality_metrics","download_certificates","batch_provenance","direct_ordering"]'::jsonb, true, NOW()),
  ('Investor / NGO Tier', 'All Premium + regional supply chain analytics across Busoga', 500000,
   '["marketplace_full","farmer_contacts","basic_quality_metrics","download_certificates","batch_provenance","direct_ordering","regional_analytics"]'::jsonb, true, NOW())
ON CONFLICT (name) DO UPDATE SET
  monthly_price_ugx = EXCLUDED.monthly_price_ugx,
  features = EXCLUDED.features,
  is_active = true;
