/**
 * AGRICHAIN 360™ — Legacy Database Connection
 * Used by older routes (routes/index.js, services/userService.js)
 * Supports both DATABASE_URL (Render) and individual DB_* vars (local dev)
 */

const { Pool } = require('pg');

const poolConfig = {};

if (process.env.DATABASE_URL) {
  // Render and production: use connection string
  poolConfig.connectionString = process.env.DATABASE_URL;
  if (process.env.NODE_ENV === 'production') {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
} else {
  // Local development: use individual vars
  poolConfig.user = process.env.DB_USER || 'postgres';
  poolConfig.host = process.env.DB_HOST || 'localhost';
  poolConfig.database = process.env.DB_NAME || 'agrichain360';
  poolConfig.password = process.env.DB_PASSWORD || 'postgres';
  poolConfig.port = parseInt(process.env.DB_PORT) || 5432;
}

const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL Database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL Error:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
