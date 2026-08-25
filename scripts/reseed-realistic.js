/**
 * AGRICHAIN 360 — Realistic Pilot Data
 * 
 * District-crop matching based on Uganda agricultural research:
 *   Mayuge:  cocoa (emerging), maize, rice, cassava — PILOT HUB
 *   Bugiri:  rice (major), maize, beans, groundnuts — PILOT HUB
 *   Iganga:  maize, beans, groundnuts, cassava
 *   Jinja:   coffee (traditional), maize, vegetables
 *   Kamuli:  maize, beans, cassava, sweet potatoes
 * 
 * More listings from Mayuge + Bugiri (the two drying hub districts).
 */

const db = require('../database/connection');
const bcrypt = require('bcryptjs');

async function main() {
  await db.testConnection();
  

  // ── Clear existing products/passports (keep users and orders) ──
  console.log('Clearing old products and passports…');
  await db.query('DELETE FROM quality_passports WHERE record_source = $1 OR record_source = $2', ['demo', 'user']);
  await db.query('DELETE FROM products');

  // ── Reset sequences for clean batch numbers ──
  await db.query("SELECT setval('products_id_seq', 1, false)");
  await db.query("SELECT setval('quality_passports_id_seq', 1, false)");

  const DEMO_PASSWORD = 'Demo@2026';
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ── Farmers: realistic distribution (more in Mayuge + Bugiri) ──
  const farmers = [
    // MAYUGE (pilot hub) — 5 farmers: cocoa, maize, rice, cassava, maize
    { name: 'John Mukasa',    phone: '+256700111111', district: 'Mayuge', village: 'Buwenge',    crops: 'Cocoa, Maize',  size: 3.5 },
    { name: 'Grace Namutebi', phone: '+256700555555', district: 'Mayuge', village: 'Bugembe',    crops: 'Maize, Beans',  size: 2.0 },
    { name: 'Fatuma Nakato',  phone: '+256700999999', district: 'Mayuge', village: 'Buwenge',    crops: 'Rice, Cassava', size: 2.7 },
    { name: 'Ismail Waiswa',  phone: '+256701100001', district: 'Mayuge', village: 'Magamaga',   crops: 'Cocoa',         size: 4.0 },
    { name: 'Sarah Nabirye',  phone: '+256701100002', district: 'Mayuge', village: 'Kigandalo',  crops: 'Maize, Cassava',size: 1.8 },
    // BUGIRI (pilot hub) — 4 farmers: rice (major), maize, beans, groundnuts
    { name: 'Moses Waiswa',   phone: '+256700888888', district: 'Bugiri', village: 'Kaliro',     crops: 'Rice, Maize',   size: 5.0 },
    { name: 'Peter Oundo',    phone: '+256700666666', district: 'Bugiri', village: 'Namayingo',  crops: 'Beans, Groundnuts', size: 4.2 },
    { name: 'Hassan Kirya',   phone: '+256701100003', district: 'Bugiri', village: 'Bulama',     crops: 'Rice',          size: 6.0 },
    { name: 'Aisha Nekesa',   phone: '+256701100004', district: 'Bugiri', village: 'Nankoma',    crops: 'Maize, Beans',  size: 2.5 },
    // IGANGA — 2 farmers: maize, groundnuts, cassava
    { name: 'Peter Oundo Sr', phone: '+256700777777', district: 'Iganga', village: 'Namayingo',  crops: 'Maize, Groundnuts', size: 3.0 },
    { name: 'Betty Kigongo',  phone: '+256701100005', district: 'Iganga', village: 'Nabitende',  crops: 'Cassava, Beans', size: 2.2 },
    // JINJA — 2 farmers: coffee (traditional), maize
    { name: 'David Wakoko',   phone: '+256701100006', district: 'Jinja',  village: 'Buyaga',     crops: 'Coffee',        size: 1.5 },
    { name: 'Rose Namuswe',   phone: '+256701100007', district: 'Jinja',  village: 'Budondo',    crops: 'Coffee, Maize', size: 2.8 },
    // KAMULI — 2 farmers: maize, beans, cassava
    { name: 'Sarah Babirye',  phone: '+256700444444', district: 'Kamuli', village: 'Budiope',    crops: 'Cassava, Beans', size: 1.8 },
    { name: 'James Talemwa',  phone: '+256701100008', district: 'Kamuli', village: 'Namasagali', crops: 'Maize',         size: 3.2 },
  ];

  const farmerIds = {};
  for (const f of farmers) {
    const u = await db.query(
      `INSERT INTO users (name, phone, email, password_hash, role, status, created_at)
       VALUES ($1, $2, NULL, $3, 'FARMER', 'ACTIVE', NOW())
       ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
       RETURNING id;`, [f.name, f.phone, hash]);
    const fr = await db.query(
      `INSERT INTO farmers (user_id, district, village, crops, farm_size, verification_status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'VERIFIED', NOW())
       ON CONFLICT (user_id) DO UPDATE SET district = EXCLUDED.district, village = EXCLUDED.village
       RETURNING id;`, [u.rows[0].id, f.district, f.village, f.crops.split(', '), f.size]);
    farmerIds[f.phone] = fr.rows[0].id;
  }
  console.log(`Farmers: ${farmers.length} (${farmers.filter(f=>f.district==='Mayuge').length} Mayuge, ${farmers.filter(f=>f.district==='Bugiri').length} Bugiri)`);

  // ── Listings: realistic crop-district matching ──
  const listings = [
    // MAYUGE — cocoa (emerging), maize, rice, cassava
    { f: '+256700111111', crop: 'Cocoa',       qty: 300, price: 12000, m: 7.2,  a: 2.0, g: 'A' },
    { f: '+256700111111', crop: 'Maize',       qty: 2000, price: 1800, m: 12.4, a: 3.2, g: 'A' },
    { f: '+256701100001', crop: 'Cocoa',       qty: 450, price: 11500, m: 7.5,  a: 2.5, g: 'A' },
    { f: '+256700555555', crop: 'Maize',       qty: 1500, price: 1750, m: 13.0, a: 4.1, g: 'B' },
    { f: '+256700555555', crop: 'Beans',       qty: 800,  price: 3200, m: 12.8, a: 3.5, g: 'A' },
    { f: '+256700999999', crop: 'Rice',        qty: 1200, price: 4500, m: 12.9, a: 3.8, g: 'A' },
    { f: '+256700999999', crop: 'Cassava',     qty: 2500, price: 1200, m: 12.0, a: null, g: 'B' },
    { f: '+256701100002', crop: 'Maize',       qty: 1000, price: 1700, m: 12.6, a: 3.0, g: 'A' },
    // BUGIRI — rice (major producer), maize, beans, groundnuts
    { f: '+256700888888', crop: 'Rice',        qty: 3000, price: 4200, m: 13.2, a: 4.0, g: 'B' },
    { f: '+256701100003', crop: 'Rice',        qty: 2500, price: 4400, m: 12.8, a: 3.5, g: 'A' },
    { f: '+256700888888', crop: 'Maize',       qty: 1800, price: 1750, m: 12.5, a: 3.8, g: 'A' },
    { f: '+256700666666', crop: 'Beans',       qty: 1200, price: 3000, m: 12.2, a: 4.5, g: 'A' },
    { f: '+256700666666', crop: 'Groundnuts',  qty: 900,  price: 3500, m: 13.5, a: 5.2, g: 'B' },
    { f: '+256701100004', crop: 'Maize',       qty: 2200, price: 1680, m: 13.1, a: 4.2, g: 'B' },
    // IGANGA — maize, groundnuts, cassava
    { f: '+256700777777', crop: 'Maize',       qty: 3000, price: 1650, m: 13.4, a: 4.8, g: 'B' },
    { f: '+256700777777', crop: 'Groundnuts',  qty: 600,  price: 3600, m: 12.5, a: 4.0, g: 'A' },
    { f: '+256701100005', crop: 'Cassava',     qty: 2000, price: 1100, m: 12.8, a: null, g: 'B' },
    // JINJA — coffee (traditional), maize
    { f: '+256701100006', crop: 'Coffee',      qty: 500,  price: 12000, m: 11.8, a: 3.2, g: 'A' },
    { f: '+256701100007', crop: 'Coffee',      qty: 300,  price: 11000, m: 12.5, a: 4.0, g: 'B' },
    { f: '+256701100007', crop: 'Maize',       qty: 800,  price: 1850, m: 12.8, a: 3.5, g: 'A' },
    // KAMULI — maize, beans, cassava
    { f: '+256700444444', crop: 'Cassava',     qty: 1800, price: 1150, m: 12.5, a: null, g: 'B' },
    { f: '+256701100008', crop: 'Maize',       qty: 1500, price: 1720, m: 12.7, a: 3.9, g: 'A' },
  ];

  let count = 0;
  for (const l of listings) {
    const pr = await db.query(
      `INSERT INTO products (farmer_id, crop, quantity, unit, price_per_unit, quality_status, available, record_source, created_at)
       VALUES ($1, $2, $3, 'kg', $4, $5, true, 'demo', NOW()) RETURNING id;`,
      [farmerIds[l.f], l.crop, l.qty, l.price,
       l.g === 'A' || l.g === 'B' ? 'APPROVED' : 'PENDING']);

    const batch = `AGR-DEMO-${String(++count).padStart(3, '0')}`;
    await db.query(
      `INSERT INTO quality_passports (batch_number, farmer_id, crop_type, quantity, moisture_level,
                                      aflatoxin_result, quality_grade, record_source, qr_code, created_at, verified_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'demo', $8, NOW(), NOW());`,
      [batch, farmerIds[l.f], l.crop, l.qty, l.m, l.a, l.g,
       `${process.env.APP_BASE_URL || 'https://16.192.159.6'}/verify?batchId=${batch}&action=view`]);
  }

  // ── Summary ──
  const summary = await db.query(`
    SELECT f.district, p.crop, COUNT(*) as listings, SUM(p.quantity) as total_kg
    FROM products p JOIN farmers f ON p.farmer_id = f.id
    GROUP BY f.district, p.crop ORDER BY f.district, p.crop;`);
  console.log('\nDistrict × Crop distribution:');
  summary.rows.forEach(r => {
    console.log(`  ${r.district.padEnd(10)} ${r.crop.padEnd(14)} ${r.listings} listings  ${Math.round(r.total_kg).toLocaleString()} kg`);
  });

  const totals = await db.query(`
    SELECT f.district, COUNT(*) as n FROM products p JOIN farmers f ON p.farmer_id = f.id GROUP BY f.district ORDER BY n DESC;`);
  console.log('\nListings per district:');
  totals.rows.forEach(r => console.log(`  ${r.district}: ${r.n}`));

  console.log(`\nTotal: ${listings.length} listings, ${count} passports`);
  console.log('\nReseed complete.');
  process.exit(0);
}

main().catch(e => { console.error('Seed failed:', e.message); process.exit(1); });
