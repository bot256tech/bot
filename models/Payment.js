const db = require('../database/connection');

class Payment {
  static async create({ user_id, booking_id, amount, commission, partner_payout, method, provider, transaction_id, reference, description, metadata }) {
    const query = `
      INSERT INTO payments (
        user_id, booking_id, amount, commission, partner_payout,
        method, provider, transaction_id, reference, description, metadata,
        status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING', NOW())
      RETURNING *;
    `;
    const values = [
      user_id, booking_id || null, amount, commission || 0, partner_payout || 0,
      method, provider || null, transaction_id || null, reference || null,
      description || null, metadata ? JSON.stringify(metadata) : null
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT p.*, u.name AS user_name, u.phone AS user_phone
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = $1;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async findByTransactionId(transaction_id) {
    const query = 'SELECT * FROM payments WHERE transaction_id = $1;';
    const { rows } = await db.query(query, [transaction_id]);
    return rows[0];
  }

  static async findByUserId(user_id) {
    const query = `
      SELECT p.*, b.service_type, b.partner_id
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC;
    `;
    const { rows } = await db.query(query, [user_id]);
    return rows;
  }

  static async findByBookingId(booking_id) {
    const query = `
      SELECT * FROM payments
      WHERE booking_id = $1
      ORDER BY created_at DESC;
    `;
    const { rows } = await db.query(query, [booking_id]);
    return rows;
  }

  static async findByStatus(status) {
    const query = `
      SELECT p.*, u.name AS user_name, u.phone AS user_phone
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.status = $1
      ORDER BY p.created_at DESC;
    `;
    const { rows } = await db.query(query, [status]);
    return rows;
  }

  static async markPaid(id, transaction_id, provider) {
    const query = `
      UPDATE payments
      SET status = 'PAID',
          transaction_id = COALESCE($2, transaction_id),
          provider = COALESCE($3, provider),
          paid_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await db.query(query, [id, transaction_id, provider]);
    return rows[0];
  }

  static async markFailed(id) {
    const query = `
      UPDATE payments SET status = 'FAILED'
      WHERE id = $1 RETURNING *;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async markRefunded(id) {
    const query = `
      UPDATE payments SET status = 'REFUNDED'
      WHERE id = $1 RETURNING *;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async getRevenueSummary() {
    const query = `
      SELECT
        COALESCE(SUM(amount), 0) AS total_revenue,
        COALESCE(SUM(commission), 0) AS total_commission,
        COALESCE(SUM(partner_payout), 0) AS total_partner_payouts,
        COUNT(*) FILTER (WHERE status = 'PAID') AS paid_count,
        COUNT(*) FILTER (WHERE status = 'PENDING') AS pending_count,
        COUNT(*) FILTER (WHERE status = 'FAILED') AS failed_count
      FROM payments;
    `;
    const { rows } = await db.query(query);
    return rows[0];
  }

  static async getMonthlyRevenue(months) {
    const query = `
      SELECT
        DATE_TRUNC('month', paid_at) AS month,
        SUM(amount) AS revenue,
        SUM(commission) AS commission,
        COUNT(*) AS transaction_count
      FROM payments
      WHERE status = 'PAID'
        AND paid_at >= NOW() - ($1 || ' months')::INTERVAL
      GROUP BY DATE_TRUNC('month', paid_at)
      ORDER BY month DESC;
    `;
    const { rows } = await db.query(query, [months || 12]);
    return rows;
  }
}

module.exports = Payment;
