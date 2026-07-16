const db = require('../database/connection');

class Subscription {
  static async getActivePlans() {
    const query = `
      SELECT * FROM subscription_plans
      WHERE is_active = true
      ORDER BY monthly_price ASC;
    `;
    const { rows } = await db.query(query);
    return rows;
  }

  static async getPlanById(id) {
    const query = 'SELECT * FROM subscription_plans WHERE id = $1;';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async getPlanByName(name) {
    const query = 'SELECT * FROM subscription_plans WHERE name = $1;';
    const { rows } = await db.query(query, [name]);
    return rows[0];
  }

  static async subscribe({ buyer_id, plan_id, billing_cycle, amount_paid, payment_id }) {
    const plan = await Subscription.getPlanById(plan_id);
    if (!plan) throw new Error('Subscription plan not found.');

    const start_date = new Date();
    let end_date = new Date();
    if (billing_cycle === 'ANNUAL') {
      end_date.setFullYear(end_date.getFullYear() + 1);
    } else {
      end_date.setMonth(end_date.getMonth() + 1);
    }

    const query = `
      INSERT INTO buyer_subscriptions (
        buyer_id, plan_id, status, billing_cycle,
        start_date, end_date, auto_renew, amount_paid, payment_id, created_at
      )
      VALUES ($1, $2, 'ACTIVE', $3, $4, $5, true, $6, $7, NOW())
      RETURNING *;
    `;
    const values = [buyer_id, plan_id, billing_cycle || 'MONTHLY', start_date, end_date, amount_paid, payment_id || null];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async getActiveSubscription(buyer_id) {
    const query = `
      SELECT bs.*, sp.name AS plan_name, sp.display_name,
             sp.monthly_price, sp.features, sp.max_users,
             sp.max_suppliers_viewable
      FROM buyer_subscriptions bs
      JOIN subscription_plans sp ON bs.plan_id = sp.id
      WHERE bs.buyer_id = $1
        AND bs.status = 'ACTIVE'
        AND bs.end_date >= CURRENT_DATE
      ORDER BY bs.created_at DESC
      LIMIT 1;
    `;
    const { rows } = await db.query(query, [buyer_id]);
    return rows[0];
  }

  static async cancelSubscription(id) {
    const query = `
      UPDATE buyer_subscriptions
      SET status = 'CANCELLED', auto_renew = false
      WHERE id = $1 RETURNING *;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async suspendSubscription(id) {
    const query = `
      UPDATE buyer_subscriptions
      SET status = 'SUSPENDED'
      WHERE id = $1 RETURNING *;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async getSubscriptionHistory(buyer_id) {
    const query = `
      SELECT bs.*, sp.name AS plan_name, sp.display_name
      FROM buyer_subscriptions bs
      JOIN subscription_plans sp ON bs.plan_id = sp.id
      WHERE bs.buyer_id = $1
      ORDER BY bs.created_at DESC;
    `;
    const { rows } = await db.query(query, [buyer_id]);
    return rows;
  }

  static async getRevenueFromSubscriptions() {
    const query = `
      SELECT
        sp.name AS plan_name,
        COUNT(bs.id) AS subscriber_count,
        SUM(bs.amount_paid) AS total_revenue
      FROM buyer_subscriptions bs
      JOIN subscription_plans sp ON bs.plan_id = sp.id
      WHERE bs.status = 'ACTIVE'
      GROUP BY sp.name
      ORDER BY total_revenue DESC;
    `;
    const { rows } = await db.query(query);
    return rows;
  }
}

module.exports = Subscription;
