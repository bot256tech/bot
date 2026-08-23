/**
 * AGRICHAIN 360 — Demo Seed Script
 *
 * Seeds clearly-identified demonstration data (Busoga region pilot):
 *   - Demo accounts: farmer, buyer, lab partner, admin (real bcrypt hashes)
 *   - Demo farmers, produce listings, quality passports, one sample order
 *
 * All seeded passports/products carry record_source = 'demo' so the UI can
 * label them as demonstration records. No fabricated laboratory results are
 * presented as verified real-world results.
 *
 * Idempotent: safe to run repeatedly (skips if demo markers already exist).
 * Usage: npm run seed
 */

const db = require('../database/connection');
const bcrypt = require('bcryptjs');

const DEMO_PASSWORD = 'Demo@2026';
const ADMIN_PASSWORD = 'Admin@2026';

const DEMO_FARMERS = [
  { name: 'John Mukasa',    phone: '+256700111111', district: 'Mayuge', village: 'Buwenge',  farm_size: 3.5 },
  { name: 'Grace Namutebi', phone: '+256700555555', district: 'Jinja',  village: 'Bugembe',  farm_size: 2.0 },
  { name: 'Peter Oundo',    phone: '+256700666666', district: 'Iganga', village: 'Namayingo', farm_size: 4.2 },
  { name: 'Sarah Babirye',  phone: '+256700777777', district: 'Kamuli', village: 'Budiope',  farm_size: 1.8 },
  { name: 'Moses Waiswa',   phone: '+256700888888', district: 'Bugiri', village: 'Kaliro',   farm_size: 5.0 },
  { name: 'Fatuma Nakato',  phone: '+256700999999', district: 'Mayuge', village: 'Buwenge',  farm_size: 2.7 }
];

const DEMO_PRODUCTS = [
  { farmerIdx: 0, crop: 'Maize',       qty: 2000, unit: 'kg', price: 1800, moisture: 12.4, afla: 3.2, grade: 'A' },
  { farmerIdx: 0, crop: 'Coffee',      qty: 500,  unit: 'kg', price: 12000, moisture: 11.2, afla: 2.0, grade: 'A' },
  { farmerIdx: 1, crop: 'Beans',       qty: 1500, unit: 'kg', price: 3200, moisture: 12.8, afla: 4.1, grade: 'A' },
  { farmerIdx: 1, crop: 'Groundnuts',  qty: 800,  unit: 'kg', price: 3500, moisture: 13.2, afla: 6.5, grade: 'B' },
  { farmerIdx: 2, crop: 'Maize',       qty: 3000, unit: 'kg', price: 1650, moisture: 13.5, afla: 8.0, grade: 'B' },
  { farmerIdx: 2, crop: 'Rice',        qty: 1200, unit: 'kg', price: 4500, moisture: 12.9, afla: 3.8, grade: 'A' },
  { farmerIdx: 3, crop: 'Cassava',     qty: 2500, unit: 'kg', price: 1200, moisture: 12.0, afla: null, grade: 'B' },
  { farmerIdx: 4, crop: 'Soybeans',    qty: 900,  unit: 'kg', price: 2800, moisture: 11.8, afla: 4.5, grade: 'A' },
  { farmerIdx: 4, crop: 'Coffee',      qty: 300,  unit: 'kg', price: 11000, moisture: 14.2, afla: 9.0, grade: 'B' },
  { farmerIdx: 5, crop: 'Maize',       qty: 1800, unit: 'kg', price: 1750, moisture: 12.6, afla: 3.5, grade: 'A' }
];

async function main() {
  console.log('AGRICHAIN 360 demo seed starting...');

  const connected = await db.testConnection();
  if (!connected) {
    console.error('Database not reachable. Set DATABASE_URL and try again.');
    process.exit(1);
  }

  const existing = await db.query(
    `SELECT COUNT(*)::int AS n FROM products WHERE record_source = 'demo';`
  );
  if (existing.rows[0].n > 0) {
    console.log(`Demo data already present (${existing.rows[0].n} demo listings). Nothing to do.`);
    process.exit(0);
  }

  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // ── Demo accounts ──────────────────────────────
  const accounts = [
    { name: 'AGRICHAIN Admin', phone: '+256700000000', role: 'ADMIN', hash: adminHash },
    { name: 'Busia Grains Ltd', phone: '+256700222222', role: 'BUYER', hash: demoHash },
    { name: 'Busoga Quality Lab', phone: '+256700333333', role: 'PARTNER', hash: demoHash }
  ];

  const userIds = {};
  for (const a of accounts) {
    const r = await db.query(
      `INSERT INTO users (name, phone, email, password_hash, role, status, created_at)
       VALUES ($1, $2, NULL, $3, $4, 'ACTIVE', NOW())
       ON CONFLICT (phone) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
       RETURNING id;`,
      [a.name, a.phone, a.hash, a.role]
    );
    userIds[a.role] = r.rows[0].id;
  }

  // Buyer profile
  await db.query(
    `INSERT INTO buyer_profiles (user_id, company_name, business_type, city, country, created_at)
     VALUES ($1, 'Busia Grains Ltd', 'TRADER', 'Busia', 'Uganda', NOW())
     ON CONFLICT (user_id) DO NOTHING;`,
    [userIds.BUYER]
  );

  // Lab partner profile (approved, so it can issue passports via the API)
  await db.query(
    `INSERT INTO partners (user_id, partner_type, business_name, location, approved, rating, created_at)
     VALUES ($1, 'LAB', 'Busoga Quality Lab', 'Iganga', true, 4.8, NOW())
     ON CONFLICT (user_id) DO UPDATE SET approved = true, rating = 4.8;`,
    [userIds.PARTNER]
  );

  // ── Demo farmers ──────────────────────────────
  const farmerIds = [];
  for (const f of DEMO_FARMERS) {
    const u = await db.query(
      `INSERT INTO users (name, phone, email, password_hash, role, status, created_at)
       VALUES ($1, $2, NULL, $3, 'FARMER', 'ACTIVE', NOW())
       ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
       RETURNING id;`,
      [f.name, f.phone, demoHash]
    );
    const fr = await db.query(
      `INSERT INTO farmers (user_id, district, village, farm_size, verification_status, created_at)
       VALUES ($1, $2, $3, $4, 'VERIFIED', NOW())
       ON CONFLICT (user_id) DO UPDATE SET district = EXCLUDED.district, village = EXCLUDED.village
       RETURNING id;`,
      [u.rows[0].id, f.district, f.village, f.farm_size]
    );
    farmerIds.push(fr.rows[0].id);
  }

  // ── Demo products + passports ─────────────────
  const partnerRow = await db.query(`SELECT id FROM partners ORDER BY id LIMIT 1;`);
  const partnerId = partnerRow.rows[0] ? partnerRow.rows[0].id : null;

  let firstProductId = null;
  let count = 0;
  for (const p of DEMO_PRODUCTS) {
    const pr = await db.query(
      `INSERT INTO products (farmer_id, crop, quantity, unit, price_per_unit, quality_status, available, record_source, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, 'demo', NOW())
       RETURNING id;`,
      [farmerIds[p.farmerIdx], p.crop, p.qty, p.unit, p.price,
       p.grade === 'A' || p.grade === 'B' ? 'APPROVED' : 'PENDING']
    );
    if (firstProductId === null) firstProductId = pr.rows[0].id;

    const batch = `AGR-DEMO-${String(++count).padStart(3, '0')}`;
    await db.query(
      `INSERT INTO quality_passports (batch_number, farmer_id, crop_type, quantity, moisture_level,
                                      aflatoxin_result, quality_grade, testing_partner_id, record_source,
                                      qr_code, created_at, verified_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'demo', $9, NOW(), NOW());`,
      [batch, farmerIds[p.farmerIdx], p.crop, p.qty, p.moisture, p.afla, p.grade, partnerId,
       `${process.env.APP_BASE_URL || 'http://localhost:3000'}/passport/${batch}`]
    );
  }

  // ── One sample order (demo buyer → first listing) ──
  if (firstProductId) {
    const priceRow = await db.query(`SELECT price_per_unit, quantity FROM products WHERE id = $1;`, [firstProductId]);
    const price = parseFloat(priceRow.rows[0].price_per_unit);
    const qty = Math.min(200, parseFloat(priceRow.rows[0].quantity));
    const total = Math.round(qty * price);
    await db.query(
      `INSERT INTO orders (buyer_id, product_id, quantity, total_amount, commission, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW());`,
      [userIds.BUYER, firstProductId, qty, total, Math.round(total * 0.03)]
    );
  }

  console.log('Demo seed complete:');
  console.log(`  - ${accounts.length} demo accounts (admin/buyer/partner)`);
  console.log(`  - ${DEMO_FARMERS.length} demo farmers`);
  console.log(`  - ${DEMO_PRODUCTS.length} demo listings + ${DEMO_PRODUCTS.length} demo passports (record_source='demo')`);
  console.log(`  - 1 sample order`);
  console.log('Demo logins: farmer +256700111111 / buyer +256700222222 / partner +256700333333 — password ' + DEMO_PASSWORD);
  console.log('Admin login: +256700000000 — rotate this password before any real use.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
