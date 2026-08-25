-- ============================================================
-- AGRICHAIN 360 — Migration 008: Database-layer hardening
--
-- 1. Only the application role (and postgres) may connect — no
--    incidental access for any other database role.
-- 2. Row-Level Security on the audit log: every authenticated actor
--    may have events WRITTEN (append-only), but only sessions that
--    identify as ADMIN may READ. Enforced by PostgreSQL itself, below
--    the application layer.
-- ============================================================

REVOKE CONNECT ON DATABASE agrichain FROM PUBLIC;
GRANT CONNECT ON DATABASE agrichain TO agrichain;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Anyone (the app, on behalf of any logged-in actor) can append events
DROP POLICY IF EXISTS audit_append ON audit_logs;
CREATE POLICY audit_append ON audit_logs
    FOR INSERT
    WITH CHECK (true);

-- Only admin-identified sessions may read the audit trail
DROP POLICY IF EXISTS audit_admin_read ON audit_logs;
CREATE POLICY audit_admin_read ON audit_logs
    FOR SELECT
    USING (current_setting('app.role', true) = 'ADMIN');

-- Updates/deletes on the audit log are denied to everyone via RLS
-- (no policy = no rows affected), making the log append-only at the DB level.

-- The application connects as the table owner; owners bypass RLS unless forced.
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
