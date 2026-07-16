const express = require('express');
const router = express.Router();
const SubscriptionService = require('../../services/subscription.service');
const { protect } = require('../middleware/authMiddleware');

// Get available plans (Public)
router.get('/plans', async (req, res) => {
  try {
    const plans = await SubscriptionService.getAvailablePlans();
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get single plan by name (Public)
router.get('/plans/:name', async (req, res) => {
  try {
    const plan = await SubscriptionService.getPlanByName(req.params.name.toUpperCase());
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found.' });
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Subscribe to a plan (Protected — Buyer)
router.post('/subscribe', protect(['BUYER', 'buyer']), async (req, res) => {
  try {
    const { plan_name, billing_cycle, payment_method } = req.body;

    if (!plan_name) {
      return res.status(400).json({ success: false, message: 'plan_name is required.' });
    }

    const result = await SubscriptionService.subscribeBuyer(
      req.user.id,
      plan_name.toUpperCase(),
      billing_cycle,
      payment_method
    );

    res.status(201).json({
      success: true,
      message: `Subscribed to ${result.plan.display_name}.`,
      data: result
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get my active subscription
router.get('/my-subscription', protect(['BUYER', 'buyer']), async (req, res) => {
  try {
    const subscription = await SubscriptionService.getActiveSubscriptionByUserId(req.user.id);
    if (!subscription) {
      return res.json({ success: true, data: null, message: 'No active subscription.' });
    }
    res.json({ success: true, data: subscription });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Cancel my subscription
router.post('/cancel/:id', protect(['BUYER', 'buyer']), async (req, res) => {
  try {
    const result = await SubscriptionService.cancelSubscription(req.params.id);
    res.json({ success: true, message: 'Subscription cancelled.', data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Revenue breakdown (Admin only)
router.get('/admin/revenue', protect(['ADMIN', 'admin']), async (req, res) => {
  try {
    const breakdown = await SubscriptionService.getRevenueBreakdown();
    res.json({ success: true, data: breakdown });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
