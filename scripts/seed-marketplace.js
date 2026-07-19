/**
 * Seed script for AGRICHAIN 360 marketplace
 * Adds sample farmers, products, and quality passports
 */

const db = require('../database/connection');

async function seedMarketplace() {
  console.log('🌱 Seeding marketplace data...\n');

  try {
    // Create sample users (farmers)
    const farmers = [
      { name: 'John Mukasa', phone: '+256700111111', email: 'john.mukasa@example.com', password: '$2a$10$dummyhashedpassword123', role: 'FARMER' },
      { name: 'Grace Namutebi', phone: '+256700222222', email: 'grace.namutebi@example.com', password: '$2a$10$dummyhashedpassword123', role: 'FARMER' },
      { name: 'Peter Oundo', phone: '+256700333333', email: 'peter.oundo@example.com', password: '$2a$10$dummyhashedpassword123', role: 'FARMER' },
      { name: 'Sarah Babirye', phone: '+256700444444', email: 'sarah.babirye@example.com', password: '$2a$10$dummyhashedpassword123', role: 'FARMER' },
      { name: 'Moses Waiswa', phone: '+256700555555', email: 'moses.waiswa@example.com', password: '$2a$10$dummyhashedpassword123', role: 'FARMER' },
    ];

    console.log('👨‍🌾 Creating farmers...');
    const farmerIds = [];
    for (const farmer of farmers) {
      const result = await db.query(`
        INSERT INTO users (name, phone, email, password, role, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (phone) DO NOTHING
        RETURNING id
      `, [farmer.name, farmer.phone, farmer.email, farmer.password, farmer.role]);
      
      if (result.rows.length > 0) {
        farmerIds.push(result.rows[0].id);
        console.log(`  ✓ Created farmer: ${farmer.name}`);
      } else {
        // User exists, get their ID
        const existing = await db.query('SELECT id FROM users WHERE phone = $1', [farmer.phone]);
        farmerIds.push(existing.rows[0].id);
        console.log(`  → Farmer already exists: ${farmer.name}`);
      }
    }

    // Create farmer profiles
    console.log('\n📝 Creating farmer profiles...');
    const districts = ['Mayuge', 'Jinja', 'Iganga', 'Kamuli', 'Bugiri'];
    const villages = ['Buwenge', 'Bugembe', 'Namayingo', 'Budiope', 'Kaliro'];
    
    for (let i = 0; i < farmerIds.length; i++) {
      await db.query(`
        INSERT INTO farmers (user_id, district, village, farm_size, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (user_id) DO NOTHING
      `, [farmerIds[i], districts[i], villages[i], 2.5 + i]);
      console.log(`  ✓ Profile for ${farmers[i].name} (${districts[i]})`);
    }

    // Get farmer IDs from database
    const farmerRecords = await db.query(`
      SELECT f.id, u.name 
      FROM farmers f 
      JOIN users u ON f.user_id = u.id 
      ORDER BY f.id
      LIMIT 5
    `);

    if (farmerRecords.rows.length === 0) {
      console.log('❌ No farmers found in database');
      return;
    }

    // Create sample products
    console.log('\n📦 Creating products...');
    const products = [
      { crop: 'Maize', quantity: 2000, unit: 'kg', price: 1800, quality: 'APPROVED' },
      { crop: 'Coffee', quantity: 500, unit: 'kg', price: 12000, quality: 'APPROVED' },
      { crop: 'Beans', quantity: 1500, unit: 'kg', price: 3200, quality: 'APPROVED' },
      { crop: 'Groundnuts', quantity: 800, unit: 'kg', price: 3500, quality: 'APPROVED' },
      { crop: 'Maize', quantity: 3000, unit: 'kg', price: 1650, quality: 'APPROVED' },
      { crop: 'Rice', quantity: 1200, unit: 'kg', price: 4500, quality: 'APPROVED' },
      { crop: 'Cassava', quantity: 2500, unit: 'kg', price: 1200, quality: 'APPROVED' },
      { crop: 'Soybeans', quantity: 900, unit: 'kg', price: 2800, quality: 'APPROVED' },
    ];

    const productIds = [];
    for (let i = 0; i < products.length; i++) {
      const farmerId = farmerRecords.rows[i % farmerRecords.rows.length].id;
      const result = await db.query(`
        INSERT INTO products (farmer_id, crop, quantity, unit, price_per_unit, quality_status, available, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
        RETURNING id
      `, [farmerId, products[i].crop, products[i].quantity, products[i].unit, products[i].price, products[i].quality]);
      
      productIds.push(result.rows[0].id);
      console.log(`  ✓ ${products[i].crop} - ${products[i].quantity} ${products[i].unit} @ UGX ${products[i].price}/${products[i].unit}`);
    }

    // Create quality passports
    console.log('\n📜 Creating quality passports...');
    for (let i = 0; i < productIds.length; i++) {
      const batchNumber = `AGR-2026-${String(i + 1).padStart(5, '0')}`;
      const moisture = (10 + Math.random() * 3).toFixed(1);
      const aflatoxin = (2 + Math.random() * 3).toFixed(1);
      
      await db.query(`
        INSERT INTO quality_passports (product_id, batch_number, moisture_content, aflatoxin_level, grade, status, issued_at)
        VALUES ($1, $2, $3, $4, 'A', 'APPROVED', NOW())
        ON CONFLICT (batch_number) DO NOTHING
      `, [productIds[i], batchNumber, moisture, aflatoxin]);
      
      console.log(`  ✓ Passport ${batchNumber} (Moisture: ${moisture}%, Aflatoxin: ${aflatoxin} ppb)`);
    }

    console.log('\n✅ Marketplace seeding complete!');
    console.log(`   ${farmerRecords.rows.length} farmers`);
    console.log(`   ${products.length} products`);
    console.log(`   ${productIds.length} quality passports`);

  } catch (error) {
    console.error('❌ Error seeding marketplace:', error.message);
    console.error(error.stack);
  } finally {
    await db.end();
  }
}

seedMarketplace();
