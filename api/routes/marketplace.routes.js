const express = require('express');
const router = express.Router();
const MarketplaceService = require('../../services/marketplace.service');
const OrderService = require('../../services/order.service');
const FeeCalculatorService = require('../../services/feeCalculator.service');
const { protect } = require('../middleware/authMiddleware');
const { createListingValidation, idParamValidation } = require('../middleware/validate');
const { body, validationResult } = require('express-validator');

// ─────────────────────────────────────────────────────
// MARKETPLACE ROUTES
// ─────────────────────────────────────────────────────

// Create Product Listing (Protected — Farmers only)
router.post('/listing', protect(['FARMER', 'farmer']), createListingValidation, async (req, res) => {
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
router.get('/product/:id', idParamValidation, async (req, res) => {
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
router.put('/listing/:id/availability', protect(['FARMER', 'farmer']), idParamValidation, async (req, res) => {
  try {
    const { available } = req.body;
    if (typeof available !== 'boolean') {
      return res.status(400).json({ success: false, message: 'available must be true or false' });
    }

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

// ─────────────────────────────────────────────────────
// ORDERS (Buyer → Listing)
// ─────────────────────────────────────────────────────

const orderValidation = [
  body('product_id').isInt({ min: 1 }).withMessage('A valid product id is required.'),
  body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be a positive number.')
];

// Place an order / purchase request (Protected — Buyers)
router.post('/orders', protect(['BUYER', 'buyer']), orderValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const order = await OrderService.createOrder({
      buyer_user_id: req.user.id,
      product_id: req.body.product_id,
      quantity: req.body.quantity
    });
    res.status(201).json({
      success: true,
      message: 'Order request placed. The farmer has been notified.',
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// My orders (Protected — Buyers)
router.get('/orders', protect(['BUYER', 'buyer']), async (req, res) => {
  try {
    const orders = await OrderService.getOrdersByBuyerUser(req.user.id);
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update order status (Protected — the buyer who owns it, or ADMIN)
router.put('/orders/:id/status', protect(['BUYER', 'buyer', 'ADMIN', 'admin']), idParamValidation, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    // Buyers may only cancel their own pending orders; admins may set any status.
    if (req.user.role.toUpperCase() !== 'ADMIN') {
      const existing = await require('../../database/connection').query(
        'SELECT buyer_id, status FROM orders WHERE id = $1;',
        [req.params.id]
      );
      const row = existing.rows[0];
      if (!row) return res.status(404).json({ success: false, message: 'Order not found.' });
      if (row.buyer_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'You can only update your own orders.' });
      }
      if (status !== 'cancelled' || row.status !== 'pending') {
        return res.status(403).json({ success: false, message: 'Buyers can only cancel pending orders.' });
      }
    }

    const order = await OrderService.updateStatus(req.params.id, status);
    res.json({ success: true, message: `Order ${status}.`, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────
// FEES & STATS (Public)
// ─────────────────────────────────────────────────────

// Fee quote for a prospective listing/transaction
router.post('/calculate-fees', async (req, res) => {
  try {
    const { crop, quantity, price_per_unit } = req.body || {};
    const qty = parseFloat(quantity);
    const price = parseFloat(price_per_unit);

    if (!crop || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide crop, quantity (> 0) and price_per_unit (> 0).'
      });
    }

    const quote = await FeeCalculatorService.calculateAllFees(crop, qty, price);
    res.json({ success: true, data: quote });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Marketplace summary stats (Public)
router.get('/stats', async (req, res) => {
  try {
    const db = require('../../database/connection');
    const [products, passports, orders] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS total,
                       COALESCE(SUM(quantity), 0)::int AS total_kg,
                       COUNT(*) FILTER (WHERE quality_status = 'APPROVED')::int AS approved
                FROM products WHERE available = true;`),
      db.query(`SELECT COUNT(*)::int AS total,
                       COUNT(*) FILTER (WHERE quality_grade = 'A')::int AS grade_a
                FROM quality_passports;`),
      db.query(`SELECT COUNT(*)::int AS total,
                       COALESCE(SUM(total_amount), 0)::bigint AS value_ugx
                FROM orders;`)
    ]);
    res.json({
      success: true,
      data: {
        active_listings: products.rows[0].total,
        available_kg: products.rows[0].total_kg,
        approved_listings: products.rows[0].approved,
        quality_passports: passports.rows[0].total,
        grade_a_passports: passports.rows[0].grade_a,
        orders: orders.rows[0].total,
        order_value_ugx: parseInt(orders.rows[0].value_ugx)
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
