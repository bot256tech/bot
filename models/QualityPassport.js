const db = require('../database/connection');

class QualityPassport {
  static async create({
    batch_number,
    farmer_id,
    crop_type,
    quantity,
    moisture_level,
    aflatoxin_result,
    quality_grade,
    testing_partner_id,
    drying_center,
    record_source,
    qr_code
  }) {
    const query = `
      INSERT INTO quality_passports (
        batch_number, farmer_id, crop_type, quantity,
        moisture_level, aflatoxin_result, quality_grade,
        testing_partner_id, drying_center, record_source, qr_code, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *;
    `;

    const values = [
      batch_number, farmer_id, crop_type, quantity,
      moisture_level !== undefined && moisture_level !== null && moisture_level !== '' ? moisture_level : null,
      aflatoxin_result !== undefined && aflatoxin_result !== null && aflatoxin_result !== '' ? aflatoxin_result : null,
      quality_grade || null,
      testing_partner_id || null,
      drying_center || null,
      record_source || 'user',
      qr_code
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async findByBatchNumber(batch_number) {
    const query = 'SELECT * FROM quality_passports WHERE batch_number = $1;';
    const { rows } = await db.query(query, [batch_number]);
    return rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM quality_passports WHERE id = $1;';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async findByFarmerId(farmer_id) {
    const query = `
      SELECT * FROM quality_passports
      WHERE farmer_id = $1
      ORDER BY created_at DESC;
    `;
    const { rows } = await db.query(query, [farmer_id]);
    return rows;
  }

  /** Latest passport for a farmer, optionally filtered by crop */
  static async findLatestByFarmerAndCrop(farmer_id, crop_type) {
    const query = crop_type
      ? `SELECT * FROM quality_passports
         WHERE farmer_id = $1 AND LOWER(crop_type) = LOWER($2)
         ORDER BY created_at DESC LIMIT 1;`
      : `SELECT * FROM quality_passports
         WHERE farmer_id = $1
         ORDER BY created_at DESC LIMIT 1;`;
    const values = crop_type ? [farmer_id, crop_type] : [farmer_id];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async updateTestResults(id, moisture_level, aflatoxin_result, quality_grade) {
    const query = `
      UPDATE quality_passports
      SET moisture_level = $1,
          aflatoxin_result = $2,
          quality_grade = $3,
          verified_at = NOW()
      WHERE id = $4
      RETURNING *;
    `;
    const { rows } = await db.query(query, [moisture_level, aflatoxin_result, quality_grade, id]);
    return rows[0];
  }

  /** Platform-wide stats (admin dashboard / public stats) */
  static async getStats() {
    const query = `
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE quality_grade = 'A')::int AS grade_a,
             COUNT(*) FILTER (WHERE quality_grade = 'B')::int AS grade_b,
             COUNT(*) FILTER (WHERE quality_grade = 'C')::int AS grade_c,
             COUNT(*) FILTER (WHERE quality_grade = 'REJECTED')::int AS rejected,
             COUNT(*) FILTER (WHERE verified_at IS NOT NULL)::int AS verified
      FROM quality_passports;
    `;
    const { rows } = await db.query(query);
    return rows[0];
  }
}

module.exports = QualityPassport;
