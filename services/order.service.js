/**
 * AGRICHAIN 360 — Order Service
 * Marketplace orders: buyer requests against farmer listings.
 * All writes go to the PostgreSQL `orders` table (source of truth).
 */

const db = require('../database/connection');
const logger = require('../config/logger');

class OrderService {
  /**
   * Create an order (request to purchase) from a buyer for a product listing.
   * @param {Object} params
   * @param {number} params.buyer_user_id - users.id of the buyer
   * @param {number} params.product_id    - products.id
   * @param {number} params.quantity      - requested quantity (in listing unit)
   */
  static async createOrder({ buyer_user_id, product_id, quantity }) {
    const qty = parseFloat(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error('Quantity must be a positive number.');
    }

    // Load product with farmer context
    const productResult = await db.query(
      `SELECT p.*, f.district, f.village, u.name AS farmer_name
       FROM products p
       JOIN farmers f ON p.farmer_id = f.id
       JOIN users u ON f.user_id = u.id
       WHERE p.id = $1;`,
      [product_id]
    );
    const product = productResult.rows[0];
    if (!product) throw new Error('Product listing not found.');
    if (!product.available) throw new Error('This listing is no longer available.');
    if (qty > parseFloat(product.quantity)) {
      throw new Error(`Requested quantity exceeds available stock (${product.quantity} ${product.unit}).`);
    }

    // Prevent farmers from ordering their own produce
    const ownCheck = await db.query(
      `SELECT f.user_id FROM farmers f WHERE f.id = $1;`,
      [product.farmer_id]
    );
    if (ownCheck.rows[0] && ownCheck.rows[0].user_id === buyer_user_id) {
      throw new Error('You cannot place an order on your own listing.');
    }

    const totalAmount = Math.round(qty * parseFloat(product.price_per_unit));

    // Commission from fee_structures (fallback 3%)
    let commissionRate = 3;
    try {
      const fee = await db.query(
        `SELECT percentage FROM fee_structures
         WHERE crop_type = $1 AND fee_type = 'COMMISSION'
         ORDER BY effective_from DESC LIMIT 1;`,
        [product.crop]
      );
      if (fee.rows[0]) commissionRate = parseFloat(fee.rows[0].percentage);
    } catch (e) {
      logger.warn('Commission lookup failed, using default 3%', { error: e.message });
    }
    const commission = Math.round(totalAmount * (commissionRate / 100));

    const insertResult = await db.query(
      `INSERT INTO orders (buyer_id, product_id, quantity, total_amount, commission, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
       RETURNING *;`,
      [buyer_user_id, product_id, qty, totalAmount, commission]
    );

    const order = insertResult.rows[0];
    logger.info('Order created', {
      order_id: order.id,
      buyer_user_id,
      product_id,
      total_ugx: totalAmount
    });

    return {
      ...order,
      product: {
        id: product.id,
        crop: product.crop,
        unit: product.unit,
        price_per_unit: product.price_per_unit,
        quality_status: product.quality_status,
        farmer_name: product.farmer_name,
        district: product.district,
        village: product.village
      }
    };
  }

  /** Orders placed by a buyer (by users.id) */
  static async getOrdersByBuyerUser(buyer_user_id) {
    const { rows } = await db.query(
      `SELECT o.*, p.crop, p.unit, p.price_per_unit, p.quality_status,
              u.name AS farmer_name, f.district, f.village
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN farmers f ON p.farmer_id = f.id
       JOIN users u ON f.user_id = u.id
       WHERE o.buyer_id = $1
       ORDER BY o.created_at DESC;`,
      [buyer_user_id]
    );
    return rows;
  }

  /** Orders received by a farmer (by farmers.id) */
  static async getOrdersForFarmer(farmer_id) {
    const { rows } = await db.query(
      `SELECT o.*, p.crop, p.unit, p.price_per_unit,
              u.name AS buyer_name, u.phone AS buyer_phone
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN users u ON o.buyer_id = u.id
       WHERE p.farmer_id = $1
       ORDER BY o.created_at DESC;`,
      [farmer_id]
    );
    return rows;
  }

  /** Recent orders across the platform (admin) */
  static async listRecent(limit = 20) {
    const { rows } = await db.query(
      `SELECT o.*, p.crop, bu.name AS buyer_name, fu.name AS farmer_name
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN users bu ON o.buyer_id = bu.id
       JOIN farmers f ON p.farmer_id = f.id
       JOIN users fu ON f.user_id = fu.id
       ORDER BY o.created_at DESC
       LIMIT $1;`,
      [parseInt(limit) || 20]
    );
    return rows;
  }

  /** Update order status (admin / buyer cancel) */
  static async updateStatus(order_id, status) {
    const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      throw new Error(`Status must be one of: ${allowed.join(', ')}`);
    }
    const { rows } = await db.query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *;`,
      [status, order_id]
    );
    if (!rows[0]) throw new Error('Order not found.');
    return rows[0];
  }
}

module.exports = OrderService;
