/**
 * AGRICHAIN 360™ — Database Migration Runner
 * Run: node database/migrate.js
 * 
 * Reads and executes all .sql files in database/migrations/ in order
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('./connection');

async function runMigrations() {
  console.log('🔄 Starting database migrations...\n');

  const migrationsDir = path.join(__dirname, 'migrations');

  // Ensure migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    console.log('📁 No migrations directory found. Nothing to run.');
    process.exit(0);
  }

  // Get all .sql files sorted by name
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('📭 No migration files found.');
    process.exit(0);
  }

  console.log(`📋 Found ${files.length} migration file(s):\n`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`  ▶ Running: ${file}`);

    try {
      await pool.query(sql);
      console.log(`  ✅ Success: ${file}\n`);
    } catch (error) {
      console.error(`  ❌ Failed: ${file}`);
      console.error(`     Error: ${error.message}\n`);
      process.exit(1);
    }
  }

  console.log('🎉 All migrations completed successfully!\n');
  process.exit(0);
}

runMigrations().catch(err => {
  console.error('❌ Migration runner failed:', err);
  process.exit(1);
});
