const express = require('express');
const router = express.Router();
const PartnerService = require('../../services/partner.service');
const { protect } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────────────
// PARTNER REGISTRATION & MANAGEMENT
// ─────────────────────────────────────────────────────

// Register as Partner (Protected — user must be logged in)
router.post('/register', protect(), async (req, res) => {
  try {
    const partner = await PartnerService.createPartner(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Partner registered successfully. Awaiting admin approval.',
      data: partner
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Approve Partner (Admin only)
router.put('/approve/:id', protect(['ADMIN', 'admin']), async (req, res) => {
  try {
    const partner = await PartnerService.approvePartner(req.params.id);

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found.' });
    }

    res.json({
      success: true,
      message: 'Partner approved successfully.',
      data: partner
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────
// PARTNER SEARCH (Public)
// ─────────────────────────────────────────────────────

// Search partners by type and/or location
router.get('/search', async (req, res) => {
  try {
    const { type, location } = req.query;
    const partners = await PartnerService.getPartnersByTypeAndLocation(type, location);
    res.json({ success: true, data: partners });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get partner by ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const partner = await PartnerService.getPartnerById(req.params.id);

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found.' });
    }

    res.json({ success: true, data: partner });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────
// BOOKINGS (Protected)
// ─────────────────────────────────────────────────────

// Create Booking (Farmer books a partner service)
router.post('/book', protect(['FARMER', 'farmer']), async (req, res) => {
  try {
    const Farmer = require('../../models/Farmer');
    const farmer = await Farmer.findByUserId(req.user.id);

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer profile not found. Please complete your farmer profile first.'
      });
    }

    const booking = await PartnerService.createBooking(
      farmer.id,
      req.body.partner_id,
      req.body.service_type,
      req.body.scheduled_date,
      req.body.amount,
      req.body.notes
    );

    res.status(201).json({
      success: true,
      message: 'Booking created successfully.',
      data: booking
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
