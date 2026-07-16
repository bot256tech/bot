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
    qr_code 
  }) {
    const query = `
      INSERT INTO quality_passports (
        batch_number, farmer_id, crop_type, quantity, 
        moisture_level, aflatoxin_result, quality_grade, 
        testing_partner_id, qr_code, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *;
    `;

    const values = [
      batch_number, farmer_id, crop_type, quantity,
      moisture_level, aflatoxin_result, quality_grade,
      testing_partner_id, qr_code
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
}

module.exports = QualityPassport;