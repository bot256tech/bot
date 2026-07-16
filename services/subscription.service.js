const SubscriptionModel = require('../models/Subscription');
const PaymentService = require('./payment.service');
const Buyer = require('../models/Buyer');

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

  static async subscribeBuyer(user_id, plan_name, billing_cycle, payment_method) {
    const profile = await Buyer.findByUserId(user_id);
    if (!profile) throw new Error('Buyer profile not found. Create a profile first.');

    const plan = await SubscriptionModel.getPlanByName(plan_name);
    if (!plan) throw new Error(`Plan "${plan_name}" not found.`);
    if (!plan.is_active) throw new Error(`Plan "${plan_name}" is no longer available.`);

    const amount = billing_cycle === 'ANNUAL'
      ? plan.annual_price
      : plan.monthly_price;

    let payment = null;
    if (amount > 0 && payment_method) {
      payment = await PaymentService.initiatePayment({
        user_id,
        amount,
        method: payment_method,
        description: `${plan.display_name} subscription (${billing_cycle})`,
        commission_rate: 0
      });
    }

    const subscription = await SubscriptionModel.subscribe({
      buyer_id: profile.id,
      plan_id: plan.id,
      billing_cycle: billing_cycle || 'MONTHLY',
      amount_paid: amount,
      payment_id: payment ? payment.id : null
    });

    if (payment && amount > 0) {
      await PaymentService.confirmPayment(
        payment.id,
        `SUB-${subscription.id}-${Date.now()}`,
        'AGRIChain360'
      );
    }

    return {
      subscription,
      plan,
      payment
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

  static async cancelSubscription(subscription_id) {
    return await SubscriptionModel.cancelSubscription(subscription_id);
  }

  static async getSubscriptionHistory(buyer_id) {
    return await SubscriptionModel.getSubscriptionHistory(buyer_id);
  }

  static async getRevenueBreakdown() {
    return await SubscriptionModel.getRevenueFromSubscriptions();
  }
}

module.exports = SubscriptionService;
