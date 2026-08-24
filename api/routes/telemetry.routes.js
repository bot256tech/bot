const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const TelemetryService = require('../../services/telemetry.service');
const { protect } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────────────
// ESP32 TELEMETRY INGEST
// Devices authenticate with a pre-shared key in the
// X-Device-Key header (rotated per deployment unit).
// ─────────────────────────────────────────────────────

function deviceAuth(req, res, next) {
  const keys = (process.env.TELEMETRY_KEYS || '').split(',').map(s => s.trim()).filter(Boolean);
  const provided = req.get('X-Device-Key');
  if (!keys.length) {
    return res.status(503).json({ success: false, message: 'Telemetry ingest not configured on this deployment.' });
  }
  if (!provided || !keys.includes(provided)) {
    return res.status(401).json({ success: false, message: 'Unknown device key.' });
  }
  next();
}

// POST /api/v1/telemetry — validated sensor reading (device-authenticated)
router.post('/', deviceAuth, [
  body('device_id').isLength({ min: 2, max: 60 }).withMessage('device_id required (2-60 chars)')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const result = await TelemetryService.ingest(req.body || {});
    const code = result.status === 'rejected' ? 422 : 201;
    res.status(code).json({
      success: result.status === 'stored',
      status: result.status,
      anomaly: !!result.anomaly,
      reasons: result.reasons || [],
      data: result.reading || null,
      message: result.status === 'stored'
        ? (result.anomaly ? 'Reading stored and FLAGGED for manual review.' : 'Reading stored.')
        : 'Reading rejected by the validation engine (physically impossible values).'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Telemetry ingest failed.' });
  }
});

// GET /api/v1/telemetry/recent/:deviceId — partner/admin
router.get('/recent/:deviceId', protect(['PARTNER', 'ADMIN', 'partner', 'admin']), async (req, res) => {
  try {
    const rows = await TelemetryService.recent(req.params.deviceId, req.query.limit);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/v1/telemetry/anomalies — partner/admin QA queue
router.get('/anomalies', protect(['PARTNER', 'ADMIN', 'partner', 'admin']), async (req, res) => {
  try {
    const rows = await TelemetryService.anomalies(req.query.limit);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
