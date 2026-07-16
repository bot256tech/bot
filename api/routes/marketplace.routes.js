const express = require('express');
const router = express.Router();
const MarketplaceService = require('../../services/marketplace.service');
const { protect } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────────────
// MARKETPLACE ROUTES
// ─────────────────────────────────────────────────────

// Create Product Listing (Protected — Farmers only)
router.post('/listing', protect(['FARMER', 'farmer']), async (req, res) => {
  try {
    const Farmer = require('../../models/Farmer');
    const farmer = await Farmer.findByUserId(req.user.id);

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer profile not found. Please complete your farmer profile first.'
      });
    }

    const product = await MarketplaceService.createListing(farmer.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Product listed successfully on the marketplace.',
      data: product
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get Available Products (Public)
router.get('/products', async (req, res) => {
  try {
    const products = await MarketplaceService.getAvailableProducts(req.query);
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Search Verified Products (Public — products with quality passports)
router.get('/verified', async (req, res) => {
  try {
    const products = await MarketplaceService.searchVerifiedProducts(req.query);
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get a single product by ID (Public)
router.get('/product/:id', async (req, res) => {
  try {
    const Product = require('../../models/Product');
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get farmer's own listings (Protected — Farmer)
router.get('/my-listings', protect(['FARMER', 'farmer']), async (req, res) => {
  try {
    const Farmer = require('../../models/Farmer');
    const Product = require('../../models/Product');
    const farmer = await Farmer.findByUserId(req.user.id);

    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer profile not found.' });
    }

    const listings = await Product.findByFarmerId(farmer.id);
    res.json({ success: true, count: listings.length, data: listings });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update product availability (Protected — Owner farmer)
router.put('/listing/:id/availability', protect(['FARMER', 'farmer']), async (req, res) => {
  try {
    const { available } = req.body;
    const product = await MarketplaceService.updateProductAvailability(req.params.id, available);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.json({
      success: true,
      message: `Product ${available ? 're-listed' : 'removed from marketplace'}.`,
      data: product
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
