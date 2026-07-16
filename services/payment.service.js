const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const NotificationService = require('./notification.service');
const User = require('../models/User');
const { logAudit, AUDIT_ACTIONS } = require('../api/middleware/auditLog');
const logger = require('../config/logger');

class PaymentService {
  static calculateSplit(amount, commissionRate) {
    const rate = commissionRate || 0.10;
    const commission = Math.round(amount * rate * 100) / 100;
    const partner_payout = Math.round((amount - commission) * 100) / 100;
    return { commission, partner_payout };
  }

  static async initiatePayment({ user_id, booking_id, amount, method, description, commission_rate }, req) {
    if (!amount || amount <= 0) throw new Error('Payment amount must be greater than zero.');
    if (!method) throw new Error('Payment method is required.');

    const { commission, partner_payout } = PaymentService.calculateSplit(amount, commission_rate);

    const payment = await Payment.create({
      user_id,
      booking_id,
      amount,
      commission,
      partner_payout,
      method,
      description: description || `Payment for booking #${booking_id}`,
      metadata: { commission_rate: commission_rate || 0.10 }
    });

    logAudit(AUDIT_ACTIONS.PAYMENT_INITIATED, {
      payment_id: payment.id,
      amount,
      method,
      booking_id,
      commission,
      partner_payout
    }, req);

    return payment;
  }

  /**
   * Confirm payment — uses database transaction for integrity
   * Payment and booking status are updated atomically
   */
  static async confirmPayment(payment_id, transaction_id, provider, req) {
    const db = require('../database/connection');
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Mark payment as PAID
      const paymentResult = await client.query(
        `UPDATE payments
         SET status = 'PAID',
             transaction_id = COALESCE($2, transaction_id),
             provider = COALESCE($3, provider),
             paid_at = NOW()
         WHERE id = $1 AND status != 'PAID'
         RETURNING *`,
        [payment_id, transaction_id, provider]
      );

      const payment = paymentResult.rows[0];
      if (!payment) {
        await client.query('ROLLBACK');
        throw new Error('Payment not found or already confirmed.');
      }

      // 2. Update booking status atomically (if linked)
      if (payment.booking_id) {
        await client.query(
          `UPDATE bookings SET status = 'CONFIRMED', payment_status = 'PAID' WHERE id = $1`,
          [payment.booking_id]
        );
      }

      await client.query('COMMIT');

      // 3. Send SMS notification (non-blocking)
      try {
        const user = await User.findById(payment.user_id);
        if (user) {
          await NotificationService.notifyPaymentSuccess(payment, user.phone);
        }
      } catch (err) {
        logger.warn('Failed to send payment notification', { error: err.message });
      }

      // 4. Audit log
      logAudit(AUDIT_ACTIONS.PAYMENT_CONFIRMED, {
        payment_id: payment.id,
        amount: payment.amount,
        transaction_id,
        provider,
        booking_id: payment.booking_id
      }, req);

      return payment;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async failPayment(payment_id, req) {
    const payment = await Payment.markFailed(payment_id);

    // Send SMS notification
    if (payment) {
      try {
        const user = await User.findById(payment.user_id);
        if (user) {
          await NotificationService.notifyPaymentFailed(payment, user.phone);
        }
      } catch (err) {
        logger.warn('Failed to send payment failure notification', { error: err.message });
      }
    }

    logAudit(AUDIT_ACTIONS.PAYMENT_FAILED, { payment_id }, req);
    return payment;
  }

  static async refundPayment(payment_id, req) {
    const payment = await Payment.markRefunded(payment_id);
    if (payment && payment.booking_id) {
      try {
        await Booking.updatePaymentStatus(payment.booking_id, 'REFUNDED');
      } catch (e) { /* non-critical */ }
    }

    logAudit(AUDIT_ACTIONS.PAYMENT_REFUNDED, {
      payment_id,
      amount: payment ? payment.amount : null
    }, req);
    return payment;
  }

  static async getPaymentById(id) {
    return await Payment.findById(id);
  }

  static async getUserPayments(user_id) {
    return await Payment.findByUserId(user_id);
  }

  static async getBookingPayments(booking_id) {
    return await Payment.findByBookingId(booking_id);
  }

  static async getRevenueSummary() {
    return await Payment.getRevenueSummary();
  }

  static async getMonthlyRevenue(months) {
    return await Payment.getMonthlyRevenue(months);
  }
}

module.exports = PaymentService;
