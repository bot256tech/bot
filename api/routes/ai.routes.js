const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// ─────────────────────────────────────────────────────
// AGRICHAIN DECISION ADVISOR API
// Local, deterministic decision-support engine.
// Identity is optional: logged-in farmers get personalized
// answers drawn from their own records; everyone else gets
// general guidance. No external AI provider is called.
// ─────────────────────────────────────────────────────

/**
 * Resolve optional identity from (a) Bearer token or (b) web session.
 * Never rejects the request — anonymous questions are allowed.
 */
function resolveUser(req) {
  try {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      const token = header.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'agrichain360_jwt_secret';
      return jwt.verify(token, secret);
    }
  } catch (e) { /* invalid/expired token → anonymous */ }

  if (req.session && req.session.user) {
    return { id: req.session.user.id, role: req.session.user.role };
  }
  return null;
}

// POST /api/v1/ai/ask — Ask the advisor a question
router.post('/ask', async (req, res) => {
  try {
    const { question, district, crops } = req.body || {};

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a question.'
      });
    }

    const user = resolveUser(req);
    const farmerContext = {
      user_id: user ? user.id : null,
      role: user ? user.role : null,
      district: district || null,
      crops: crops || []
    };

    const AgriIntelService = require('../../services/ai-advisor.service');
    const answer = await AgriIntelService.ask(question, farmerContext);

    res.json({
      success: true,
      data: {
        question,
        answer,
        personalized: !!(user && user.role === 'FARMER'),
        engine: 'local-rules',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'The advisor could not process this question. Please rephrase and try again.'
    });
  }
});

// GET /api/v1/ai/suggestions — Suggested questions
router.get('/suggestions', async (req, res) => {
  res.json({
    success: true,
    data: [
      { q: 'Can I list this coffee for sale?' },
      { q: 'What are current market prices?' },
      { q: 'How much does solar drying cost?' },
      { q: 'Any disease risk in my area?' },
      { q: 'Explain quality grades for export' },
      { q: 'How should I store my maize?' }
    ]
  });
});

module.exports = router;
