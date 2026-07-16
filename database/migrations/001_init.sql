-- =====================================================
-- AGRICHAIN 360™ — Full Production Schema
-- Migration: 001_init.sql
-- Covers: Users, Farmers, Partners, Products,
--         Quality Passports, Bookings, Sessions
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUM TYPES
-- =====================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('FARMER', 'BUYER', 'PARTNER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE partner_type AS ENUM ('DRYER', 'LAB', 'TRANSPORTER', 'WAREHOUSE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE quality_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- USERS TABLE (Core Authentication)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash TEXT,
    role VARCHAR(30) NOT NULL DEFAULT 'FARMER'
        CHECK (role IN ('FARMER', 'BUYER', 'PARTNER', 'ADMIN',
                        'farmer', 'buyer', 'field_officer',
                        'quality_officer', 'lab', 'admin')),
    status VARCHAR(20) DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING')),
    district VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SESSIONS TABLE (for express-session with PostgreSQL)
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions (expire);

-- =====================================================
-- FARMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS farmers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    district VARCHAR(50),
    village VARCHAR(100),
    subcounty VARCHAR(100),
    crops TEXT[],
    farm_size DECIMAL(10,2),
    national_id VARCHAR(30),
    gps_lat DECIMAL(10,8),
    gps_lng DECIMAL(11,8),
    verification_status VARCHAR(20) DEFAULT 'PENDING'
        CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PARTNERS TABLE (Dryers, Labs, Transporters, Warehouses)
-- =====================================================
CREATE TABLE IF NOT EXISTS partners (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    partner_type VARCHAR(30) NOT NULL
        CHECK (partner_type IN ('DRYER', 'LAB', 'TRANSPORTER', 'WAREHOUSE')),
    business_name VARCHAR(150) NOT NULL,
    location VARCHAR(100),
    services TEXT[],
    pricing JSONB,
    approved BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PRODUCTS TABLE (Marketplace Listings)
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
    crop VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'kg',
    price_per_unit DECIMAL(12,2) NOT NULL,
    quality_status VARCHAR(20) DEFAULT 'PENDING'
        CHECK (quality_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- QUALITY PASSPORTS TABLE (Core Revenue Asset)
-- =====================================================
CREATE TABLE IF NOT EXISTS quality_passports (
    id SERIAL PRIMARY KEY,
    batch_number VARCHAR(50) UNIQUE NOT NULL,
    farmer_id INTEGER REFERENCES farmers(id) ON DELETE SET NULL,
    crop_type VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    moisture_level DECIMAL(5,2),
    aflatoxin_result DECIMAL(6,2),
    quality_grade VARCHAR(20),
    testing_partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL,
    qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- BOOKINGS TABLE (Partnership Marketplace)
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
    partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
    scheduled_date DATE,
    amount DECIMAL(12,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ORDERS TABLE (Marketplace Transactions)
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    batch_id INTEGER,
    quantity DECIMAL(10,2),
    total_amount DECIMAL(12,2) NOT NULL,
    commission DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_farmers_user_id ON farmers(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_type ON partners(partner_type);
CREATE INDEX IF NOT EXISTS idx_partners_approved ON partners(approved);
CREATE INDEX IF NOT EXISTS idx_products_farmer ON products(farmer_id);
CREATE INDEX IF NOT EXISTS idx_products_crop ON products(crop);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(available);
CREATE INDEX IF NOT EXISTS idx_quality_passports_batch ON quality_passports(batch_number);
CREATE INDEX IF NOT EXISTS idx_quality_passports_farmer ON quality_passports(farmer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_farmer ON bookings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_partner ON bookings(partner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- =====================================================
-- AUTO-UPDATE TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED: Default admin user (password: admin123)
-- =====================================================
INSERT INTO users (name, phone, email, password_hash, role, status)
VALUES (
    'System Admin',
    '+256700000000',
    'admin@agrichain360.com',
    '$2a$10$rK5R3gQ7sP6xL9y0wJmKYdOWKz3n7WzR3gQ7sP6xL9y0wJmKYdOWe',
    'ADMIN',
    'ACTIVE'
) ON CONFLICT (phone) DO NOTHING;
