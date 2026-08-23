-- ============================================================
-- AGRICHAIN 360 — Migration 004: Pilot Economics
-- Fee structures, batch tracking, record provenance columns
-- Matches services/feeCalculator.service.js and config/pilot.json
-- ============================================================

-- Fee structures (drying / testing / commission per crop, UGX)
CREATE TABLE IF NOT EXISTS fee_structures (
    id SERIAL PRIMARY KEY,
    crop_type VARCHAR(50) NOT NULL,
    fee_type VARCHAR(20) NOT NULL CHECK (fee_type IN ('DRYING', 'TESTING', 'COMMISSION')),
    rate_per_kg DECIMAL(10,2) DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fee_unique_crop_type UNIQUE (crop_type, fee_type, effective_from)
);

CREATE INDEX IF NOT EXISTS idx_fee_structures_lookup ON fee_structures (crop_type, fee_type);

-- Drying fees (UGX per kg) — Busoga pilot schedule
INSERT INTO fee_structures (crop_type, fee_type, rate_per_kg)
VALUES
    ('Maize',       'DRYING', 200),
    ('Rice',        'DRYING', 200),
    ('Soybeans',    'DRYING', 200),
    ('Beans',       'DRYING', 250),
    ('Groundnuts',  'DRYING', 350),
    ('Coffee',      'DRYING', 350),
    ('Cocoa',       'DRYING', 500),
    ('Cassava',     'DRYING', 200),
    ('Banana',      'DRYING', 150)
ON CONFLICT (crop_type, fee_type, effective_from) DO NOTHING;

-- Testing fees (UGX per kg)
INSERT INTO fee_structures (crop_type, fee_type, rate_per_kg)
VALUES
    ('Maize',       'TESTING', 100),
    ('Rice',        'TESTING', 120),
    ('Soybeans',    'TESTING', 120),
    ('Beans',       'TESTING', 150),
    ('Groundnuts',  'TESTING', 200),
    ('Coffee',      'TESTING', 250),
    ('Cocoa',       'TESTING', 400),
    ('Cassava',     'TESTING', 100),
    ('Banana',      'TESTING', 100)
ON CONFLICT (crop_type, fee_type, effective_from) DO NOTHING;

-- Marketplace commission (percentage of transaction value)
INSERT INTO fee_structures (crop_type, fee_type, percentage)
VALUES
    ('Maize',       'COMMISSION', 3),
    ('Rice',        'COMMISSION', 3),
    ('Soybeans',    'COMMISSION', 3),
    ('Beans',       'COMMISSION', 3),
    ('Groundnuts',  'COMMISSION', 3),
    ('Coffee',      'COMMISSION', 3),
    ('Cocoa',       'COMMISSION', 3),
    ('Cassava',     'COMMISSION', 3),
    ('Banana',      'COMMISSION', 3)
ON CONFLICT (crop_type, fee_type, effective_from) DO NOTHING;

-- Batch tracking (post-harvest lifecycle per batch)
CREATE TABLE IF NOT EXISTS batches (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    crop_type VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'kg',
    status VARCHAR(30) DEFAULT 'REGISTERED'
        CHECK (status IN ('REGISTERED', 'DRYING', 'TESTING', 'CERTIFIED', 'LISTED', 'SOLD', 'REJECTED')),
    drying_center VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_batches_farmer ON batches (farmer_id);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches (status);

-- Record provenance: distinguish demonstration data from user-entered data
ALTER TABLE products ADD COLUMN IF NOT EXISTS record_source VARCHAR(20) DEFAULT 'user';
ALTER TABLE quality_passports ADD COLUMN IF NOT EXISTS record_source VARCHAR(20) DEFAULT 'user';
ALTER TABLE quality_passports ADD COLUMN IF NOT EXISTS drying_center VARCHAR(100);
ALTER TABLE quality_passports ADD COLUMN IF NOT EXISTS blockchain_hash TEXT;
