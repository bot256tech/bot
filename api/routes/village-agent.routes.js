const express = require('express');
const router = express.Router();
const VillageAgentService = require('../../services/village-agent.service');
const { protect } = require('../middleware/authMiddleware');

// Register as Village Agent
router.post('/register', protect(), async (req, res) => {
  try {
    const agent = await VillageAgentService.registerAgent(req.user.id, req.body);
    res.status(201).json({ success: true, data: agent });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// Agent Dashboard
router.get('/dashboard', protect(), async (req, res) => {
  try {
    const data = await VillageAgentService.getAgentDashboard(req.user.id);
    res.json({ success: true, data });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// Register farmer (agent action)
router.post('/register-farmer', protect(), async (req, res) => {
  try {
    const VillageAgent = require('../../models/VillageAgent');
    const agent = await VillageAgent.findByUserId(req.user.id);
    if (!agent) return res.status(403).json({ success: false, message: 'You are not a registered village agent.' });
    const result = await VillageAgentService.registerFarmer(agent.id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// Map garden with GPS
router.post('/map-garden', protect(), async (req, res) => {
  try {
    const VillageAgent = require('../../models/VillageAgent');
    const agent = await VillageAgent.findByUserId(req.user.id);
    if (!agent) return res.status(403).json({ success: false, message: 'Not an agent' });
    const garden = await VillageAgentService.mapGarden(agent.id, req.body.farmer_id, req.body);
    res.status(201).json({ success: true, data: garden });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// Register crop lifecycle
router.post('/register-crop', protect(), async (req, res) => {
  try {
    const result = await VillageAgentService.registerCrop(null, req.body.farmer_id, req.body.garden_id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// Get garden calculations (seed, fertilizer, yield, profit)
router.get('/garden/:id/calculations', async (req, res) => {
  try {
    const calc = await VillageAgentService.getGardenCalculations(req.params.id, req.query.crop || 'maize');
    res.json({ success: true, data: calc });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// Find nearby agents
router.get('/nearby', async (req, res) => {
  try {
    const agents = await VillageAgentService.getNearbyAgents(req.query);
    res.json({ success: true, data: agents });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

module.exports = router;
