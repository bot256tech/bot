#!/usr/bin/env node
/**
 * Standalone Marketplace Seed Script
 * Run this via Render Shell to populate the marketplace with sample data
 * 
 * Usage in Render Shell:
 *   node scripts/seed-marketplace-now.js
 */

const { Pool } = require('pg');

async function seedMarketplace() {
  console.log('🌱 Starting marketplace seed...\n');

  // Connect to database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Check if already seeded
    const checkResult = await pool.query('SELECT COUNT(*) FROM products');
    const count = parseInt(checkResult.rows[0].count);
    
    if (count > 0) {
      console.log(`✅ Marketplace already has ${count} products. Skipping seed.\n`);
      await pool.end();
      return;
    }

    console.log('📦 Marketplace is empty. Seeding sample data...\n');

    // Create sample farmers
    const farmers = [
      { name: 'John Mukasa', phone: '+256700111111', district: 'Mayuge', village: 'Buwenge' },
      { name: 'Grace Namutebi', phone: '+256700222222', district: 'Jinja', village: 'Bugembe' },
      { name: 'Peter Oundo', phone: '+256700333333', district: 'Iganga', village: 'Namayingo' },
      { name: 'Sarah Babirye', phone: '+256700444444', district: 'Kamuli', village: 'Budiope' },
      { name: 'Moses Waiswa', phone: '+256700555555', district: 'Bugiri', village: 'Kaliro' },
      { name: 'Fatuma Nakato', phone: '+256700666666', district: 'Mayuge', village: 'Buwenge' }
    ];

    console.log('👨‍🌾 Creating farmers...');
    const farmerIds = [];
    for (const farmer of farmers) {
      const userResult = await pool.query(
        'INSERT INTO users (name, phone, password, role, created_at) VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT (phone) DO NOTHING RETURNING id',
        [farmer.name, farmer.phone, '$2a$10$dummypassword', 'FARMER']
      );
      
      let userId;
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
        console.log(`  ✓ Created user: ${farmer.name}`);
      } else {
        const existingUser = await pool.query('SELECT id FROM users WHERE phone = $1', [farmer.phone]);
        userId = existingUser.rows[0].id;
        console.log(`  ✓ User exists: ${farmer.name}`);
      }

      const farmerResult = await pool.query(
        'INSERT INTO farmers (user_id, district, village, created_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (user_id) DO NOTHING RETURNING id',
        [userId, farmer.district, farmer.village]
      );

      let farmerId;
      if (farmerResult.rows.length > 0) {
        farmerId = farmerResult.rows[0].id;
        console.log(`  ✓ Created farmer profile: ${farmer.district}, ${farmer.village}`);
      } else {
        const existingFarmer = await pool.query('SELECT id FROM farmers WHERE user_id = $1', [userId]);
        farmerId = existingFarmer.rows[0].id;
      }
      
      farmerIds.push(farmerId);
    }

    // Create sample products
    console.log('\n🌾 Creating products...');
    const products = [
      { crop: 'Maize', quantity: 2000, unit: 'kg', price: 1800, farmerIndex: 0 },
      { crop: 'Coffee', quantity: 500, unit: 'kg', price: 12000, farmerIndex: 1 },
      { crop: 'Beans', quantity: 1500, unit: 'kg', price: 3200, farmerIndex: 2 },
      { crop: 'Groundnuts', quantity: 800, unit: 'kg', price: 3500, farmerIndex: 3 },
      { crop: 'Maize', quantity: 3000, unit: 'kg', price: 1650, farmerIndex: 4 },
      { crop: 'Rice', quantity: 1200, unit: 'kg', price: 4500, farmerIndex: 5 },
      { crop: 'Cassava', quantity: 2500, unit: 'kg', price: 1200, farmerIndex: 0 },
      { crop: 'Soybeans', quantity: 900, unit: 'kg', price: 2800, farmerIndex: 1 },
      { crop: 'Coffee', quantity: 300, unit: 'kg', price: 11000, farmerIndex: 2 },
      { crop: 'Banana', quantity: 1800, unit: 'bunches', price: 800, farmerIndex: 3 }
    ];

    const productIds = [];
    for (const product of products) {
      const result = await pool.query(
        'INSERT INTO products (farmer_id, crop, quantity, unit, price_per_unit, quality_status, available, created_at) VALUES ($1, $2, $3, $4, $5, $6, true, NOW()) RETURNING id',
        [farmerIds[product.farmerIndex], product.crop, product.quantity, product.unit, product.price, 'APPROVED']
      );
      productIds.push(result.rows[0].id);
      console.log(`  ✓ ${product.crop}: ${product.quantity} ${product.unit} @ UGX ${product.price}/${product.unit}`);
    }

    // Create quality passports
    console.log('\n📜 Creating quality passports...');
    for (let i = 0; i < productIds.length; i++) {
      const batch = `AGR-2026-${String(i + 1).padStart(5, '0')}`;
      const moisture = (10 + Math.random() * 3).toFixed(1);
      const aflatoxin = (2 + Math.random() * 3).toFixed(1);
      
      const productInfo = await pool.query(
        'SELECT farmer_id, crop, quantity FROM products WHERE id = $1',
        [productIds[i]]
      );
      
      if (productInfo.rows.length > 0) {
        const { farmer_id, crop, quantity } = productInfo.rows[0];
        await pool.query(
          `INSERT INTO quality_passports 
           (batch_number, farmer_id, crop_type, quantity, moisture_level, aflatoxin_result, quality_grade, created_at, verified_at) 
           VALUES ($1, $2, $3, $4, $5, $6, 'A', NOW(), NOW()) 
           ON CONFLICT (batch_number) DO NOTHING`,
          [batch, farmer_id, crop, quantity, moisture, aflatoxin]
        );
        console.log(`  ✓ Passport ${batch}: ${crop} (Moisture: ${moisture}%, Aflatoxin: ${aflatoxin} ppb)`);
      }
    }

    console.log('\n✅ Marketplace seeded successfully!');
    console.log(`   📊 ${farmers.length} farmers`);
    console.log(`   🌾 ${products.length} products`);
    console.log(`   📜 ${productIds.length} quality passports`);
    console.log('\n🎉 Your marketplace is now populated!\n');

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    console.error('Stack:', error.stack);
    await pool.end();
    process.exit(1);
  }
}

seedMarketplace();
