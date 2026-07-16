const db = require('../database/connection');

class Partner {
  static async create({ user_id, partner_type, business_name, location, services, pricing }) {
    const query = `
      INSERT INTO partners (user_id, partner_type, business_name, location, services, pricing, approved, rating, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, false, 0, NOW())
      RETURNING *;
    `;
    const values = [user_id, partner_type, business_name, location, services, pricing];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async findByUserId(user_id) {
    const query = 'SELECT * FROM partners WHERE user_id = $1;';
    const { rows } = await db.query(query, [user_id]);
    return rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM partners WHERE id = $1;';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async findByTypeAndLocation(partner_type, location) {
    const query = `
      SELECT * FROM partners 
      WHERE partner_type = $1 
      AND location ILIKE $2 
      AND approved = true
      ORDER BY rating DESC;
    `;
    const { rows } = await db.query(query, [partner_type, `%${location}%`]);
    return rows;
  }

  static async approve(id) {
    const query = `
      UPDATE partners 
      SET approved = true 
      WHERE id = $1 
      RETURNING *;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }
}

module.exports = Partner;