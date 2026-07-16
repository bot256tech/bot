const express = require('express');
const router = express.Router();
const AgriIntelService = require('../../services/ai-advisor.service');

// ─────────────────────────────────────────────────────
// AI ADVISOR API — Dynamic, database-driven responses
// ─────────────────────────────────────────────────────

// POST /api/v1/ai/ask — Ask the AI a question
router.post('/ask', async (req, res) => {
  try {
    const { question, district, crops } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a question.'
      });
    }

    const farmerContext = {
      district: district || null,
      crops: crops || []
    };

    const answer = await AgriIntelService.ask(question, farmerContext);

    res.json({
      success: true,
      data: {
        question: question,
        answer: answer,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'AI service temporarily unavailable. Please try again.'
    });
  }
});

// GET /api/v1/ai/suggestions — Get suggested questions
router.get('/suggestions', async (req, res) => {
  res.json({
    success: true,
    data: [
      { q: 'When should I harvest my maize?', icon: '🌽' },
      { q: 'Any disease risk in my area?', icon: '🦠' },
      { q: 'What are current market prices?', icon: '📈' },
      { q: 'How much does solar drying cost?', icon: '☀️' },
      { q: 'Tell me about quality passports', icon: '📜' },
      { q: 'What transport options are available?', icon: '🚛' },
      { q: 'What is the weather like today?', icon: '🌤️' },
      { q: 'How does storage work?', icon: '🏭' }
    ]
  });
});

module.exports = router;
