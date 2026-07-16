const db = require('../database/connection');

class Buyer {
  static async createProfile({ user_id, company_name, business_type, registration_number, tin_number, address, city, country, website, procurement_crops, annual_volume_tonnes }) {
    const query = `
      INSERT INTO buyer_profiles (
        user_id, company_name, business_type, registration_number,
        tin_number, address, city, country, website,
        procurement_crops, annual_volume_tonnes, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *;
    `;
    const values = [
      user_id, company_name, business_type, registration_number || null,
      tin_number || null, address || null, city || null, country || 'Uganda',
      website || null, procurement_crops || [], annual_volume_tonnes || null
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async findByUserId(user_id) {
    const query = `
      SELECT bp.*, u.name, u.phone, u.email
      FROM buyer_profiles bp
      JOIN users u ON bp.user_id = u.id
      WHERE bp.user_id = $1;
    `;
    const { rows } = await db.query(query, [user_id]);
    return rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT bp.*, u.name, u.phone, u.email
      FROM buyer_profiles bp
      JOIN users u ON bp.user_id = u.id
      WHERE bp.id = $1;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async getAll(filters) {
    let query = `
      SELECT bp.*, u.name, u.phone, u.email
      FROM buyer_profiles bp
      JOIN users u ON bp.user_id = u.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filters && filters.business_type) {
      query += ` AND bp.business_type = $${paramCount}`;
      values.push(filters.business_type);
      paramCount++;
    }
    if (filters && filters.verified !== undefined) {
      query += ` AND bp.verified = $${paramCount}`;
      values.push(filters.verified);
      paramCount++;
    }

    query += ` ORDER BY bp.created_at DESC`;
    const { rows } = await db.query(query, values);
    return rows;
  }

  static async verify(id) {
    const query = `
      UPDATE buyer_profiles
      SET verified = true, verified_at = NOW()
      WHERE id = $1 RETURNING *;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async getDashboardStats(buyer_user_id) {
    const query = `
      SELECT
        (SELECT COUNT(DISTINCT f.id) FROM farmers f WHERE f.verification_status = 'VERIFIED') AS total_suppliers,
        (SELECT COUNT(*) FROM quality_passports) AS total_passports,
        (SELECT COUNT(*) FROM quality_passports WHERE quality_grade = 'A') AS grade_a_count,
        (SELECT COUNT(*) FROM quality_passports WHERE quality_grade = 'B') AS grade_b_count,
        (SELECT COUNT(*) FROM quality_passports WHERE quality_grade = 'C') AS grade_c_count,
        (SELECT COALESCE(SUM(p.quantity), 0) FROM products p WHERE p.available = true) AS total_available_kg,
        (SELECT COUNT(DISTINCT p.crop) FROM products p WHERE p.available = true) AS crop_varieties,
        (SELECT COUNT(*) FROM products p WHERE p.quality_status = 'APPROVED' AND p.available = true) AS verified_listings;
    `;
    const { rows } = await db.query(query);
    return rows[0];
  }

  static async searchSuppliers(filters) {
    let query = `
      SELECT f.id, f.district, f.village, f.crops, f.farm_size,
             f.verification_status, u.name AS farmer_name, u.phone,
             COUNT(DISTINCT p.id) AS active_listings,
             COUNT(DISTINCT qp.id) AS passport_count
      FROM farmers f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN products p ON p.farmer_id = f.id AND p.available = true
      LEFT JOIN quality_passports qp ON qp.farmer_id = f.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filters.district) {
      query += ` AND f.district ILIKE $${paramCount}`;
      values.push(`%${filters.district}%`);
      paramCount++;
    }
    if (filters.crop) {
      query += ` AND $${paramCount} = ANY(f.crops)`;
      values.push(filters.crop);
      paramCount++;
    }
    if (filters.verified_only) {
      query += ` AND f.verification_status = 'VERIFIED'`;
    }

    query += ` GROUP BY f.id, u.name, u.phone ORDER BY active_listings DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(parseInt(filters.limit));
      paramCount++;
    }

    const { rows } = await db.query(query, values);
    return rows;
  }

  static async getAvailableBatches(filters) {
    let query = `
      SELECT p.*, f.district, f.village, u.name AS farmer_name,
             qp.batch_number, qp.moisture_level, qp.aflatoxin_result,
             qp.quality_grade, qp.verified_at
      FROM products p
      JOIN farmers f ON p.farmer_id = f.id
      JOIN users u ON f.user_id = u.id
      LEFT JOIN quality_passports qp ON qp.farmer_id = f.id
        AND LOWER(qp.crop_type) = LOWER(p.crop)
      WHERE p.available = true
    `;
    const values = [];
    let paramCount = 1;

    if (filters.crop) {
      query += ` AND LOWER(p.crop) = LOWER($${paramCount})`;
      values.push(filters.crop);
      paramCount++;
    }
    if (filters.quality_grade) {
      query += ` AND qp.quality_grade = $${paramCount}`;
      values.push(filters.quality_grade);
      paramCount++;
    }
    if (filters.verified_only) {
      query += ` AND qp.id IS NOT NULL`;
    }

    query += ` ORDER BY p.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(parseInt(filters.limit));
    }

    const { rows } = await db.query(query, values);
    return rows;
  }
}

module.exports = Buyer;
