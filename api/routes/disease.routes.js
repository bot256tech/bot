const express = require('express');
const router = express.Router();
const DiseaseReport = require('../../models/DiseaseReport');
const { protect } = require('../middleware/authMiddleware');

// Diagnose crop disease from image description
router.post('/diagnose', protect(), async (req, res) => {
  try {
    const { crop, image_description, farmer_id, lifecycle_id, gps_lat, gps_lng, district } = req.body;
    const diagnosis = await DiseaseReport.diagnoseFromImage(crop || 'maize', image_description);
    const report = await DiseaseReport.create({ farmer_id: farmer_id || req.user.id, lifecycle_id, crop: crop || 'maize', gps_lat, gps_lng, district, ...diagnosis });
    res.status(201).json({ success: true, data: { diagnosis, report } });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// Get outbreak alerts for a district
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await DiseaseReport.getOutbreakAlerts(req.query.district, req.query.crop);
    res.json({ success: true, data: alerts });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// Get disease stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await DiseaseReport.getDiseaseStats(req.query.district);
    res.json({ success: true, data: stats });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// Get farmer's disease history
router.get('/history/:farmer_id', protect(), async (req, res) => {
  try {
    const reports = await DiseaseReport.findByFarmerId(req.params.farmer_id);
    res.json({ success: true, data: reports });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

module.exports = router;
