const express = require('express');
const router = express.Router();
const QualityService = require('../../services/quality.service');
const QualityPassport = require('../../models/QualityPassport');
const { protect } = require('../middleware/authMiddleware');
const { issuePassportValidation, updatePassportValidation, batchNumberValidation, idParamValidation } = require('../middleware/validate');

// ─────────────────────────────────────────────────────
// DIGITAL QUALITY PASSPORT ROUTES
// ─────────────────────────────────────────────────────

// Issue Quality Passport (Protected — Partners/Labs/Admin)
router.post('/issue', protect(['PARTNER', 'ADMIN', 'lab', 'quality_officer', 'admin']), issuePassportValidation, async (req, res) => {
  try {
    const passport = await QualityService.createPassport(req.body);
    res.status(201).json({
      success: true,
      message: 'Quality Passport issued successfully.',
      data: passport
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Verify Passport by Batch Number (Public — anyone can scan QR)
router.get('/verify/:batch_number', batchNumberValidation, async (req, res) => {
  try {
    const passport = await QualityService.verifyPassport(req.params.batch_number);

    if (!passport) {
      return res.status(404).json({
        success: false,
        message: 'Quality Passport not found.'
      });
    }

    res.json({
      success: true,
      data: passport
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update Test Results (Protected — Lab partners and admins)
router.put('/update/:id', protect(['PARTNER', 'ADMIN', 'lab', 'quality_officer', 'admin']), idParamValidation, updatePassportValidation, async (req, res) => {
  try {
    const { moisture_level, aflatoxin_result, quality_grade } = req.body;

    const passport = await QualityService.updatePassportResults(
      req.params.id,
      moisture_level,
      aflatoxin_result,
      quality_grade
    );

    if (!passport) {
      return res.status(404).json({
        success: false,
        message: 'Quality Passport not found.'
      });
    }

    res.json({
      success: true,
      message: 'Quality Passport updated with test results.',
      data: passport
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get all passports for a farmer (Protected)
router.get('/farmer/:farmer_id', protect(), idParamValidation, async (req, res) => {
  try {
    const passports = await QualityService.getPassportsByFarmer(req.params.farmer_id);
    res.json({ success: true, data: passports });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get passport by ID
// The farmer's own passports
router.get('/my-passports', protect(['FARMER', 'farmer']), async (req, res) => {
  try {
    const Farmer = require('../../models/Farmer');
    const farmer = await Farmer.findByUserId(req.user.id);
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer profile not found.' });
    }
    const passports = await QualityPassport.findByFarmerId(farmer.id);
    res.json({ success: true, count: passports.length, data: passports });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/:id', idParamValidation, async (req, res) => {
  try {
    const passport = await QualityService.getPassportById(req.params.id);

    if (!passport) {
      return res.status(404).json({ success: false, message: 'Passport not found.' });
    }

    res.json({ success: true, data: passport });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


// ─────────────────────────────────────────────────────
// FARMER-FACING ENDPOINTS (used by the mobile app)
// ─────────────────────────────────────────────────────
const { body, validationResult } = require('express-validator');

// Record quality information for one of the farmer's own product batches.
// Creates or updates the batch's Digital Quality Passport and assigns the grade.
router.post('/record', protect(['FARMER', 'farmer']), [
  body('product_id').isInt({ min: 1 }).withMessage('A valid product_id is required.'),
  body('moisture_level').optional({ nullable: true }).isFloat({ min: 0, max: 60 }).withMessage('Moisture must be 0-60%.'),
  body('aflatoxin_result').optional({ nullable: true }).isFloat({ min: 0, max: 500 }).withMessage('Aflatoxin must be 0-500 ppb.')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const Farmer = require('../../models/Farmer');
    const Product = require('../../models/Product');
    const QualityService = require('../../services/quality.service');
    const db = require('../../database/connection');

    const farmer = await Farmer.findByUserId(req.user.id);
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer profile not found.' });
    }

    const products = await Product.findByFarmerId(farmer.id);
    const product = products.find((p) => p.id === parseInt(req.body.product_id));
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found among your registered batches.' });
    }

    const moisture = req.body.moisture_level === undefined || req.body.moisture_level === null || req.body.moisture_level === ''
      ? null : parseFloat(req.body.moisture_level);
    const aflatoxin = req.body.aflatoxin_result === undefined || req.body.aflatoxin_result === null || req.body.aflatoxin_result === ''
      ? null : parseFloat(req.body.aflatoxin_result);

    const existing = await QualityPassport.findLatestByFarmerAndCrop(farmer.id, product.crop);
    let passport;
    if (existing) {
      passport = await QualityService.updatePassportResults(existing.id, moisture, aflatoxin);
      if (req.body.drying_center) {
        await db.query('UPDATE quality_passports SET drying_center = $1 WHERE id = $2;', [req.body.drying_center, existing.id]);
      }
    } else {
      passport = await QualityService.createPassport({
        farmer_id: farmer.id,
        crop_type: product.crop,
        quantity: product.quantity,
        moisture_level: moisture,
        aflatoxin_result: aflatoxin,
        drying_center: req.body.drying_center || null,
        record_source: 'user'
      });
    }

    res.status(201).json({
      success: true,
      message: `Quality information recorded for ${product.crop}.`,
      data: {
        passport,
        grade: passport.quality_grade,
        product_status: (passport.quality_grade === 'A' || passport.quality_grade === 'B') ? 'APPROVED' : (passport.quality_grade === 'REJECTED' ? 'REJECTED' : 'PENDING')
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
