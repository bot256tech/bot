-- =====================================================
-- AGRICHAIN 360™ — Audit Logs Table
-- Migration: 002_audit_logs.sql
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_role VARCHAR(30),
    ip_address VARCHAR(45),
    user_agent TEXT,
    method VARCHAR(10),
    path VARCHAR(500),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_user ON audit_logs(action, user_id);

-- Auto-cleanup: Partition by month for large-scale deployments
-- (Not needed for MVP, but plan for it)
