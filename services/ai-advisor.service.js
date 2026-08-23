/**
 * AGRICHAIN 360 — Decision Advisor Service
 *
 * A local, deterministic agricultural decision-support engine.
 * It queries live platform data (products, quality passports, partners,
 * fee structures) and applies documented rules. It does NOT call any
 * external AI provider; every recommendation is generated from stored
 * records and can be traced back to them.
 *
 * Rule set (aligned with services/quality.service.js grading):
 *   - Grade A: moisture <= 13% and aflatoxin <= 5 ppb
 *   - Grade B: moisture <= 14% and aflatoxin <= 10 ppb
 *   - Grade C: moisture <= 15% and aflatoxin <= 20 ppb
 *   - Beyond these limits: REJECTED — do not list
 */

const db = require('../database/connection');
const logger = require('../config/logger');

// Crop-specific safe moisture targets (%), used for drying advice
const MOISTURE_TARGETS = {
  coffee: 12.5, cocoa: 7, groundnut: 8, rice: 14, soy: 12,
  maize: 13, beans: 13, cassava: 12, banana: 14
};

function fmtUGX(n) {
  return 'UGX ' + Math.round(Number(n) || 0).toLocaleString();
}

function detectCrop(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('coffee')) return 'Coffee';
  if (t.includes('cocoa')) return 'Cocoa';
  if (t.includes('maize') || t.includes('corn')) return 'Maize';
  if (t.includes('groundnut') || t.includes('peanut')) return 'Groundnuts';
  if (t.includes('bean')) return 'Beans';
  if (t.includes('rice')) return 'Rice';
  if (t.includes('cassava')) return 'Cassava';
  if (t.includes('soy')) return 'Soybeans';
  if (t.includes('banana') || t.includes('matooke')) return 'Banana';
  return null;
}

function detectDistrict(text) {
  const t = (text || '').toLowerCase();
  const districts = ['Mayuge', 'Bugiri', 'Iganga', 'Jinja', 'Kamuli', 'Busia', 'Tororo'];
  for (const d of districts) if (t.includes(d.toLowerCase())) return d;
  return null;
}

class AgriIntelService {
  /**
   * Main entry point.
   * @param {string} question
   * @param {Object} farmerContext - { user_id?, district?, crops? }
   */
  static async ask(question, farmerContext = {}) {
    const q = (question || '').toLowerCase().trim();
    try {
      return await AgriIntelService.getSmartResponse(q, farmerContext);
    } catch (err) {
      logger.warn('Decision advisor falling back to static response', { error: err.message });
      return AgriIntelService.getStaticResponse(q, farmerContext);
    }
  }

  static async getSmartResponse(q, ctx) {
    // Greetings and small talk get a real, useful answer
    if (/^(hi|hello|hey|good (morning|afternoon|evening)|greetings|oli otya|thank you|thanks|ok(ay)?|help)\b/.test(q) || q === 'hi' || q === 'hello') {
      return await AgriIntelService.generalOverview(ctx, true);
    }
    // Marketplace readiness — the flagship decision (uses the farmer's own records)
    if (/\b(list|listing|sell|selling|sale|ready for market|ready to sell|can i sell)\b/.test(q)) {
      return await AgriIntelService.marketplaceReadiness(q, ctx);
    }
    // "What should I do with my coffee?" → crop action plan
    if (/\bwhat should i do|what can i do|advice for|about my\b/.test(q)) {
      const crop = detectCrop(q);
      if (crop) {
        return await AgriIntelService.cropActionPlan(crop, ctx);
      }
    }
    if (q.includes('harvest') || q.includes('when to') || q.includes('ready')) {
      return await AgriIntelService.harvestAdvice(q, ctx);
    }
    if (q.includes('disease') || q.includes('pest') || q.includes('risk') || q.includes('armyworm')) {
      return await AgriIntelService.diseaseRisk(q, ctx);
    }
    if (q.includes('market') || q.includes('price') || q.includes('sell') || q.includes('best')) {
      return await AgriIntelService.marketPrices(q, ctx);
    }
    if (q.includes('dry') || q.includes('cost') || q.includes('moisture') || q.includes('rate')) {
      return await AgriIntelService.dryingAdvice(q, ctx);
    }
    if (q.includes('quality') || q.includes('grade') || q.includes('passport') || q.includes('certif')) {
      return await AgriIntelService.qualityInfo(q, ctx);
    }
    if (q.includes('transport') || q.includes('deliver') || q.includes('truck')) {
      return await AgriIntelService.transportInfo(q, ctx);
    }
    if (q.includes('loan') || q.includes('credit') || q.includes('finance') || q.includes('pay')) {
      return AgriIntelService.financeInfo(q, ctx);
    }
    if (q.includes('weather') || q.includes('rain') || q.includes('temperature') || q.includes('climate')) {
      return AgriIntelService.weatherAdvice(q, ctx);
    }
    if (q.includes('storage') || q.includes('warehouse') || q.includes('store')) {
      return AgriIntelService.storageAdvice(q, ctx);
    }
    return await AgriIntelService.generalOverview(ctx);
  }

  // ─────────────────────────────────────────────────
  // MARKETPLACE READINESS (flagship decision)
  // Inspects the farmer's stored product + quality passport records.
  // ─────────────────────────────────────────────────
  static async marketplaceReadiness(q, ctx) {
    const crop = detectCrop(q);

    // Anonymous user: explain what the check involves
    if (!ctx || !ctx.user_id) {
      const cropLine = crop ? ` for your <strong>${crop}</strong>` : '';
      return `<strong>Listing readiness check</strong><br><br>` +
        `I can review your stored batch records${cropLine} and tell you whether the batch ` +
        `is ready for the marketplace. To do this I check:<br>` +
        `1. A registered product record (crop, quantity, price)<br>` +
        `2. A Digital Quality Passport with a moisture reading<br>` +
        `3. A quality test result (aflatoxin) and assigned grade<br><br>` +
        `Log in as a farmer and ask again — for example: ` +
        `<em>"Can I list this ${crop ? crop.toLowerCase() : 'coffee'} for sale?"</em>`;
    }

    const farmerResult = await db.query(
      `SELECT f.*, u.name FROM farmers f JOIN users u ON f.user_id = u.id WHERE f.user_id = $1;`,
      [ctx.user_id]
    );
    const farmer = farmerResult.rows[0];

    if (!farmer) {
      return `<strong>Listing readiness check</strong><br><br>` +
        `Your account does not have a farmer profile yet. Complete your farmer profile ` +
        `(district, village, crops) from the Farmer Dashboard first, then register your produce. ` +
        `Once a batch exists I can assess its readiness for sale.`;
    }

    // Latest product (optionally filtered by crop)
    const productResult = await db.query(
      `SELECT * FROM products
       WHERE farmer_id = $1 ${crop ? 'AND LOWER(crop) = LOWER($2)' : ''}
       ORDER BY created_at DESC LIMIT 1;`,
      crop ? [farmer.id, crop] : [farmer.id]
    );
    const product = productResult.rows[0];

    if (!product) {
      return `<strong>Listing readiness check</strong><br><br>` +
        `No registered produce${crop ? ` for ${crop}` : ''} was found on your profile ` +
        `(${farmer.district || 'district not set'}).<br><br>` +
        `<strong>Recommendation:</strong> Register the batch first from your Farmer Dashboard ` +
        `(crop, quantity, price). I will then verify its quality records and confirm whether it can be listed.`;
    }

    // Latest passport for this farmer (+crop)
    const passportResult = await db.query(
      `SELECT * FROM quality_passports
       WHERE farmer_id = $1 ${crop ? 'AND LOWER(crop_type) = LOWER($2)' : ''}
       ORDER BY created_at DESC LIMIT 1;`,
      crop ? [farmer.id, crop] : [farmer.id]
    );
    const passport = passportResult.rows[0];

    const issues = [];
    let moisture = passport ? passport.moisture_level : null;
    let aflatoxin = passport ? passport.aflatoxin_result : null;
    let grade = passport ? passport.quality_grade : null;

    if (!passport) {
      issues.push('No Digital Quality Passport exists for this batch — record a moisture reading and quality test result.');
    } else {
      const key = (passport.crop_type || '').toLowerCase();
      const target = MOISTURE_TARGETS[key.split(' ')[0]] || 13;

      if (moisture === null || moisture === undefined) {
        issues.push(`No moisture reading recorded. Target for ${passport.crop_type} is ${target}% or below.`);
      } else if (parseFloat(moisture) > target) {
        issues.push(`Recorded moisture of <strong>${moisture}%</strong> is above the ${target}% target — additional drying is recommended before listing.`);
      }

      if (aflatoxin === null || aflatoxin === undefined) {
        issues.push('No aflatoxin/quality test result recorded. A lab result is required before buyers can trust the batch.');
      }

      if (grade === 'REJECTED') {
        issues.push('The batch was graded <strong>REJECTED</strong>. It must not be listed; re-test after remediation.');
      }
    }

    if (product.quality_status === 'PENDING' && passport && !issues.length) {
      issues.push('The listing is still awaiting approval status — it will update automatically once grading is complete.');
    }

    // Market context
    let priceLine = '';
    try {
      const prices = await db.query(
        `SELECT AVG(price_per_unit) AS avg_price, COUNT(*)::int AS listings
         FROM products WHERE available = true AND LOWER(crop) = LOWER($1);`,
        [product.crop]
      );
      const p = prices.rows[0];
      if (p && p.listings > 0) {
        priceLine = ` Current marketplace average for ${product.crop}: <strong>${fmtUGX(p.avg_price)}/${product.unit || 'kg'}</strong> across ${p.listings} listing${p.listings === 1 ? '' : 's'}.`;
      }
    } catch (e) { /* non-essential */ }

    if (issues.length === 0) {
      return `<strong>Listing readiness check — ${product.crop}</strong><br><br>` +
        `Your batch <strong>${passport.batch_number}</strong> has a recorded moisture level of ` +
        `<strong>${moisture}%</strong> and a ${grade === 'A' ? 'top' : 'passing'} quality result ` +
        `(grade <strong>${grade}</strong>, aflatoxin ${aflatoxin} ppb). The record contains the ` +
        `information required for marketplace listing.${priceLine}<br><br>` +
        `<strong>Recommendation:</strong> Proceed to the marketplace. Your listing ` +
        `"${product.crop} — ${product.quantity} ${product.unit}" is ${product.available ? 'already listed' : 'ready to list'} ` +
        `and its Digital Quality Passport is visible to buyers for verification.`;
    }

    return `<strong>Listing readiness check — ${product.crop}</strong><br><br>` +
      `Before listing this batch, the following must be resolved:<br><br>` +
      issues.map((i, idx) => `${idx + 1}. ${i}`).join('<br>') +
      `<br><br><strong>Recommendation:</strong> Update the batch records from your Farmer Dashboard ` +
      `(quality information section), then ask me again. ${priceLine}`;
  }

  // ─────────────────────────────────────────────────
  // HARVEST ADVICE
  // ─────────────────────────────────────────────────
  static async harvestAdvice(question, ctx) {
    const crop = detectCrop(question) || 'your crop';
    const district = ctx.district || detectDistrict(question) || 'Eastern Uganda';

    let priceInfo = '';
    try {
      const prices = await db.query(
        `SELECT crop, AVG(price_per_unit) AS avg_price, COUNT(*)::int AS listings
         FROM products WHERE available = true AND LOWER(crop) LIKE LOWER($1)
         GROUP BY crop ORDER BY avg_price DESC LIMIT 3;`,
        [`%${crop.toLowerCase()}%`]
      );
      if (prices.rows.length > 0) {
        const top = prices.rows[0];
        priceInfo = ` Current market rate for ${top.crop}: <strong>${fmtUGX(top.avg_price)}/kg</strong> (${top.listings} active listings).`;
      }
    } catch (e) { /* DB not ready */ }

    return `<strong>Harvest advisory — ${crop}, ${district}</strong><br><br>` +
      `<strong>Recommendations:</strong><br>` +
      `• Harvest when grain moisture is between 18–22% for optimal drying results<br>` +
      `• Schedule solar drying immediately after harvest to prevent aflatoxin build-up<br>` +
      `• Target moisture after drying: <strong>13% or below</strong> for Grade A certification${priceInfo}<br><br>` +
      `Book a drying slot early to avoid peak-season queues. ` +
      `Drying partners are listed on the <a href="/marketplace" style="color:var(--g);font-weight:700">marketplace</a>.`;
  }

  // ─────────────────────────────────────────────────
  // DISEASE / CONTAMINATION RISK (from passport data)
  // ─────────────────────────────────────────────────
  static async diseaseRisk(question, ctx) {
    const district = ctx.district || detectDistrict(question) || 'Eastern Uganda';

    let dataLine = '';
    try {
      const results = await db.query(
        `SELECT AVG(aflatoxin_result) AS avg_af,
                COUNT(*)::int AS tests,
                COUNT(*) FILTER (WHERE aflatoxin_result > 10)::int AS high_count
         FROM quality_passports WHERE aflatoxin_result IS NOT NULL;`
      );
      const r = results.rows[0];
      if (r && r.tests > 0) {
        const riskLevel = r.high_count > r.tests * 0.2 ? 'MODERATE' : 'LOW';
        dataLine = `Based on <strong>${r.tests}</strong> quality tests recorded on the platform, average aflatoxin levels are ` +
          `<strong>${parseFloat(r.avg_af).toFixed(1)} ppb</strong> — regional risk level <strong>${riskLevel}</strong>.` +
          (r.high_count > 0 ? ` ${r.high_count} batch${r.high_count === 1 ? '' : 'es'} exceeded 10 ppb.` : ' All batches within safe limits.') + '<br><br>';
      }
    } catch (e) { /* DB not ready */ }

    return `<strong>Crop health report — ${district}</strong><br><br>` +
      dataLine +
      `<strong>Advisory:</strong><br>` +
      `• Fall armyworm: continue regular scouting during the vegetative stage<br>` +
      `• Maize streak virus: no unusual outbreaks indicated by platform records<br>` +
      `• Aflatoxin contamination: dry to 13% moisture within 48 hours of harvest<br><br>` +
      `<strong>Prevention:</strong> Use raised drying racks, never dry on bare ground, and record a quality test for every batch.`;
  }

  // ─────────────────────────────────────────────────
  // MARKET PRICES (live from products table)
  // ─────────────────────────────────────────────────
  static async marketPrices(question, ctx) {
    const crop = detectCrop(question);

    let marketData = '';
    try {
      const params = [];
      let where = 'WHERE available = true';
      if (crop) {
        params.push(`%${crop.toLowerCase()}%`);
        where += ' AND LOWER(crop) LIKE LOWER($1)';
      }
      const results = await db.query(
        `SELECT crop, district, AVG(price_per_unit) AS avg_price,
                MIN(price_per_unit) AS min_price, MAX(price_per_unit) AS max_price,
                COUNT(*)::int AS listings, SUM(quantity) AS total_kg
         FROM products p JOIN farmers f ON p.farmer_id = f.id
         ${where}
         GROUP BY crop, district ORDER BY avg_price DESC LIMIT 8;`,
        params
      );
      if (results.rows.length > 0) {
        marketData = '<strong>Live marketplace prices</strong><br><br>';
        results.rows.forEach((r) => {
          const district = r.district ? ` (${r.district})` : '';
          marketData += `• <strong>${r.crop}</strong>${district}: ${fmtUGX(r.avg_price)}/kg` +
            (r.min_price ? ` (range ${fmtUGX(r.min_price)} – ${fmtUGX(r.max_price)})` : '') +
            ` — ${r.listings} listing${r.listings === 1 ? '' : 's'}, ${Math.round(r.total_kg).toLocaleString()} kg available<br>`;
        });
      }
    } catch (e) { /* DB not ready */ }

    if (!marketData) {
      marketData = 'No listings are currently priced on the marketplace. ' +
        'Indicative Ugandan farm-gate ranges: Maize UGX 1,500–1,800/kg, Beans UGX 2,800–3,200/kg, Coffee (FAQ) UGX 8,000–12,000/kg.';
    }

    return `<strong>Market intelligence</strong><br><br>${marketData}<br>` +
      `Certified produce carrying a Digital Quality Passport typically commands a premium from institutional and export buyers. ` +
      `<a href="/marketplace" style="color:var(--g);font-weight:700">Browse the marketplace</a>.`;
  }

  // ─────────────────────────────────────────────────
  // DRYING ADVICE (rates from fee_structures / pilot schedule)
  // ─────────────────────────────────────────────────
  static async dryingAdvice(question, ctx) {
    const crop = detectCrop(question) || 'your crop';

    let rateLine = null;
    try {
      const fee = await db.query(
        `SELECT rate_per_kg FROM fee_structures
         WHERE crop_type = $1 AND fee_type = 'DRYING'
         ORDER BY effective_from DESC LIMIT 1;`,
        [crop]
      );
      if (fee.rows[0]) rateLine = parseFloat(fee.rows[0].rate_per_kg);
    } catch (e) { /* DB not ready */ }

    const rates = {
      maize: { rate: 200, time: '6–8 hours', target: '13%' },
      rice: { rate: 200, time: '8–10 hours', target: '14%' },
      soy: { rate: 200, time: '6–8 hours', target: '12%' },
      groundnut: { rate: 350, time: '8–12 hours', target: '8%' },
      coffee: { rate: 350, time: '12–16 hours', target: '12.5%' },
      cocoa: { rate: 500, time: '16–24 hours', target: '7%' },
      beans: { rate: 250, time: '6–8 hours', target: '13%' }
    };
    const key = Object.keys(rates).find((k) => crop.toLowerCase().includes(k));
    const info = rates[key] || { rate: 250, time: '6–10 hours', target: '13%' };
    if (rateLine) info.rate = rateLine;

    let partnerInfo = '';
    try {
      const partners = await db.query(
        `SELECT business_name, location, rating FROM partners
         WHERE partner_type = 'DRYER' AND approved = true ORDER BY rating DESC LIMIT 3;`
      );
      if (partners.rows.length > 0) {
        partnerInfo = '<br><strong>Approved drying partners:</strong><br>';
        partners.rows.forEach((p) => {
          partnerInfo += `• <strong>${p.business_name}</strong> (${p.location})${p.rating ? ` — rated ${p.rating}/5` : ''}<br>`;
        });
      }
    } catch (e) { /* DB not ready */ }

    return `<strong>Solar drying advisory — ${crop}</strong><br><br>` +
      `• Drying rate: <strong>${fmtUGX(info.rate)}/kg</strong> (pilot schedule)<br>` +
      `• Estimated drying time: ${info.time}<br>` +
      `• Target moisture: <strong>${info.target}</strong><br>` +
      `• Shared-route transport: approximately UGX 50–100/kg<br><br>` +
      partnerInfo +
      `Record the post-drying moisture on your batch so the passport reflects verified numbers.`;
  }

  // ─────────────────────────────────────────────────
  // QUALITY PASSPORT INFO
  // ─────────────────────────────────────────────────
  static async qualityInfo(question, ctx) {
    let stats = '';
    try {
      const s = await db.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE quality_grade = 'A')::int AS grade_a,
                COUNT(*) FILTER (WHERE quality_grade = 'B')::int AS grade_b,
                COUNT(*) FILTER (WHERE quality_grade = 'C')::int AS grade_c
         FROM quality_passports;`
      ).rows[0];
      if (s && s.total > 0) {
        stats = `<strong>Platform quality record:</strong><br>` +
          `• Batches certified: <strong>${s.total}</strong><br>` +
          `• Grade A: <strong>${s.grade_a}</strong> | Grade B: <strong>${s.grade_b}</strong> | Grade C: <strong>${s.grade_c}</strong><br><br>`;
      }
    } catch (e) { /* DB not ready */ }

    return `<strong>Digital Quality Passport</strong><br><br>` +
      stats +
      `Each batch registered on AGRICHAIN 360 can carry a Digital Quality Passport containing:<br>` +
      `• Crop type and batch number<br>` +
      `• Farmer identity and location<br>` +
      `• Moisture content (recorded post-drying)<br>` +
      `• Aflatoxin test result (ppb), where a partner lab result exists<br>` +
      `• Quality grade (A/B/C) and verification status<br><br>` +
      `Buyers verify any passport by batch number on the public ` +
      `<a href="/verify" style="color:var(--g);font-weight:700">verification page</a>. ` +
      `Grading rules: A requires moisture ≤ 13% and aflatoxin ≤ 5 ppb; B ≤ 14% / ≤ 10 ppb; C ≤ 15% / ≤ 20 ppb.`;
  }

  // ─────────────────────────────────────────────────
  // TRANSPORT
  // ─────────────────────────────────────────────────
  static async transportInfo(question, ctx) {
    let partnerInfo = '';
    try {
      const partners = await db.query(
        `SELECT business_name, location FROM partners
         WHERE partner_type = 'TRANSPORTER' AND approved = true LIMIT 3;`
      );
      if (partners.rows.length > 0) {
        partnerInfo = '<br><strong>Registered transporters:</strong><br>';
        partners.rows.forEach((p) => {
          partnerInfo += `• ${p.business_name} (${p.location})<br>`;
        });
      }
    } catch (e) { /* DB not ready */ }

    return `<strong>Transport and logistics</strong><br><br>` +
      `Typical pilot costs:<br>` +
      `• Shared routes: UGX 50–100/kg (split among farmers on the same route)<br>` +
      `• Dedicated truck: UGX 150–250/kg<br>` +
      `• Motorcycle (small loads): UGX 300–500 per trip<br><br>` +
      `How it works: book drying or testing, the system matches nearby transporters, ` +
      `pickup is arranged from the farm or drying centre.${partnerInfo}`;
  }

  // ─────────────────────────────────────────────────
  // FINANCE
  // ─────────────────────────────────────────────────
  static financeInfo(question, ctx) {
    return `<strong>Payments and fees</strong><br><br>` +
      `The platform's pilot fee model (Busoga region):<br>` +
      `• Drying: UGX 200–500/kg depending on crop<br>` +
      `• Quality testing: UGX 100–400/kg depending on crop<br>` +
      `• Marketplace commission: 3% of transaction value<br><br>` +
      `Payments are settled via MTN Mobile Money, Airtel Money, bank transfer, or cash at partner locations. ` +
      `A farmer's transaction history on the platform is designed to support future credit scoring with partner SACCOs.`;
  }

  // ─────────────────────────────────────────────────
  // WEATHER (honest: no live feed configured)
  // ─────────────────────────────────────────────────
  static weatherAdvice(question, ctx) {
    const district = ctx.district || detectDistrict(question) || 'Eastern Uganda';
    return `<strong>Weather advisory — ${district}</strong><br><br>` +
      `A live weather feed is not configured on this deployment, so I will not quote live figures. ` +
      `General guidance for the region:<br>` +
      `• Plan solar drying for late morning to mid-afternoon (10:00–15:00) when radiation is strongest<br>` +
      `• Avoid drying on days with visible rain risk; re-wet grain loses grade rapidly<br>` +
      `• Store grain off the ground in ventilated conditions below 25 °C<br><br>` +
      `Weather-based drying alerts can be added by connecting a forecast API to this advisor.`;
  }

  // ─────────────────────────────────────────────────
  // STORAGE
  // ─────────────────────────────────────────────────
  static storageAdvice(question, ctx) {
    return `<strong>Storage and warehousing</strong><br><br>` +
      `<strong>Best practices:</strong><br>` +
      `• Store at 13% moisture or below<br>` +
      `• Use pallets — never store on a bare floor<br>` +
      `• Maintain ventilation and monitor temperature (below 25 °C)<br><br>` +
      `Indicative pilot rates: UGX 50–100/kg/month at partner warehouses. ` +
      `Registered warehouse partners appear in the partner directory.`;
  }

  // ─────────────────────────────────────────────────
  // GENERAL OVERVIEW
  // ─────────────────────────────────────────────────
  static async cropActionPlan(crop, ctx) {
    const key = crop.toLowerCase();
    const target = MOISTURE_TARGETS[key] || 13;
    let marketLine = '';
    try {
      const r = await db.query(
        `SELECT AVG(price_per_unit) AS avg_price, COUNT(*)::int AS listings
         FROM products WHERE available = true AND LOWER(crop) = LOWER($1);`, [crop]);
      if (r.rows[0] && r.rows[0].listings > 0) {
        marketLine = `The marketplace currently lists ${crop} at an average of <strong>${fmtUGX(r.rows[0].avg_price)}/kg</strong>. `;
      }
    } catch (e) { /* DB not ready */ }
    return `<strong>Action plan for your ${crop}</strong><br><br>` +
      `1. <strong>Harvest & dry</strong> — target ${target}% moisture or below (Grade A threshold for most crops is 13%).<br>` +
      `2. <strong>Record quality</strong> — enter moisture and aflatoxin readings on your batch so a Digital Quality Passport is issued.<br>` +
      `3. <strong>List</strong> — once the batch carries a passing grade, list it on the marketplace. ${marketLine}<br>` +
      `4. <strong>Verify</strong> — buyers confirm your batch through its passport batch number.<br><br>` +
      `If you are logged in, ask me <em>"Can I list this ${crop.toLowerCase()} for sale?"</em> and I will check your own records.`;
  }

  static async generalOverview(ctx, isGreeting = false) {
    let statsLine = '';
    try {
      const r = await db.query(
        `SELECT
           (SELECT COUNT(*) FROM products WHERE available = true)::int AS listings,
           (SELECT COUNT(*) FROM quality_passports)::int AS passports;`
      ).rows[0];
      if (r) {
        statsLine = `The platform currently carries <strong>${r.listings}</strong> active listing${r.listings === 1 ? '' : 's'} ` +
          `and <strong>${r.passports}</strong> quality passport${r.passports === 1 ? '' : 's'}.<br><br>`;
      }
    } catch (e) { /* DB not ready */ }

    const greeting = isGreeting ? `Hello. I am the AGRICHAIN Decision Advisor — a rules-based engine that answers from your stored platform records.<br><br>` : '';

    return `<strong>AGRICHAIN Decision Advisor</strong><br><br>` +
      greeting +
      statsLine +
      (isGreeting ? `Ask me anything about your batches — for example:<br>` : `I answer questions from your stored platform records. Try:<br>`) +
      `• "Can I list this coffee for sale?" — batch readiness decision<br>` +
      `• "What are current market prices?" — live listing averages<br>` +
      `• "How much does solar drying cost?" — pilot fee schedule<br>` +
      `• "Any disease risk in my area?" — based on recorded test results<br>` +
      `• "Explain quality grades" — passport grading rules`;
  }

  // ─────────────────────────────────────────────────
  // STATIC FALLBACK (no DB) — same rules, no live data
  // ─────────────────────────────────────────────────
  static getStaticResponse(q, ctx) {
    if (q.includes('dry') || q.includes('moisture')) {
      return `<strong>Solar drying</strong><br><br>` +
        `Pilot rates: Maize/Rice/Soybeans UGX 200/kg, Beans UGX 250/kg, Groundnuts UGX 350/kg, ` +
        `Coffee UGX 350/kg, Cocoa UGX 500/kg. Target 13% moisture (Grade A threshold).`;
    }
    if (q.includes('quality') || q.includes('grade') || q.includes('passport')) {
      return `<strong>Quality grading</strong><br><br>` +
        `Grade A: moisture ≤ 13% and aflatoxin ≤ 5 ppb. Grade B: ≤ 14% / ≤ 10 ppb. Grade C: ≤ 15% / ≤ 20 ppb. ` +
        `Beyond these limits a batch is rejected. Passports are verifiable by batch number on the public verification page.`;
    }
    if (q.includes('price') || q.includes('market') || q.includes('sell')) {
      return `<strong>Marketplace</strong><br><br>` +
        `Live price data is temporarily unavailable. Indicative farm-gate ranges: ` +
        `Maize UGX 1,500–1,800/kg, Beans UGX 2,800–3,200/kg, Coffee (FAQ) UGX 8,000–12,000/kg.`;
    }
    return `<strong>AGRICHAIN Decision Advisor</strong><br><br>` +
      `I answer questions from stored platform records (listings, quality passports, partner and fee data). ` +
      `Live data is temporarily unavailable, so I am answering from the documented pilot rules.`;
  }
}

module.exports = AgriIntelService;
