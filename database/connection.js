/**
 * Backward-compatible database wrapper
 * All existing models use: const db = require('../database/connection');
 * This delegates to config/database.js for the actual pool.
 */
const { getPool, query, testConnection } = require('../config/database');

module.exports = {
  query,
  get pool() { return getPool(); },
  testConnection
};
