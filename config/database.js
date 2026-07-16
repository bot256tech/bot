const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

let pool = null;
let isConnected = false;

function getPool() {
  if (pool) return pool;

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

  if (process.env.NODE_ENV === 'production') {
    poolConfig.ssl = { rejectUnauthorized: false };
  }

  pool = new Pool({
    ...poolConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('❌ PostgreSQL idle client error:', err.message);
    isConnected = false;
  });

  pool.on('connect', () => {
    isConnected = true;
    console.log('✅ PostgreSQL connected');
  });

  return pool;
}

function query(text, params) {
  return getPool().query(text, params);
}

async function testConnection() {
  try {
    const p = getPool();
    await p.query('SELECT 1');
    isConnected = true;
    console.log('✅ Database connection verified');
    return true;
  } catch (err) {
    isConnected = false;
    console.error('❌ Database connection failed:', err.message);
    console.warn('⚠️  Server will start WITHOUT database. API endpoints requiring DB will return 503.');
    return false;
  }
}

module.exports = {
  getPool,
  query,
  testConnection,
  get isConnected() { return isConnected; }
};
