/**
 * AGRICHAIN 360™ — CORS Configuration
 * 
 * In production: restrict to specific domains
 * In development: allow localhost
 */

const cors = require('cors');

function getCorsConfig() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:8081',  // React Native
        'https://agrichain360.com',
        'https://www.agrichain360.com',
        'https://app.agrichain360.com'
      ];

  return cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, USSD)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development, allow all localhost
      if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Request-Id'],
    maxAge: 86400 // 24 hours preflight cache
  });
}

module.exports = { getCorsConfig };
