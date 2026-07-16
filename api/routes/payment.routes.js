const express = require('express');
const router = express.Router();
const PaymentService = require('../../services/payment.service');
const { protect } = require('../middleware/authMiddleware');

// Initiate a payment (Protected)
router.post('/initiate', protect(), async (req, res) => {
  try {
    const payment = await PaymentService.initiatePayment({
      user_id: req.user.id,
      ...req.body
    });
    res.status(201).json({
      success: true,
      message: 'Payment initiated. Complete payment via your chosen provider.',
      data: payment
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Confirm payment (callback from payment provider or admin)
router.post('/confirm/:id', protect(['ADMIN', 'admin']), async (req, res) => {
  try {
    const { transaction_id, provider } = req.body;
    const payment = await PaymentService.confirmPayment(
      req.params.id, transaction_id, provider
    );
    res.json({
      success: true,
      message: 'Payment confirmed.',
      data: payment
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Fail payment
router.post('/fail/:id', protect(['ADMIN', 'admin']), async (req, res) => {
  try {
    const payment = await PaymentService.failPayment(req.params.id);
    res.json({ success: true, message: 'Payment marked as failed.', data: payment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Refund payment
router.post('/refund/:id', protect(['ADMIN', 'admin']), async (req, res) => {
  try {
    const payment = await PaymentService.refundPayment(req.params.id);
    res.json({ success: true, message: 'Payment refunded.', data: payment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get my payments (Protected)
router.get('/my-payments', protect(), async (req, res) => {
  try {
    const payments = await PaymentService.getUserPayments(req.user.id);
    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get payment by ID
router.get('/:id', protect(), async (req, res) => {
  try {
    const payment = await PaymentService.getPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Revenue summary (Admin only)
router.get('/admin/revenue', protect(['ADMIN', 'admin']), async (req, res) => {
  try {
    const summary = await PaymentService.getRevenueSummary();
    const monthly = await PaymentService.getMonthlyRevenue(req.query.months || 12);
    res.json({ success: true, summary, monthly });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
