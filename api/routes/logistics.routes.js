const express = require('express');
const router = express.Router();
const Logistics = require('../../models/Logistics');
const { protect } = require('../middleware/authMiddleware');

// Register as transport provider
router.post('/provider/register', protect(), async (req, res) => {
  try {
    const provider = await Logistics.registerProvider({ user_id: req.user.id, ...req.body });
    res.status(201).json({ success: true, data: provider });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// Create transport request
router.post('/request', protect(), async (req, res) => {
  try {
    const request = await Logistics.createRequest({ requester_id: req.user.id, ...req.body });
    res.status(201).json({ success: true, data: request });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// Place bid on transport request
router.post('/bid', protect(), async (req, res) => {
  try {
    const bid = await Logistics.placeBid(req.body);
    res.status(201).json({ success: true, data: bid });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// Accept a bid (requester)
router.post('/bid/:id/accept', protect(), async (req, res) => {
  try {
    const result = await Logistics.acceptBid(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// Find nearby transport providers
router.get('/providers/nearby', async (req, res) => {
  try {
    const { lat, lng, radius, vehicle_type } = req.query;
    const providers = await Logistics.findNearbyProviders(parseFloat(lat), parseFloat(lng), parseFloat(radius || 50), vehicle_type);
    res.json({ success: true, data: providers });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// Track shipment by tracking ID
router.get('/track/:tracking_id', async (req, res) => {
  try {
    const request = await Logistics.getRequestByTrackingId(req.params.tracking_id);
    if (!request) return res.status(404).json({ success: false, message: 'Shipment not found.' });
    res.json({ success: true, data: request });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// Update tracking status (provider)
router.put('/track/:tracking_id', protect(), async (req, res) => {
  try {
    const result = await Logistics.updateTracking(req.params.tracking_id, req.body.status, req.body);
    res.json({ success: true, data: result });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// Get bids for a request
router.get('/request/:id/bids', protect(), async (req, res) => {
  try {
    const bids = await Logistics.getBidsForRequest(req.params.id);
    res.json({ success: true, data: bids });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

module.exports = router;
