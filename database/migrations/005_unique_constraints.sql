-- ============================================================
-- AGRICHAIN 360 — Migration 005: Relational integrity
-- Unique constraints for natural identifiers and 1:1 profiles
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_key') THEN
    ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'farmers_user_id_key') THEN
    ALTER TABLE farmers ADD CONSTRAINT farmers_user_id_key UNIQUE (user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'partners_user_id_key') THEN
    ALTER TABLE partners ADD CONSTRAINT partners_user_id_key UNIQUE (user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'buyer_profiles_user_id_key') THEN
    ALTER TABLE buyer_profiles ADD CONSTRAINT buyer_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;
