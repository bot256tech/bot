const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

class PaymentService {
  static calculateSplit(amount, commissionRate) {
    const rate = commissionRate || 0.10;
    const commission = Math.round(amount * rate * 100) / 100;
    const partner_payout = Math.round((amount - commission) * 100) / 100;
    return { commission, partner_payout };
  }

  static async initiatePayment({ user_id, booking_id, amount, method, description, commission_rate }) {
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

    return payment;
  }

  static async confirmPayment(payment_id, transaction_id, provider) {
    const payment = await Payment.markPaid(payment_id, transaction_id, provider);
    if (!payment) throw new Error('Payment not found.');

    if (payment.booking_id) {
      await Booking.updateStatus(payment.booking_id, 'CONFIRMED');
      try {
        await Booking.updatePaymentStatus(payment.booking_id, 'PAID');
      } catch (e) {
        console.error('Could not update booking payment_status:', e.message);
      }
    }

    return payment;
  }

  static async failPayment(payment_id) {
    return await Payment.markFailed(payment_id);
  }

  static async refundPayment(payment_id) {
    const payment = await Payment.markRefunded(payment_id);
    if (payment && payment.booking_id) {
      try {
        await Booking.updatePaymentStatus(payment.booking_id, 'REFUNDED');
      } catch (e) { /* non-critical */ }
    }
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
