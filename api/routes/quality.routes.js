const express = require('express');
const router = express.Router();
const QualityService = require('../../services/quality.service');
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

module.exports = router;
