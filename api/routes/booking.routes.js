const express = require('express');
const router = express.Router();
const PartnerService = require('../../services/partner.service');
const { protect } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────────────
// BOOKING ROUTES
// ─────────────────────────────────────────────────────

// Get all bookings for the authenticated farmer
router.get('/my-bookings', protect(['FARMER', 'farmer']), async (req, res) => {
  try {
    const Farmer = require('../../models/Farmer');
    const farmer = await Farmer.findByUserId(req.user.id);

    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer profile not found.' });
    }

    const bookings = await PartnerService.getFarmerBookings(farmer.id);
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get all bookings for the authenticated partner
router.get('/partner-bookings', protect(['PARTNER', 'lab']), async (req, res) => {
  try {
    const Partner = require('../../models/Partner');
    const partner = await Partner.findByUserId(req.user.id);

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner profile not found.' });
    }

    const bookings = await PartnerService.getPartnerBookings(partner.id);
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get a single booking by ID
router.get('/:id', protect(), async (req, res) => {
  try {
    const booking = await PartnerService.getBookingById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update booking status (partner confirms/completes, farmer cancels)
router.put('/:id/status', protect(), async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await PartnerService.updateBookingStatus(req.params.id, status);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: booking
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
