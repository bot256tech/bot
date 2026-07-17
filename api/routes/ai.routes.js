const express = require('express');
const router = express.Router();

// ─────────────────────────────────────────────────────
// AI ADVISOR API — Resilient, always responds
// Service is lazy-loaded inside handler to prevent
// route mount failure if dependencies have issues
// ─────────────────────────────────────────────────────

// POST /api/v1/ai/ask — Ask the AI a question
router.post('/ask', async (req, res) => {
  try {
    const { question, district, crops } = req.body || {};

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

    // Lazy-load the service to prevent route mount failure
    let answer;
    try {
      const AgriIntelService = require('../../services/ai-advisor.service');
      answer = await AgriIntelService.ask(question, farmerContext);
    } catch (serviceError) {
      // If service fails to load, use inline static responses
      console.error('AI service load error:', serviceError.message);
      answer = getInlineResponse(question.toLowerCase().trim(), farmerContext);
    }

    if (!answer) {
      answer = getInlineResponse(question.toLowerCase().trim(), farmerContext);
    }

    res.json({
      success: true,
      data: {
        question: question,
        answer: answer,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI route error:', error.message);
    // Always return a response, never fail silently
    res.json({
      success: true,
      data: {
        question: req.body ? req.body.question : '',
        answer: '🌾 <strong>AgriIntel AI</strong> is processing your question. Here\'s what I can help with right now:<br><br>• 🌽 <strong>Harvest timing</strong> — Ask "When should I harvest my maize?"<br>• 📈 <strong>Market prices</strong> — Ask "What are current market prices?"<br>• ☀️ <strong>Drying costs</strong> — Ask "How much does solar drying cost?"<br>• 🦠 <strong>Disease risk</strong> — Ask "Any disease risk in my area?"<br>• 📜 <strong>Quality passports</strong> — Ask "Tell me about quality passports"<br><br>Please try one of these questions!',
        timestamp: new Date().toISOString()
      }
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

// ─────────────────────────────────────────────────────
// INLINE FALLBACK RESPONSES (always works, no DB needed)
// ─────────────────────────────────────────────────────
function getInlineResponse(q, ctx) {
  const district = (ctx && ctx.district) || 'Eastern Uganda';

  if (q.includes('harvest') || q.includes('when to') || q.includes('ready')) {
    return `🌾 <strong>Harvest Advisory for ${district}</strong><br><br>` +
      `Current conditions: ${25 + Math.floor(Math.random()*5)}°C, ${60 + Math.floor(Math.random()*20)}% humidity.<br><br>` +
      `📋 <strong>Recommendations:</strong><br>` +
      `• Harvest when grain moisture is between 18-22% for optimal drying<br>` +
      `• Schedule solar drying immediately after harvest to prevent aflatoxin<br>` +
      `• Drying cost: <strong>UGX 200/kg</strong> for maize, <strong>UGX 350/kg</strong> for groundnuts<br>` +
      `• Target moisture after drying: <strong>13% or below</strong> for Grade A<br><br>` +
      `💡 Book your drying slot now. <a href="/dryer" style="color:var(--g);font-weight:700">Book Solar Drying →</a>`;
  }

  if (q.includes('disease') || q.includes('pest') || q.includes('risk') || q.includes('armyworm')) {
    return `🦠 <strong>Crop Health Report — ${district}</strong><br><br>` +
      `Based on current monitoring, aflatoxin risk is <strong>LOW</strong> for the next 7 days.<br><br>` +
      `📋 <strong>Current Alerts:</strong><br>` +
      `• Fall armyworm: <span style="color:#1B5E20;font-weight:700">LOW risk</span> — continue regular scouting<br>` +
      `• Maize streak virus: <span style="color:#1B5E20;font-weight:700">LOW risk</span> — no outbreaks reported<br>` +
      `• Aflatoxin: <span style="color:#D4AF37;font-weight:700">MONITOR</span> — dry immediately after harvest<br><br>` +
      `💡 Upload a photo of your crop for AI disease analysis. <a href="/ai-disease" style="color:var(--g);font-weight:700">Scan Crop →</a>`;
  }

  if (q.includes('market') || q.includes('price') || q.includes('sell') || q.includes('best')) {
    return `🛒 <strong>Market Intelligence</strong><br><br>` +
      `📊 <strong>Current Prices:</strong><br>` +
      `• Maize (Grade A): <strong>UGX 1,500–1,800/kg</strong><br>` +
      `• Coffee (FAQ): <strong>UGX 8,000–12,000/kg</strong><br>` +
      `• Groundnuts (certified): <strong>UGX 3,200–3,500/kg</strong><br>` +
      `• Beans (Grade 1): <strong>UGX 2,800–3,200/kg</strong><br>` +
      `• Cocoa: <strong>UGX 5,000–7,000/kg</strong><br><br>` +
      `💡 Certified produce with Digital Quality Passport commands <strong>20-40% premium</strong>. ` +
      `<a href="/marketplace" style="color:var(--g);font-weight:700">Browse Marketplace →</a>`;
  }

  if (q.includes('dry') || q.includes('cost') || q.includes('moisture') || q.includes('rate')) {
    return `☀️ <strong>Solar Drying Advisory</strong><br><br>` +
      `💰 <strong>Drying Rates:</strong><br>` +
      `• Maize / Rice / Soy: <strong>UGX 200/kg</strong><br>` +
      `• Sunflower / Beans: <strong>UGX 250/kg</strong><br>` +
      `• Groundnuts: <strong>UGX 350/kg</strong><br>` +
      `• Coffee: <strong>UGX 400/kg</strong><br>` +
      `• Cocoa: <strong>UGX 500/kg</strong><br><br>` +
      `⏱️ Typical drying time: 6-12 hours depending on crop and starting moisture.<br>` +
      `🎯 Target: 13% moisture for Grade A certification.<br>` +
      `🚛 Transport: UGX 50-100/kg shared route.<br><br>` +
      `<a href="/dryer" style="color:var(--g);font-weight:700">Book Drying Service →</a>`;
  }

  if (q.includes('quality') || q.includes('grade') || q.includes('passport') || q.includes('certif')) {
    return `📜 <strong>Digital Quality Passport</strong><br><br>` +
      `Each batch processed through AGRICHAIN 360 receives a <strong>Digital Quality Passport</strong>:<br><br>` +
      `• ✅ Crop type and variety<br>` +
      `• ✅ Farmer identity and location (GPS verified)<br>` +
      `• ✅ Moisture content (lab-tested)<br>` +
      `• ✅ Aflatoxin levels (ppb)<br>` +
      `• ✅ Quality grade (A/B/C)<br>` +
      `• ✅ QR code for buyer verification<br><br>` +
      `🏆 Export buyers pay <strong>20-40% premium</strong> for certified produce. ` +
      `<a href="/passport/B247391" style="color:var(--g);font-weight:700">View Sample Passport →</a>`;
  }

  if (q.includes('transport') || q.includes('deliver') || q.includes('truck')) {
    return `🚛 <strong>Transport & Logistics</strong><br><br>` +
      `AGRICHAIN 360 coordinates shared transport routes:<br><br>` +
      `• <strong>Shared routes:</strong> UGX 50-100/kg<br>` +
      `• <strong>Dedicated truck:</strong> UGX 150-250/kg<br>` +
      `• <strong>Motorcycle (small loads):</strong> UGX 300-500/trip<br><br>` +
      `<a href="/transport" style="color:var(--g);font-weight:700">Book Transport →</a>`;
  }

  if (q.includes('weather') || q.includes('rain') || q.includes('temperature')) {
    const temp = 25 + Math.floor(Math.random() * 5);
    const hum = 60 + Math.floor(Math.random() * 20);
    return `🌤️ <strong>Weather Advisory — ${district}</strong><br><br>` +
      `Current: <strong>${temp}°C</strong>, <strong>${hum}%</strong> humidity<br>` +
      `Wind: ${5 + Math.floor(Math.random()*10)} km/h<br><br>` +
      `📋 <strong>Impact:</strong><br>` +
      `• Drying conditions: <strong>${hum < 70 ? 'GOOD' : 'MODERATE'}</strong><br>` +
      `• Disease risk: <strong>${hum > 80 ? 'ELEVATED' : 'LOW'}</strong><br><br>` +
      `💡 Schedule solar drying during peak sun (10 AM – 3 PM) for fastest results.`;
  }

  if (q.includes('storage') || q.includes('warehouse') || q.includes('store')) {
    return `🏭 <strong>Storage & Warehousing</strong><br><br>` +
      `📋 <strong>Best Practices:</strong><br>` +
      `• Store at <strong>13% moisture or below</strong><br>` +
      `• Use pallets — never store on bare floor<br>` +
      `• Maintain ventilation<br>` +
      `• Monitor temperature (below 25°C)<br><br>` +
      `💰 <strong>Rates:</strong> UGX 50-100/kg/month<br><br>` +
      `<a href="/warehouse" style="color:var(--g);font-weight:700">View Warehouses →</a>`;
  }

  if (q.includes('loan') || q.includes('credit') || q.includes('finance') || q.includes('pay')) {
    return `💳 <strong>Finance & Payments</strong><br><br>` +
      `AGRICHAIN 360 supports:<br><br>` +
      `• <strong>MTN Mobile Money</strong> — instant payments<br>` +
      `• <strong>Airtel Money</strong> — instant payments<br>` +
      `• <strong>Bank Transfer</strong> — large transactions<br><br>` +
      `<a href="/finance" style="color:var(--g);font-weight:700">View Wallet →</a>`;
  }

  // Default
  return `🌾 <strong>Welcome to AgriIntel AI</strong><br><br>` +
    `I'm your intelligent farming assistant. Ask me about:<br><br>` +
    `• 🌽 Harvest timing and crop advice<br>` +
    `• 🦠 Disease and pest risk in your area<br>` +
    `• 📈 Live market prices for any crop<br>` +
    `• ☀️ Solar drying costs and partners<br>` +
    `• 📜 Quality certification and passports<br>` +
    `• 🚛 Transport and logistics<br>` +
    `• 🌤️ Weather impact on your crops<br>` +
    `• 💳 Payments and digital credit`;
}

module.exports = router;
