/**
 * AGRICHAIN 360 — CORS Configuration
 *
 * Same-origin web traffic is unaffected. Explicit origins are controlled
 * with ALLOWED_ORIGINS and APP_BASE_URL (comma separated). Requests with
 * no Origin header (mobile apps, curl, USSD gateways) are always allowed.
 */

const cors = require('cors');

function buildAllowedOrigins() {
  const origins = [];
  if (process.env.ALLOWED_ORIGINS) {
    origins.push(...process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean));
  }
  if (process.env.APP_BASE_URL) {
    origins.push(process.env.APP_BASE_URL.replace(/\/$/, ''));
  }
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:8081');
  }
  return origins;
}

function getCorsConfig() {
  const allowedOrigins = buildAllowedOrigins();

  return cors({
    origin: function (origin, callback) {
      // No origin (mobile apps, curl, server-to-server) → allow
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['X-Total-Count', 'X-Request-Id'],
    maxAge: 86400
  });
}

module.exports = { getCorsConfig };
