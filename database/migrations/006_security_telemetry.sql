-- ============================================================
-- AGRICHAIN 360 — Migration 006: Security & Telemetry
-- 1. Dryer telemetry store (ESP32 ingest + anomaly flags)
-- 2. Cryptographic signatures on Digital Quality Passports
-- ============================================================

CREATE TABLE IF NOT EXISTS dryer_telemetry (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(60) NOT NULL,
    hub VARCHAR(60),
    batch_ref VARCHAR(50),
    temperature_c NUMERIC(6,2),
    humidity_pct NUMERIC(6,2),
    grain_moisture_pct NUMERIC(6,2),
    batch_kg NUMERIC(10,2),
    fan_on BOOLEAN DEFAULT false,
    anomaly_flag BOOLEAN DEFAULT false,
    anomaly_reasons TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telemetry_device_time ON dryer_telemetry (device_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_anomaly ON dryer_telemetry (anomaly_flag, received_at DESC);

-- Tamper-evident passports: HMAC-SHA256 signature over the passport record
ALTER TABLE quality_passports ADD COLUMN IF NOT EXISTS passport_signature VARCHAR(128);
