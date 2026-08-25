/**
 * AGRICHAIN 360 — Subscription Management API
 * Includes checkout stub for Mobile Money / Card payment gateways
 * (ready for integration once pilot funding deploys).
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const SubscriptionGatingService = require('../../services/subscription-gating.service');
const db = require('../../database/connection');

// ─────────────────────────────────────────────────────
// GET /api/v1/subscriptions/tiers — public pricing
// ─────────────────────────────────────────────────────
router.get('/tiers', (req, res) => {
  res.json({
    success: true,
    data: SubscriptionGatingService.TIERS
  });
});

// ─────────────────────────────────────────────────────
// GET /api/v1/subscriptions/me — buyer's current access
// ─────────────────────────────────────────────────────
router.get('/me', protect(['BUYER', 'buyer']), async (req, res) => {
  try {
    const access = await SubscriptionGatingService.getAccess(req.user.id);
    res.json({ success: true, data: access });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────
// POST /api/v1/subscriptions/checkout — PAYMENT STUB
// Ready for MTN MoMo / Airtel Money / Card integration.
// Returns a prepared checkout session that the payment
// gateway will confirm once integrated.
// ─────────────────────────────────────────────────────
router.post('/checkout', protect(['BUYER', 'buyer']), async (req, res) => {
  const { tier, billing_cycle } = req.body || {};
  const T = SubscriptionGatingService.TIERS;

  if (!T[tier] || tier === 'trial') {
    return res.status(400).json({ success: false, message: 'Valid tier required (basic, premium, or investor).' });
  }
  if (!['weekly', 'monthly'].includes(billing_cycle)) {
    return res.status(400).json({ success: false, message: 'billing_cycle must be "weekly" or "monthly".' });
  }
  if (billing_cycle === 'weekly' && T[tier].weekly === null) {
    return res.status(400).json({ success: false, message: 'Investor tier is monthly only.' });
  }

  const amount = billing_cycle === 'weekly' ? T[tier].weekly : T[tier].monthly;

  // ── PAYMENT GATEWAY STUB ──
  // When funding deploys, this will:
  // 1. Call MTN MoMo API: POST /collection/v1_0/requesttopay
  // 2. Or Airtel Money API: POST /merchant/v1/payments/
  // 3. Or card processor (e.g., Flutterwave)
  // 4. On confirmation callback → activate the subscription
  //
  // For now: return a prepared session for the frontend to display.

  const sessionId = `agrichain_sub_${Date.now()}_${req.user.id}`;
  res.status(200).json({
    success: true,
    message: 'Checkout session prepared. Payment gateway integration activates on pilot funding deployment.',
    data: {
      session_id: sessionId,
      tier,
      tier_label: T[tier].label,
      billing_cycle,
      amount_ugx: amount,
      payment_methods: ['MTN Mobile Money', 'Airtel Money', 'Card (Visa/Mastercard)'],
      status: 'awaiting_payment_gateway',
      note: 'Your 3-day pilot trial remains active until a payment gateway is connected. No charges will occur.'
    }
  });
});

// ─────────────────────────────────────────────────────
// POST /api/v1/subscriptions/activate — internal (admin/testing)
// Activates a subscription directly (used by payment callbacks)
// ─────────────────────────────────────────────────────
router.post('/activate', protect(['BUYER', 'buyer']), async (req, res) => {
  const { tier, billing_cycle } = req.body || {};
  const T = SubscriptionGatingService.TIERS;
  if (!T[tier] || tier === 'trial') {
    return res.status(400).json({ success: false, message: 'Valid tier required.' });
  }

  const durationDays = billing_cycle === 'weekly' ? 7 : 30;
  try {
    await db.query(
      `UPDATE buyer_profiles SET
         subscription_tier = $1,
         subscription_billing = $2,
         subscription_expires_at = NOW() + ($3 || ' days')::interval
       WHERE user_id = $4;`,
      [tier, billing_cycle || 'monthly', String(durationDays), req.user.id]
    );
    res.json({ success: true, message: `Subscription activated: ${T[tier].label} (${billing_cycle})` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
