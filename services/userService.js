const db = require('../db/database');
const bcrypt = require('bcryptjs');

const userService = {
  // Create new user
  async createUser(phone, name, role, password = null) {
    try {
      let passwordHash = null;
      
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      }
      
      const result = await db.query(
        `INSERT INTO users (phone, name, role, password_hash) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [phone, name, role, passwordHash]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Find user by phone
  async findByPhone(phone) {
    try {
      const result = await db.query(
        'SELECT * FROM users WHERE phone = $1',
        [phone]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error finding user:', error);
      throw error;
    }
  },

  // Verify password
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  // Get all users
  async getAllUsers() {
    try {
      const result = await db.query(
        'SELECT id, phone, name, role, created_at FROM users ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }
};

module.exports = userService;