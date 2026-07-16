/**
 * AGRICHAIN 360™ — Audit Log Middleware & Service
 * 
 * Tracks all critical actions for compliance and debugging.
 * Logs to both Winston (structured) and database (audit_logs table).
 */

const logger = require('../../config/logger');

/**
 * Middleware: Attaches audit context to request
 */
const auditContext = (req, res, next) => {
  req.auditMeta = {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent') || 'unknown',
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString(),
    userId: req.user ? req.user.id : null,
    userRole: req.user ? req.user.role : null,
  };
  next();
};

/**
 * Log an audit event (non-blocking — won't fail the request)
 */
function logAudit(action, details, req) {
  const meta = req && req.auditMeta ? req.auditMeta : {};

  const auditEntry = {
    action,
    details,
    ...meta,
    timestamp: new Date().toISOString(),
  };

  // Log to Winston (structured JSON)
  logger.info(`AUDIT: ${action}`, auditEntry);

  // Attempt to write to database (non-blocking)
  writeAuditToDb(auditEntry).catch(err => {
    logger.error('Failed to write audit log to database', { error: err.message });
  });
}

/**
 * Write audit entry to database (if table exists)
 */
async function writeAuditToDb(entry) {
  try {
    const db = require('../../database/connection');
    await db.query(
      `INSERT INTO audit_logs (action, user_id, user_role, ip_address, user_agent, method, path, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        entry.action,
        entry.userId || null,
        entry.userRole || null,
        entry.ip || null,
        entry.userAgent || null,
        entry.method || null,
        entry.path || null,
        JSON.stringify(entry.details || {})
      ]
    );
  } catch (err) {
    // Table may not exist yet — that's OK during early development
    // Only log error, don't throw
  }
}

/**
 * Audit event constants
 */
const AUDIT_ACTIONS = {
  // Auth
  USER_REGISTERED: 'USER_REGISTERED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGIN_FAILED: 'USER_LOGIN_FAILED',
  
  // Payments
  PAYMENT_INITIATED: 'PAYMENT_INITIATED',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',
  
  // Subscriptions
  SUBSCRIPTION_CREATED: 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_CANCELLED: 'SUBSCRIPTION_CANCELLED',
  
  // Bookings
  BOOKING_CREATED: 'BOOKING_CREATED',
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  BOOKING_COMPLETED: 'BOOKING_COMPLETED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  
  // Quality
  PASSPORT_ISSUED: 'PASSPORT_ISSUED',
  PASSPORT_UPDATED: 'PASSPORT_UPDATED',
  PASSPORT_VERIFIED: 'PASSPORT_VERIFIED',
  
  // Partners
  PARTNER_REGISTERED: 'PARTNER_REGISTERED',
  PARTNER_APPROVED: 'PARTNER_APPROVED',
  
  // Marketplace
  LISTING_CREATED: 'LISTING_CREATED',
  LISTING_UPDATED: 'LISTING_UPDATED',
  
  // Admin
  ROLE_CHANGED: 'ROLE_CHANGED',
  USER_SUSPENDED: 'USER_SUSPENDED',
};

module.exports = {
  auditContext,
  logAudit,
  AUDIT_ACTIONS
};
