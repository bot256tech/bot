const express = require('express');
const router = express.Router();
const BuyerService = require('../../services/buyer.service');
const { protect } = require('../middleware/authMiddleware');

// Create buyer profile (Protected)
router.post('/profile', protect(['BUYER', 'buyer']), async (req, res) => {
  try {
    const profile = await BuyerService.createBuyerProfile(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Buyer profile created.',
      data: profile
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get my profile
router.get('/profile', protect(['BUYER', 'buyer']), async (req, res) => {
  try {
    const profile = await BuyerService.getProfile(req.user.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Buyer profile not found.' });
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────
// ENTERPRISE BUYER DASHBOARD
// ─────────────────────────────────────────────────

// Dashboard stats
router.get('/dashboard', protect(['BUYER', 'buyer']), async (req, res) => {
  try {
    const data = await BuyerService.getDashboardData(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Search suppliers (subscription-limited)
router.get('/suppliers', protect(['BUYER', 'buyer']), async (req, res) => {
  try {
    const result = await BuyerService.searchSuppliers(req.query, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get available batches / produce
router.get('/batches', protect(['BUYER', 'buyer']), async (req, res) => {
  try {
    const batches = await BuyerService.getAvailableBatches(req.query, req.user.id);
    res.json({ success: true, count: batches.length, data: batches });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Download quality reports (batch certificates)
router.get('/reports/quality', protect(['BUYER', 'buyer']), async (req, res) => {
  try {
    const QualityPassport = require('../../models/QualityPassport');
    const passports = req.query.farmer_id
      ? await QualityPassport.findByFarmerId(req.query.farmer_id)
      : [];
    res.json({
      success: true,
      count: passports.length,
      data: passports
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────
// ADMIN: Manage buyers
// ─────────────────────────────────────────────────

// List all buyers (Admin)
router.get('/admin/all', protect(['ADMIN', 'admin']), async (req, res) => {
  try {
    const buyers = await BuyerService.getAllBuyers(req.query);
    res.json({ success: true, count: buyers.length, data: buyers });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Verify buyer (Admin)
router.put('/admin/verify/:id', protect(['ADMIN', 'admin']), async (req, res) => {
  try {
    const buyer = await BuyerService.verifyBuyer(req.params.id);
    res.json({ success: true, message: 'Buyer verified.', data: buyer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
