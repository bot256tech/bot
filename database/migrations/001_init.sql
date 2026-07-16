-- =====================================================
-- AGRICHAIN 360™ — Full Production Schema
-- Migration: 001_init.sql
-- Covers: Users, Farmers, Partners, Products,
--         Quality Passports, Bookings, Payments,
--         Subscriptions, Buyer Profiles, Orders
-- =====================================================

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
-- USERS TABLE
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
-- SESSIONS TABLE (express-session with PostgreSQL)
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
-- Now includes payment_status for tracking payment state
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
    partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
    payment_status VARCHAR(20) DEFAULT 'UNPAID'
        CHECK (payment_status IN ('UNPAID', 'PARTIAL', 'PAID', 'REFUNDED')),
    scheduled_date DATE,
    amount DECIMAL(12,2),
    commission DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PAYMENTS TABLE (Revenue Engine)
-- Tracks all monetary transactions on the platform
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    commission DECIMAL(12,2) DEFAULT 0,
    partner_payout DECIMAL(12,2) DEFAULT 0,
    method VARCHAR(30) NOT NULL
        CHECK (method IN ('MOBILE_MONEY', 'BANK_TRANSFER', 'CASH', 'CARD')),
    provider VARCHAR(50),
    transaction_id VARCHAR(100),
    reference VARCHAR(100),
    status VARCHAR(20) DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    description TEXT,
    metadata JSONB,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SUBSCRIPTION PLANS TABLE
-- Defines the tiers available for enterprise buyers
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
        CHECK (name IN ('STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'FREE_TRIAL')),
    display_name VARCHAR(100) NOT NULL,
    monthly_price DECIMAL(12,2) NOT NULL,
    annual_price DECIMAL(12,2),
    currency VARCHAR(10) DEFAULT 'UGX',
    max_users INTEGER DEFAULT 1,
    max_suppliers_viewable INTEGER DEFAULT 50,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- BUYER PROFILES TABLE
-- Extended profiles for enterprise buyers
-- =====================================================
CREATE TABLE IF NOT EXISTS buyer_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(200) NOT NULL,
    business_type VARCHAR(50)
        CHECK (business_type IN ('EXPORTER', 'PROCESSOR', 'TRADER', 'NGO',
                                  'COOPERATIVE', 'GOVERNMENT', 'MANUFACTURER', 'OTHER')),
    registration_number VARCHAR(100),
    tin_number VARCHAR(50),
    address TEXT,
    city VARCHAR(50),
    country VARCHAR(50) DEFAULT 'Uganda',
    website VARCHAR(200),
    procurement_crops TEXT[],
    annual_volume_tonnes DECIMAL(12,2),
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- BUYER SUBSCRIPTIONS TABLE
-- Tracks active subscriptions for buyer accounts
-- =====================================================
CREATE TABLE IF NOT EXISTS buyer_subscriptions (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER REFERENCES buyer_profiles(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES subscription_plans(id),
    status VARCHAR(20) DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED')),
    billing_cycle VARCHAR(20) DEFAULT 'MONTHLY'
        CHECK (billing_cycle IN ('MONTHLY', 'ANNUAL')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    auto_renew BOOLEAN DEFAULT TRUE,
    amount_paid DECIMAL(12,2),
    payment_id INTEGER REFERENCES payments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ORDERS TABLE (Marketplace Transactions)
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    quantity DECIMAL(10,2),
    total_amount DECIMAL(12,2) NOT NULL,
    commission DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    payment_id INTEGER REFERENCES payments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_farmers_user_id ON farmers(user_id);
CREATE INDEX IF NOT EXISTS idx_farmers_district ON farmers(district);
CREATE INDEX IF NOT EXISTS idx_farmers_verification ON farmers(verification_status);
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_type ON partners(partner_type);
CREATE INDEX IF NOT EXISTS idx_partners_approved ON partners(approved);
CREATE INDEX IF NOT EXISTS idx_partners_location ON partners(location);
CREATE INDEX IF NOT EXISTS idx_products_farmer ON products(farmer_id);
CREATE INDEX IF NOT EXISTS idx_products_crop ON products(crop);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(available);
CREATE INDEX IF NOT EXISTS idx_products_quality ON products(quality_status);
CREATE INDEX IF NOT EXISTS idx_quality_passports_batch ON quality_passports(batch_number);
CREATE INDEX IF NOT EXISTS idx_quality_passports_farmer ON quality_passports(farmer_id);
CREATE INDEX IF NOT EXISTS idx_quality_passports_grade ON quality_passports(quality_grade);
CREATE INDEX IF NOT EXISTS idx_bookings_farmer ON bookings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_partner ON bookings(partner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_user ON buyer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_business ON buyer_profiles(business_type);
CREATE INDEX IF NOT EXISTS idx_buyer_subs_buyer ON buyer_subscriptions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_subs_status ON buyer_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

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
-- SEED: Subscription Plans
-- =====================================================
INSERT INTO subscription_plans (name, display_name, monthly_price, annual_price, currency, max_users, max_suppliers_viewable, features)
VALUES
    ('FREE_TRIAL', 'Free Trial', 0, 0, 'UGX', 1, 10,
     '["Search farmers (limited)", "View produce listings", "Basic market prices"]'::jsonb),
    ('STARTER', 'Starter', 250000, 2500000, 'UGX', 2, 50,
     '["Search all farmers", "View produce & quality data", "Contact suppliers", "Basic reports", "Market price alerts"]'::jsonb),
    ('PROFESSIONAL', 'Professional', 750000, 7500000, 'UGX', 5, 500,
     '["Everything in Starter", "Procurement tools", "Quality reports & certificates", "Supplier management", "Batch tracking", "Analytics dashboard", "Priority support"]'::jsonb),
    ('ENTERPRISE', 'Enterprise', 2000000, 20000000, 'UGX', 20, 99999,
     '["Everything in Professional", "API access", "Multi-user accounts", "Compliance reports", "Custom workflows", "Dedicated account manager", "White-label options", "Unlimited suppliers"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- SEED: Default Admin (password: admin123)
-- =====================================================
INSERT INTO users (name, phone, email, password_hash, role, status)
VALUES (
    'System Admin',
    '+256700000000',
    'admin@agrichain360.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'ADMIN',
    'ACTIVE'
) ON CONFLICT (phone) DO NOTHING;
