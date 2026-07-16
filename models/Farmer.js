const db = require('../database/connection');

class Farmer {
  static async create({ user_id, district, village, crops, farm_size, national_id }) {
    const query = `
      INSERT INTO farmers (user_id, district, village, crops, farm_size, national_id, verification_status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', NOW())
      RETURNING *;
    `;
    const values = [user_id, district, village, crops, farm_size, national_id];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async findByUserId(user_id) {
    const query = 'SELECT * FROM farmers WHERE user_id = $1;';
    const { rows } = await db.query(query, [user_id]);
    return rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM farmers WHERE id = $1;';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async updateVerificationStatus(id, status) {
    const query = `
      UPDATE farmers 
      SET verification_status = $1 
      WHERE id = $2 
      RETURNING *;
    `;
    const { rows } = await db.query(query, [status, id]);
    return rows[0];
  }
}

module.exports = Farmer;