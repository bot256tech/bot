const db = require('../database/connection');

class Booking {
  /**
   * Create a new service booking
   */
  static async create({ farmer_id, partner_id, service_type, scheduled_date, amount, notes }) {
    const query = `
      INSERT INTO bookings (farmer_id, partner_id, service_type, scheduled_date, amount, notes, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', NOW())
      RETURNING *;
    `;
    const values = [farmer_id, partner_id, service_type, scheduled_date, amount, notes || null];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  /**
   * Find booking by ID
   */
  static async findById(id) {
    const query = `
      SELECT b.*, 
             p.business_name as partner_name, p.partner_type,
             u.name as farmer_name, u.phone as farmer_phone
      FROM bookings b
      LEFT JOIN partners p ON b.partner_id = p.id
      LEFT JOIN farmers f ON b.farmer_id = f.id
      LEFT JOIN users u ON f.user_id = u.id
      WHERE b.id = $1;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  /**
   * Get all bookings for a farmer
   */
  static async findByFarmerId(farmer_id) {
    const query = `
      SELECT b.*, 
             p.business_name as partner_name, p.partner_type, p.location as partner_location
      FROM bookings b
      LEFT JOIN partners p ON b.partner_id = p.id
      WHERE b.farmer_id = $1
      ORDER BY b.created_at DESC;
    `;
    const { rows } = await db.query(query, [farmer_id]);
    return rows;
  }

  /**
   * Get all bookings for a partner (service provider)
   */
  static async findByPartnerId(partner_id) {
    const query = `
      SELECT b.*, 
             u.name as farmer_name, u.phone as farmer_phone,
             f.district, f.village
      FROM bookings b
      LEFT JOIN farmers f ON b.farmer_id = f.id
      LEFT JOIN users u ON f.user_id = u.id
      WHERE b.partner_id = $1
      ORDER BY b.created_at DESC;
    `;
    const { rows } = await db.query(query, [partner_id]);
    return rows;
  }

  /**
   * Update booking status
   */
  static async updateStatus(id, status) {
    const query = `
      UPDATE bookings
      SET status = $1
      WHERE id = $2
      RETURNING *;
    `;
    const { rows } = await db.query(query, [status, id]);
    return rows[0];
  }

  /**
   * Get bookings by status (for admin/partner dashboards)
   */
  static async findByStatus(status) {
    const query = `
      SELECT b.*,
             p.business_name as partner_name, p.partner_type,
             u.name as farmer_name, u.phone as farmer_phone
      FROM bookings b
      LEFT JOIN partners p ON b.partner_id = p.id
      LEFT JOIN farmers f ON b.farmer_id = f.id
      LEFT JOIN users u ON f.user_id = u.id
      WHERE b.status = $1
      ORDER BY b.created_at DESC;
    `;
    const { rows } = await db.query(query, [status]);
    return rows;
  }

  /**
   * Cancel a booking
   */
  static async cancel(id) {
    return await this.updateStatus(id, 'CANCELLED');
  }

  /**
   * Confirm a booking (partner accepts)
   */
  static async confirm(id) {
    return await this.updateStatus(id, 'CONFIRMED');
  }

  /**
   * Mark booking as completed
   */
  static async complete(id) {
    return await this.updateStatus(id, 'COMPLETED');
  }
}

module.exports = Booking;
