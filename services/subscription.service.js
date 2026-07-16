const SubscriptionModel = require('../models/Subscription');
const PaymentService = require('./payment.service');
const PaymentGateway = require('./payment-gateway.service');
const Buyer = require('../models/Buyer');
const User = require('../models/User');
const NotificationService = require('./notification.service');
const { logAudit, AUDIT_ACTIONS } = require('../api/middleware/auditLog');
const logger = require('../config/logger');

class SubscriptionService {
  static async getAvailablePlans() {
    return await SubscriptionModel.getActivePlans();
  }

  static async getPlanById(id) {
    return await SubscriptionModel.getPlanById(id);
  }

  static async getPlanByName(name) {
    return await SubscriptionModel.getPlanByName(name);
  }

  /**
   * Subscribe buyer to a plan
   * 
   * FLOW (Production-safe):
   * 1. Validate buyer profile exists
   * 2. Validate plan exists and is active
   * 3. If paid plan: initiate payment via gateway
   * 4. Create subscription record (status: PENDING if payment required)
   * 5. If FREE_TRIAL: activate immediately
   * 6. If paid: wait for payment callback to activate
   * 
   * IMPORTANT: Subscription is NOT activated until payment is confirmed
   * by the payment gateway (MTN/Airtel callback or admin confirmation).
   */
  static async subscribeBuyer(user_id, plan_name, billing_cycle, payment_method, req) {
    // 1. Validate buyer profile
    const profile = await Buyer.findByUserId(user_id);
    if (!profile) {
      throw new Error('Buyer profile not found. Create a profile first.');
    }

    // 2. Validate plan
    const plan = await SubscriptionModel.getPlanByName(plan_name);
    if (!plan) throw new Error(`Plan "${plan_name}" not found.`);
    if (!plan.is_active) throw new Error(`Plan "${plan_name}" is no longer available.`);

    // 3. Calculate amount
    const amount = billing_cycle === 'ANNUAL'
      ? plan.annual_price
      : plan.monthly_price;

    // 4. Handle FREE_TRIAL (no payment needed — activate immediately)
    if (amount <= 0 || plan_name === 'FREE_TRIAL') {
      const subscription = await SubscriptionModel.subscribe({
        buyer_id: profile.id,
        plan_id: plan.id,
        billing_cycle: billing_cycle || 'MONTHLY',
        amount_paid: 0,
        payment_id: null
      });

      // Send notification
      try {
        const user = await User.findById(user_id);
        if (user) {
          await NotificationService.notifySubscriptionActivated(subscription, plan, user.phone);
        }
      } catch (err) {
        logger.warn('Failed to send subscription notification', { error: err.message });
      }

      logAudit(AUDIT_ACTIONS.SUBSCRIPTION_CREATED, {
        plan: plan_name,
        billing_cycle,
        amount: 0,
        buyer_id: profile.id
      }, req);

      return { subscription, plan, payment: null, status: 'ACTIVE' };
    }

    // 5. Paid plan: initiate payment via gateway
    let payment = null;
    let gatewayResult = null;

    if (payment_method) {
      // Create payment record first (PENDING status)
      payment = await PaymentService.initiatePayment({
        user_id,
        amount,
        method: payment_method,
        description: `${plan.display_name} subscription (${billing_cycle || 'MONTHLY'})`,
        commission_rate: 0
      });

      // Request payment from gateway
      const user = await User.findById(user_id);
      gatewayResult = await PaymentGateway.requestPayment(
        payment_method,
        user ? user.phone : '',
        amount,
        payment.id.toString(),
        `${plan.display_name} subscription`
      );

      // Update payment with gateway transaction ID
      if (gatewayResult.transactionId) {
        const Payment = require('../models/Payment');
        await Payment.updateTransactionId(payment.id, gatewayResult.transactionId);
      }

      logAudit(AUDIT_ACTIONS.PAYMENT_INITIATED, {
        payment_id: payment.id,
        amount,
        method: payment_method,
        plan: plan_name,
        gateway_status: gatewayResult.status
      }, req);
    }

    // 6. Create subscription record (PENDING until payment confirmed)
    const subscription = await SubscriptionModel.subscribe({
      buyer_id: profile.id,
      plan_id: plan.id,
      billing_cycle: billing_cycle || 'MONTHLY',
      amount_paid: amount,
      payment_id: payment ? payment.id : null
    });

    // 7. If gateway simulated success (sandbox mode), auto-confirm
    //    In production, this only happens via webhook callback
    if (gatewayResult && gatewayResult.simulated && gatewayResult.success) {
      await PaymentService.confirmPayment(
        payment.id,
        gatewayResult.transactionId,
        'SANDBOX'
      );

      // Send notification
      try {
        const user = await User.findById(user_id);
        if (user) {
          await NotificationService.notifySubscriptionActivated(subscription, plan, user.phone);
        }
      } catch (err) {
        logger.warn('Failed to send subscription notification', { error: err.message });
      }
    }

    return {
      subscription,
      plan,
      payment,
      gateway: gatewayResult,
      status: (gatewayResult && gatewayResult.simulated) ? 'ACTIVE' : 'AWAITING_PAYMENT'
    };
  }

  static async getActiveSubscription(buyer_id) {
    return await SubscriptionModel.getActiveSubscription(buyer_id);
  }

  static async getActiveSubscriptionByUserId(user_id) {
    const profile = await Buyer.findByUserId(user_id);
    if (!profile) return null;
    return await SubscriptionModel.getActiveSubscription(profile.id);
  }

  static async cancelSubscription(subscription_id, req) {
    const result = await SubscriptionModel.cancelSubscription(subscription_id);
    logAudit(AUDIT_ACTIONS.SUBSCRIPTION_CANCELLED, {
      subscription_id
    }, req);
    return result;
  }

  static async getSubscriptionHistory(buyer_id) {
    return await SubscriptionModel.getSubscriptionHistory(buyer_id);
  }

  static async getRevenueBreakdown() {
    return await SubscriptionModel.getRevenueFromSubscriptions();
  }
}

module.exports = SubscriptionService;
