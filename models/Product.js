const db = require('../database/connection');

class Product {
  /**
   * Create a new product listing
   */
  static async create({ farmer_id, crop, quantity, unit, price_per_unit, quality_status }) {
    const query = `
      INSERT INTO products (farmer_id, crop, quantity, unit, price_per_unit, quality_status, available, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
      RETURNING *;
    `;
    const values = [farmer_id, crop, quantity, unit, price_per_unit, quality_status || 'PENDING'];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  /**
   * Find product by ID
   */
  static async findById(id) {
    const query = `
      SELECT p.*, f.district, f.village, u.name as farmer_name, u.phone as farmer_phone
      FROM products p
      LEFT JOIN farmers f ON p.farmer_id = f.id
      LEFT JOIN users u ON f.user_id = u.id
      WHERE p.id = $1;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  /**
   * Get available products with optional filters
   */
  static async getAvailable(filters = {}) {
    let query = `
      SELECT p.*, f.district, f.village, u.name as farmer_name
      FROM products p
      JOIN farmers f ON p.farmer_id = f.id
      JOIN users u ON f.user_id = u.id
      WHERE p.available = true
    `;
    const values = [];
    let paramCount = 1;

    if (filters.crop) {
      query += ` AND p.crop = $${paramCount}`;
      values.push(filters.crop);
      paramCount++;
    }

    if (filters.district) {
      query += ` AND f.district = $${paramCount}`;
      values.push(filters.district);
      paramCount++;
    }

    if (filters.quality_status) {
      query += ` AND p.quality_status = $${paramCount}`;
      values.push(filters.quality_status);
      paramCount++;
    }

    if (filters.min_price) {
      query += ` AND p.price_per_unit >= $${paramCount}`;
      values.push(parseFloat(filters.min_price));
      paramCount++;
    }

    if (filters.max_price) {
      query += ` AND p.price_per_unit <= $${paramCount}`;
      values.push(parseFloat(filters.max_price));
      paramCount++;
    }

    query += ` ORDER BY p.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(parseInt(filters.limit));
      paramCount++;
    }

    const { rows } = await db.query(query, values);
    return rows;
  }

  /**
   * Get all products by a specific farmer
   */
  static async findByFarmerId(farmer_id) {
    const query = `
      SELECT * FROM products
      WHERE farmer_id = $1
      ORDER BY created_at DESC;
    `;
    const { rows } = await db.query(query, [farmer_id]);
    return rows;
  }

  /**
   * Update product availability
   */
  static async updateAvailability(id, available) {
    const query = `
      UPDATE products
      SET available = $1
      WHERE id = $2
      RETURNING *;
    `;
    const { rows } = await db.query(query, [available, id]);
    return rows[0];
  }

  /**
   * Update quality status of a specific product
   */
  static async updateQualityStatus(id, quality_status) {
    const query = `
      UPDATE products
      SET quality_status = $1
      WHERE id = $2
      RETURNING *;
    `;
    const { rows } = await db.query(query, [quality_status, id]);
    return rows[0];
  }

  /**
   * Update quality status for all products of a farmer matching a crop type
   * Used when Quality Passport test results come in
   */
  static async updateQualityStatusByFarmer(farmer_id, crop_type, quality_status) {
    const query = `
      UPDATE products
      SET quality_status = $1
      WHERE farmer_id = $2 AND LOWER(crop) = LOWER($3) AND available = true
      RETURNING *;
    `;
    const { rows } = await db.query(query, [quality_status, farmer_id, crop_type]);
    return rows;
  }

  /**
   * Delete a product listing
   */
  static async delete(id) {
    const query = 'DELETE FROM products WHERE id = $1 RETURNING *;';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }
}

module.exports = Product;
