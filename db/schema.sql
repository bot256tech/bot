-- AGRICHAIN 360 Database Schema

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('farmer', 'buyer', 'field_officer', 'quality_officer', 'lab', 'admin')),
    password_hash TEXT,
    district VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Sessions Table (for express-session with PostgreSQL)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions (expire);

-- Farmers Table
CREATE TABLE IF NOT EXISTS farmers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    national_id VARCHAR(20),
    farm_size DECIMAL(10,2),
    village VARCHAR(100),
    subcounty VARCHAR(100),
    gps_lat DECIMAL(10,8),
    gps_lng DECIMAL(11,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Batches / Listings Table
CREATE TABLE IF NOT EXISTS batches (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES farmers(id),
    crop VARCHAR(50) NOT NULL,
    quantity_kg INTEGER NOT NULL,
    price_per_kg INTEGER NOT NULL,
    moisture DECIMAL(5,2),
    aflatoxin_ppb DECIMAL(6,2),
    status VARCHAR(20) DEFAULT 'pending',
    passport_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER REFERENCES users(id),
    batch_id INTEGER REFERENCES batches(id),
    total_amount INTEGER NOT NULL,
    commission INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);