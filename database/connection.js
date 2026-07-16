const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

/**
 * PostgreSQL Connection Pool
 * 
 * Supports two configuration modes:
 * 1. DATABASE_URL (recommended for production/cloud)
 * 2. Individual DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 */
const poolConfig = {};

if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
} else {
  poolConfig.host = process.env.DB_HOST || 'localhost';
  poolConfig.port = parseInt(process.env.DB_PORT) || 5432;
  poolConfig.database = process.env.DB_NAME || 'agrichain360';
  poolConfig.user = process.env.DB_USER || 'postgres';
  poolConfig.password = process.env.DB_PASSWORD || 'postgres';
}

// Enable SSL in production
if (process.env.NODE_ENV === 'production') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
  // Don't exit the process — let the server continue serving cached/static routes
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL client connected');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
