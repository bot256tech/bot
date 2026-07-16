-- =====================================================
-- AGRICHAIN 360™ — Ecosystem Expansion Schema
-- Migration: 003_ecosystem.sql
-- Adds: Village Agents, GPS Gardens, Crop Lifecycle,
--       Disease Detection, Input Marketplace, Logistics,
--       Cooperatives, Credit Profiles, Community,
--       Traceability, Badges, Warehouse Receipts
-- =====================================================

-- ═══════════════════════════════════════════════════════
-- 1. VILLAGE AGENT NETWORK
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS village_agents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    agent_code VARCHAR(20) UNIQUE NOT NULL,
    territory VARCHAR(100),
    sub_county VARCHAR(100),
    parish VARCHAR(100),
    village VARCHAR(100),
    farmers_registered INTEGER DEFAULT 0,
    total_collections DECIMAL(12,2) DEFAULT 0,
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    total_commission DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════
-- 2. FARM GARDENS (GPS-Mapped Plots)
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS farm_gardens (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
    agent_id INTEGER REFERENCES village_agents(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    gps_boundary JSONB,
    area_hectares DECIMAL(10,4),
    area_acres DECIMAL(10,4),
    soil_type VARCHAR(50),
    elevation_meters DECIMAL(8,2),
    slope_degrees DECIMAL(5,2),
    water_source VARCHAR(50),
    satellite_ndvi DECIMAL(5,3),
    rainfall_history JSONB,
    last_crop VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gardens_farmer ON farm_gardens(farmer_id);
CREATE INDEX IF NOT EXISTS idx_gardens_agent ON farm_gardens(agent_id);

-- ═══════════════════════════════════════════════════════
-- 3. CROP LIFECYCLE (Seed → Consumer)
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS crop_lifecycle (
    id SERIAL PRIMARY KEY,
    garden_id INTEGER REFERENCES farm_gardens(id) ON DELETE CASCADE,
    farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
    crop VARCHAR(50) NOT NULL,
    variety VARCHAR(50),
    batch_id VARCHAR(50),
    seed_source VARCHAR(100),
    seed_supplier VARCHAR(100),
    seed_certified BOOLEAN DEFAULT FALSE,
    planting_date DATE,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    planted_area_hectares DECIMAL(10,4),
    seed_quantity_kg DECIMAL(10,2),
    fertilizer_type VARCHAR(100),
    fertilizer_quantity_kg DECIMAL(10,2),
    pesticide_type VARCHAR(100),
    expected_yield_kg DECIMAL(12,2),
    actual_yield_kg DECIMAL(12,2),
    current_stage VARCHAR(30) DEFAULT 'PLANTING'
        CHECK (current_stage IN ('SEED_PURCHASE', 'LAND_PREPARATION', 'PLANTING',
            'GERMINATION', 'VEGETATIVE', 'FLOWERING', 'FRUITING',
            'MATURITY', 'HARVEST', 'DRYING', 'STORAGE',
            'TRANSPORT', 'MARKETPLACE', 'SOLD', 'EXPORTED')),
    estimated_revenue DECIMAL(12,2),
    actual_revenue DECIMAL(12,2),
    total_cost DECIMAL(12,2),
    profit DECIMAL(12,2),
    traceability_hash VARCHAR(64),
    status VARCHAR(20) DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'COMPLETED', 'ABANDONED', 'LOST')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_farmer ON crop_lifecycle(farmer_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_garden ON crop_lifecycle(garden_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_stage ON crop_lifecycle(current_stage);
CREATE INDEX IF NOT EXISTS idx_lifecycle_batch ON crop_lifecycle(batch_id);

-- ═══════════════════════════════════════════════════════
-- 4. FARM ACTIVITIES (Every event recorded)
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS farm_activities (
    id SERIAL PRIMARY KEY,
    lifecycle_id INTEGER REFERENCES crop_lifecycle(id) ON DELETE CASCADE,
    farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
    agent_id INTEGER REFERENCES village_agents(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL
        CHECK (activity_type IN ('LAND_PREP', 'PLANTING', 'WEEDING', 'FERTILIZER',
            'PESTICIDE', 'IRRIGATION', 'PRUNING', 'MONITORING',
            'DISEASE_TREATMENT', 'HARVEST', 'DRYING', 'STORAGE',
            'TRANSPORT', 'INSPECTION', 'SALE', 'EXTENSION_VISIT',
            'TRAINING', 'PHOTO_UPLOAD', 'SOIL_TEST', 'OTHER')),
    description TEXT,
    date_performed DATE DEFAULT CURRENT_DATE,
    input_used VARCHAR(200),
    input_quantity DECIMAL(10,2),
    cost DECIMAL(12,2),
    gps_lat DECIMAL(10,8),
    gps_lng DECIMAL(11,8),
    photo_urls TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activities_lifecycle ON farm_activities(lifecycle_id);
CREATE INDEX IF NOT EXISTS idx_activities_farmer ON farm_activities(farmer_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON farm_activities(activity_type);

-- ═══════════════════════════════════════════════════════
-- 5. DISEASE & PEST REPORTS
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS disease_reports (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
    lifecycle_id INTEGER REFERENCES crop_lifecycle(id) ON DELETE SET NULL,
    crop VARCHAR(50) NOT NULL,
    photo_urls TEXT[],
    ai_diagnosis VARCHAR(200),
    ai_confidence DECIMAL(5,2),
    disease_name VARCHAR(200),
    pest_name VARCHAR(200),
    severity VARCHAR(20) CHECK (severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    treatment_suggested TEXT,
    agrochemicals_recommended TEXT[],
    preventive_practices TEXT,
    estimated_loss_ugx DECIMAL(12,2),
    gps_lat DECIMAL(10,8),
    gps_lng DECIMAL(11,8),
    district VARCHAR(50),
    is_confirmed BOOLEAN DEFAULT FALSE,
    confirmed_by VARCHAR(50),
    outbreak_alert BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_disease_farmer ON disease_reports(farmer_id);
CREATE INDEX IF NOT EXISTS idx_disease_crop ON disease_reports(crop);
CREATE INDEX IF NOT EXISTS idx_disease_severity ON disease_reports(severity);
CREATE INDEX IF NOT EXISTS idx_disease_outbreak ON disease_reports(outbreak_alert);

-- ═══════════════════════════════════════════════════════
-- 6. VERIFIED AGRO-INPUT MARKETPLACE
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS input_dealers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(200) NOT NULL,
    license_number VARCHAR(100),
    government_approved BOOLEAN DEFAULT FALSE,
    location VARCHAR(100),
    gps_lat DECIMAL(10,8),
    gps_lng DECIMAL(11,8),
    verified BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS input_products (
    id SERIAL PRIMARY KEY,
    dealer_id INTEGER REFERENCES input_dealers(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL
        CHECK (category IN ('SEED', 'FERTILIZER', 'PESTICIDE', 'HERBICIDE',
            'FUNGICIDE', 'TOOL', 'EQUIPMENT', 'IRRIGATION', 'OTHER')),
    manufacturer VARCHAR(200),
    batch_number VARCHAR(100),
    expiry_date DATE,
    certification_number VARCHAR(100),
    government_approval VARCHAR(100),
    price DECIMAL(12,2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'kg',
    quantity_available DECIMAL(12,2),
    recommended_crops TEXT[],
    usage_instructions TEXT,
    application_rate VARCHAR(100),
    qr_verification_code VARCHAR(50) UNIQUE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    photo_urls TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inputs_dealer ON input_products(dealer_id);
CREATE INDEX IF NOT EXISTS idx_inputs_category ON input_products(category);
CREATE INDEX IF NOT EXISTS idx_inputs_verified ON input_products(is_verified);
CREATE INDEX IF NOT EXISTS idx_inputs_qr ON input_products(qr_verification_code);

-- ═══════════════════════════════════════════════════════
-- 7. LOGISTICS PLATFORM (Uber for Agriculture)
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS transport_providers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(200),
    vehicle_type VARCHAR(30) NOT NULL
        CHECK (vehicle_type IN ('MOTORCYCLE', 'PICKUP', 'TRUCK_SMALL', 'TRUCK_LARGE',
            'TRAILER', 'TRACTOR', 'REFRIGERATED', 'BOAT')),
    capacity_kg DECIMAL(12,2),
    plate_number VARCHAR(20),
    gps_lat DECIMAL(10,8),
    gps_lng DECIMAL(11,8),
    available BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2) DEFAULT 0,
    total_trips INTEGER DEFAULT 0,
    price_per_km DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transport_requests (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER REFERENCES users(id),
    pickup_location VARCHAR(200) NOT NULL,
    pickup_lat DECIMAL(10,8),
    pickup_lng DECIMAL(11,8),
    delivery_location VARCHAR(200) NOT NULL,
    delivery_lat DECIMAL(10,8),
    delivery_lng DECIMAL(11,8),
    cargo_type VARCHAR(50),
    cargo_weight_kg DECIMAL(12,2),
    cargo_description TEXT,
    preferred_vehicle VARCHAR(30),
    estimated_distance_km DECIMAL(10,2),
    estimated_fuel_cost DECIMAL(12,2),
    budget DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'OPEN'
        CHECK (status IN ('OPEN', 'BIDDING', 'ASSIGNED', 'IN_TRANSIT',
            'DELIVERED', 'CANCELLED', 'DISPUTED')),
    assigned_provider_id INTEGER REFERENCES transport_providers(id),
    pickup_time TIMESTAMP WITH TIME ZONE,
    delivery_time TIMESTAMP WITH TIME ZONE,
    actual_cost DECIMAL(12,2),
    proof_of_delivery_url TEXT,
    tracking_id VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transport_bids (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES transport_requests(id) ON DELETE CASCADE,
    provider_id INTEGER REFERENCES transport_providers(id) ON DELETE CASCADE,
    bid_amount DECIMAL(12,2) NOT NULL,
    estimated_hours DECIMAL(5,1),
    message TEXT,
    accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transport_status ON transport_requests(status);
CREATE INDEX IF NOT EXISTS idx_transport_tracking ON transport_requests(tracking_id);

-- ═══════════════════════════════════════════════════════
-- 8. WAREHOUSE RECEIPTS & MANAGEMENT
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS warehouse_receipts (
    id SERIAL PRIMARY KEY,
    warehouse_partner_id INTEGER REFERENCES partners(id),
    farmer_id INTEGER REFERENCES farmers(id),
    lifecycle_id INTEGER REFERENCES crop_lifecycle(id) ON DELETE SET NULL,
    crop VARCHAR(50) NOT NULL,
    quantity_kg DECIMAL(12,2) NOT NULL,
    moisture_level DECIMAL(5,2),
    quality_grade VARCHAR(20),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100),
    qr_code TEXT,
    storage_location VARCHAR(100),
    date_received DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    storage_fee_per_day DECIMAL(10,2),
    is_withdrawn BOOLEAN DEFAULT FALSE,
    withdrawn_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_warehouse_farmer ON warehouse_receipts(farmer_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_receipt ON warehouse_receipts(receipt_number);

-- ═══════════════════════════════════════════════════════
-- 9. COOPERATIVES
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cooperatives (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    registration_number VARCHAR(100),
    district VARCHAR(50),
    leader_user_id INTEGER REFERENCES users(id),
    member_count INTEGER DEFAULT 0,
    total_savings DECIMAL(15,2) DEFAULT 0,
    total_loans_issued DECIMAL(15,2) DEFAULT 0,
    total_produce_sold_kg DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cooperative_members (
    id SERIAL PRIMARY KEY,
    cooperative_id INTEGER REFERENCES cooperatives(id) ON DELETE CASCADE,
    farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
    role VARCHAR(30) DEFAULT 'MEMBER'
        CHECK (role IN ('CHAIRMAN', 'SECRETARY', 'TREASURER', 'MEMBER')),
    savings_balance DECIMAL(12,2) DEFAULT 0,
    loan_balance DECIMAL(12,2) DEFAULT 0,
    shares_owned INTEGER DEFAULT 1,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cooperative_id, farmer_id)
);

CREATE INDEX IF NOT EXISTS idx_coop_members_coop ON cooperative_members(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_coop_members_farmer ON cooperative_members(farmer_id);

-- ═══════════════════════════════════════════════════════
-- 10. DIGITAL CREDIT PROFILES
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS credit_profiles (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE UNIQUE,
    yield_score DECIMAL(5,2) DEFAULT 0,
    sales_score DECIMAL(5,2) DEFAULT 0,
    repayment_score DECIMAL(5,2) DEFAULT 0,
    farm_size_score DECIMAL(5,2) DEFAULT 0,
    productivity_score DECIMAL(5,2) DEFAULT 0,
    overall_credit_score DECIMAL(5,2) DEFAULT 0,
    risk_level VARCHAR(20) DEFAULT 'UNASSESSED'
        CHECK (risk_level IN ('UNASSESSED', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH')),
    max_loan_eligible DECIMAL(12,2) DEFAULT 0,
    total_loans_taken INTEGER DEFAULT 0,
    total_loans_repaid INTEGER DEFAULT 0,
    total_amount_borrowed DECIMAL(15,2) DEFAULT 0,
    total_amount_repaid DECIMAL(15,2) DEFAULT 0,
    default_count INTEGER DEFAULT 0,
    last_scored_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loan_requests (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
    credit_profile_id INTEGER REFERENCES credit_profiles(id),
    amount_requested DECIMAL(12,2) NOT NULL,
    purpose VARCHAR(100),
    status VARCHAR(20) DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'DISBURSED', 'REPAYING',
            'COMPLETED', 'DEFAULTED', 'REJECTED')),
    approved_amount DECIMAL(12,2),
    interest_rate DECIMAL(5,2),
    repayment_months INTEGER,
    institution_name VARCHAR(200),
    disbursed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_farmer ON credit_profiles(farmer_id);
CREATE INDEX IF NOT EXISTS idx_loans_farmer ON loan_requests(farmer_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loan_requests(status);

-- ═══════════════════════════════════════════════════════
-- 11. COMMUNITY & GAMIFICATION
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS community_posts (
    id SERIAL PRIMARY KEY,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(30) NOT NULL
        CHECK (category IN ('QUESTION', 'DISCUSSION', 'SUCCESS_STORY', 'TIP',
            'EVENT', 'ALERT', 'TRAINING', 'MARKET_UPDATE')),
    title VARCHAR(200),
    content TEXT NOT NULL,
    photo_urls TEXT[],
    voice_note_url TEXT,
    language VARCHAR(20) DEFAULT 'en',
    upvotes INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS community_replies (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    voice_note_url TEXT,
    is_expert BOOLEAN DEFAULT FALSE,
    upvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    badge_type VARCHAR(50) NOT NULL,
    badge_name VARCHAR(100) NOT NULL,
    badge_icon VARCHAR(10),
    description TEXT,
    points_earned INTEGER DEFAULT 0,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gamification_points (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    points INTEGER NOT NULL,
    description VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posts_category ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id);
CREATE INDEX IF NOT EXISTS idx_points_user ON gamification_points(user_id);

-- ═══════════════════════════════════════════════════════
-- 12. BLOCKCHAIN TRACEABILITY
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS traceability_records (
    id SERIAL PRIMARY KEY,
    batch_id VARCHAR(50) NOT NULL,
    lifecycle_id INTEGER REFERENCES crop_lifecycle(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL
        CHECK (event_type IN ('SEED_PURCHASED', 'PLANTED', 'INPUT_APPLIED',
            'MONITORED', 'HARVESTED', 'DRIED', 'TESTED', 'STORED',
            'TRANSPORTED', 'LISTED', 'SOLD', 'EXPORTED', 'DELIVERED')),
    event_data JSONB NOT NULL,
    actor_id INTEGER REFERENCES users(id),
    actor_role VARCHAR(30),
    gps_lat DECIMAL(10,8),
    gps_lng DECIMAL(11,8),
    previous_hash VARCHAR(64),
    record_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trace_batch ON traceability_records(batch_id);
CREATE INDEX IF NOT EXISTS idx_trace_event ON traceability_records(event_type);
CREATE INDEX IF NOT EXISTS idx_trace_hash ON traceability_records(record_hash);

-- ═══════════════════════════════════════════════════════
-- 13. EXTENSION SERVICES & TRAINING
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS extension_visits (
    id SERIAL PRIMARY KEY,
    officer_id INTEGER REFERENCES users(id),
    farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
    agent_id INTEGER REFERENCES village_agents(id) ON DELETE SET NULL,
    visit_type VARCHAR(50),
    advice_given TEXT,
    photos TEXT[],
    gps_lat DECIMAL(10,8),
    gps_lng DECIMAL(11,8),
    visit_date DATE DEFAULT CURRENT_DATE,
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    language VARCHAR(20) DEFAULT 'en',
    video_url TEXT,
    content TEXT,
    quiz_questions JSONB,
    certificate_available BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_enrollments (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES training_courses(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    progress_percent DECIMAL(5,2) DEFAULT 0,
    quiz_score DECIMAL(5,2),
    completed BOOLEAN DEFAULT FALSE,
    certificate_url TEXT,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(course_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_extension_farmer ON extension_visits(farmer_id);
CREATE INDEX IF NOT EXISTS idx_training_category ON training_courses(category);
CREATE INDEX IF NOT EXISTS idx_enrollment_user ON training_enrollments(user_id);
