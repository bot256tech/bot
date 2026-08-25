/**
 * AGRICHAIN 360 — Farmer-Friendly Rate Limiting
 *
 * Design principle: rural farmers will fat-finger phone numbers,
 * forget passwords, and retry. The system must be forgiving on the
 * first attempts and only escalate when it looks like an attack.
 *
 * Progressive login backoff:
 *   Attempts 1–5  → allowed
 *   Attempt 6+    → wait 1 minute
 *   Attempt 11+   → wait 2 minutes
 *   Attempt 16+   → wait 10 minutes
 *   Attempt 21+   → wait 1 hour
 *
 * Signup: generous (15 per 10 minutes) — farmers make typos, that's normal.
 */

const rateLimit = require('express-rate-limit');

// ─────────────────────────────────────────────────────
// PROGRESSIVE LOGIN LIMITER (custom implementation)
// Tracks per-IP+phone; escalates the wait period.
// ─────────────────────────────────────────────────────
const loginAttempts = new Map(); // key: ip+phone → { count, lockedUntil }

const LOCKOUT_SCHEDULE = [
  { afterAttempt: 5,  duration: 60 * 1000,     label: '1 minute' },
  { afterAttempt: 10, duration: 2 * 60 * 1000,  label: '2 minutes' },
  { afterAttempt: 15, duration: 10 * 60 * 1000, label: '10 minutes' },
  { afterAttempt: 20, duration: 60 * 60 * 1000, label: '1 hour' },
];

function getLockout(count) {
  let lock = null;
  for (const rule of LOCKOUT_SCHEDULE) {
    if (count >= rule.afterAttempt) lock = rule;
  }
  return lock;
}

function progressiveLoginLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const phone = (req.body && req.body.phone) || 'unknown';
  const key = `${ip}:${phone}`;
  const now = Date.now();

  const record = loginAttempts.get(key) || { count: 0, lockedUntil: 0 };

  // Clear expired locks
  if (record.lockedUntil > 0 && now >= record.lockedUntil) {
    record.lockedUntil = 0;
    // Reset count to the threshold (so next failure re-locks at same level)
    record.count = LOCKOUT_SCHEDULE[0].afterAttempt - 1;
  }

  // Check if currently locked
  if (record.lockedUntil > now) {
    const remaining = Math.ceil((record.lockedUntil - now) / 1000);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const waitLabel = mins > 0 ? `${mins} minute${mins > 1 ? 's' : ''}` : `${secs} second${secs > 1 ? 's' : ''}`;
    return res.status(429).json({
      success: false,
      message: `Too many attempts. Please wait ${waitLabel} and try again.`
    });
  }

  // Store the request for the login handler to increment on failure
  req._loginAttemptKey = key;
  req._loginAttemptRecord = record;
  next();
}

// Call this from the login handler on FAILURE
function recordLoginFailure(key, record) {
  record.count++;
  const lock = getLockout(record.count);
  if (lock) {
    record.lockedUntil = Date.now() + lock.duration;
  }
  loginAttempts.set(key, record);
}

// Call this from the login handler on SUCCESS
function clearLoginAttempts(key) {
  loginAttempts.delete(key);
}

// Periodic cleanup (every 10 minutes, remove stale entries)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of loginAttempts) {
    if (record.lockedUntil > 0 && now - record.lockedUntil > 60 * 60 * 1000) {
      loginAttempts.delete(key);
    } else if (record.lockedUntil === 0 && now - (record.lastSeen || 0) > 30 * 60 * 1000) {
      loginAttempts.delete(key);
    }
  }
}, 10 * 60 * 1000);

// ─────────────────────────────────────────────────────
// SIGNUP LIMITER — generous for farmers
// ─────────────────────────────────────────────────────
const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // 15 sign-up attempts per 10 min (farmers make typos)
  message: {
    success: false,
    message: 'Too many sign-up attempts. Please wait a few minutes and try again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ─────────────────────────────────────────────────────
// STANDARD API LIMITER (generous — protects the server, not the user)
// ─────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ─────────────────────────────────────────────────────
// PAYMENT LIMITER (stricter — financial actions)
// ─────────────────────────────────────────────────────
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many payment attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = progressiveLoginLimiter; // replaced with progressive

module.exports = {
  apiLimiter,
  authLimiter,
  registerLimiter,
  paymentLimiter,
  progressiveLoginLimiter,
  recordLoginFailure,
  clearLoginAttempts
};
