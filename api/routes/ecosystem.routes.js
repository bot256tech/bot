const express = require('express');
const router = express.Router();
const CreditProfile = require('../../models/CreditProfile');
const Community = require('../../models/Community');
const CropLifecycle = require('../../models/CropLifecycle');
const { protect } = require('../middleware/authMiddleware');

// ─── CREDIT ───

router.get('/credit/:farmer_id', protect(), async (req, res) => {
  try {
    const profile = await CreditProfile.createOrUpdate(parseInt(req.params.farmer_id));
    res.json({ success: true, data: profile });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

router.post('/loan/request', protect(), async (req, res) => {
  try {
    const loan = await CreditProfile.requestLoan({ farmer_id: req.body.farmer_id, amount_requested: req.body.amount, purpose: req.body.purpose });
    res.status(201).json({ success: true, data: loan });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// ─── COMMUNITY ───

router.get('/community/posts', async (req, res) => {
  try {
    const posts = await Community.getPosts(req.query);
    res.json({ success: true, data: posts });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

router.post('/community/post', protect(), async (req, res) => {
  try {
    const post = await Community.createPost({ author_id: req.user.id, ...req.body });
    res.status(201).json({ success: true, data: post });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

router.post('/community/reply', protect(), async (req, res) => {
  try {
    const reply = await Community.addReply({ author_id: req.user.id, ...req.body });
    res.status(201).json({ success: true, data: reply });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

router.get('/community/post/:id/replies', async (req, res) => {
  try {
    const replies = await Community.getReplies(parseInt(req.params.id));
    res.json({ success: true, data: replies });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

router.get('/community/leaderboard', async (req, res) => {
  try {
    const leaderboard = await Community.getLeaderboard(parseInt(req.query.limit || 20));
    res.json({ success: true, data: leaderboard });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

// ─── TRACEABILITY ───

router.get('/trace/:batch_id', async (req, res) => {
  try {
    const data = await CropLifecycle.getFullTraceability(req.params.batch_id);
    if (!data) return res.status(404).json({ success: false, message: 'Batch not found.' });
    res.json({ success: true, data });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

router.get('/lifecycle/farmer/:farmer_id', protect(), async (req, res) => {
  try {
    const crops = await CropLifecycle.findByFarmerId(parseInt(req.params.farmer_id), req.query.status);
    res.json({ success: true, data: crops });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

router.put('/lifecycle/:id/stage', protect(), async (req, res) => {
  try {
    const updated = await CropLifecycle.updateStage(parseInt(req.params.id), req.body.stage, req.body.data);
    res.json({ success: true, data: updated });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

module.exports = router;
