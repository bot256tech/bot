const db = require('../database/connection');
const bcrypt = require('bcryptjs');

class User {
  static async create({ name, phone, email, password, role }) {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO users (name, phone, email, password_hash, role, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW())
      RETURNING id, name, phone, email, role, status, created_at;
    `;

    const values = [name, phone, email ? email.toLowerCase().trim() : null, passwordHash, role];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async findByPhone(phone) {
    const query = 'SELECT * FROM users WHERE phone = $1;';
    const { rows } = await db.query(query, [phone]);
    return rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT id, name, phone, email, role, status, created_at 
      FROM users 
      WHERE id = $1;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;