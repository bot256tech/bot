const db = require('../database/connection');

class Booking {
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

  static async findById(id) {
    const query = `
      SELECT b.*,
             p.business_name AS partner_name,
             p.partner_type,
             p.location AS partner_location,
             u.name AS farmer_name,
             u.phone AS farmer_phone
      FROM bookings b
      LEFT JOIN partners p ON b.partner_id = p.id
      LEFT JOIN farmers f ON b.farmer_id = f.id
      LEFT JOIN users u ON f.user_id = u.id
      WHERE b.id = $1;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async findByFarmerId(farmer_id) {
    const query = `
      SELECT b.*,
             p.business_name AS partner_name,
             p.partner_type,
             p.location AS partner_location
      FROM bookings b
      LEFT JOIN partners p ON b.partner_id = p.id
      WHERE b.farmer_id = $1
      ORDER BY b.created_at DESC;
    `;
    const { rows } = await db.query(query, [farmer_id]);
    return rows;
  }

  static async findByPartnerId(partner_id) {
    const query = `
      SELECT b.*,
             u.name AS farmer_name,
             u.phone AS farmer_phone,
             f.district,
             f.village
      FROM bookings b
      LEFT JOIN farmers f ON b.farmer_id = f.id
      LEFT JOIN users u ON f.user_id = u.id
      WHERE b.partner_id = $1
      ORDER BY b.created_at DESC;
    `;
    const { rows } = await db.query(query, [partner_id]);
    return rows;
  }

  static async findByStatus(status) {
    const query = `
      SELECT b.*,
             p.business_name AS partner_name,
             p.partner_type,
             u.name AS farmer_name,
             u.phone AS farmer_phone
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

  static async confirm(id) {
    return await Booking.updateStatus(id, 'CONFIRMED');
  }

  static async complete(id) {
    return await Booking.updateStatus(id, 'COMPLETED');
  }

  static async cancel(id) {
    return await Booking.updateStatus(id, 'CANCELLED');
  }
}

module.exports = Booking;
