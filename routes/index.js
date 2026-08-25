const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../database/connection');
const { requireWebAuth } = require('../middleware/webAuth');
const SubscriptionGating = require('../services/subscription-gating.service');
const { authLimiter, registerLimiter, recordLoginFailure, clearLoginAttempts } = require('../config/rateLimiter');
const ussdRouter = require('./ussd');

const Farmer = require('../models/Farmer');
const Product = require('../models/Product');
const QualityPassport = require('../models/QualityPassport');
const QualityService = require('../services/quality.service');
const OrderService = require('../services/order.service');

// ─────────────────────────────────────────────────────
// PUBLIC PAGES
// ─────────────────────────────────────────────────────

// Landing page
router.get('/', (req, res) => {
  res.render('bootstrapLanding', { user: req.session ? req.session.user : null });
});

// Legacy landing → redirect
router.get('/home', (req, res) => res.redirect('/'));

// Privacy Policy (public)
router.get('/privacy', (req, res) => {
  res.render('layout', { title: 'Privacy Policy — AGRICHAIN 360', page: 'privacy', data: {}, body: 'legal' });
});

// Terms & Conditions (public)
router.get('/terms', (req, res) => {
  res.render('layout', { title: 'Terms & Conditions — AGRICHAIN 360', page: 'terms', data: {}, body: 'legal' });
});

// Data & Security (public)
router.get('/security', (req, res) => {
  res.render('layout', { title: 'Data & Security — AGRICHAIN 360', page: 'security', data: {}, body: 'legal' });
});

// Get the App — public installation page (no account required)
router.get('/get-app', (req, res) => {
  res.render('layout', {
    title: 'Get the App — AGRICHAIN 360',
    page: 'get-app',
    data: {},
    body: 'getApp',
  });
});

// Role selection page
router.get('/roles', (req, res) => {
  res.render('layout', {
    title: 'Join AGRICHAIN 360',
    page: 'roles',
    data: {},
    body: 'roles',
  });
});

// Pricing (pilot fee schedule)
router.get('/pricing', (req, res) => {
  res.render('layout', {
    title: 'Pricing & Fees — AGRICHAIN 360',
    page: 'pricing',
    data: {},
    body: 'pricing',
  });
});

// AI Decision Advisor
router.get('/ai-advisor', (req, res) => {
  res.render('layout', {
    title: 'AI Decision Advisor — AGRICHAIN 360',
    page: 'ai-advisor',
    data: { user: req.session ? req.session.user : null },
    body: 'aiAdvisor',
  });
});

// ─────────────────────────────────────────────────────
// MARKETPLACE (public)
// ─────────────────────────────────────────────────────

router.get('/marketplace', async (req, res, next) => {
  try {
    const { q, crop, district } = req.query;
    const values = [];
    const where = ['p.available = true'];
    let n = 1;

    if (q) {
      where.push(`(LOWER(p.crop) LIKE LOWER($${n}) OR LOWER(f.district) LIKE LOWER($${n}) OR LOWER(u.name) LIKE LOWER($${n}))`);
      values.push(`%${q}%`);
      n++;
    }
    if (crop) {
      where.push(`LOWER(p.crop) = LOWER($${n})`);
      values.push(crop);
      n++;
    }
    if (district) {
      where.push(`LOWER(f.district) = LOWER($${n})`);
      values.push(district);
      n++;
    }

    const result = await db.query(
      `SELECT p.*, f.district, f.village, u.name AS farmer_name,
              qp.batch_number, qp.quality_grade, qp.moisture_level, qp.aflatoxin_result,
              qp.record_source AS passport_source
       FROM products p
       JOIN farmers f ON p.farmer_id = f.id
       JOIN users u ON f.user_id = u.id
       LEFT JOIN LATERAL (
         SELECT * FROM quality_passports q
         WHERE q.farmer_id = p.farmer_id AND LOWER(q.crop_type) = LOWER(p.crop)
         ORDER BY q.created_at DESC LIMIT 1
       ) qp ON true
       WHERE ${where.join(' AND ')}
       ORDER BY p.created_at DESC
       LIMIT 100;`,
      values
    );

    // Distinct filter options
    const crops = await db.query(`SELECT DISTINCT crop FROM products WHERE available = true ORDER BY crop;`);
    const districts = await db.query(`SELECT DISTINCT f.district FROM products p JOIN farmers f ON p.farmer_id = f.id WHERE p.available = true AND f.district IS NOT NULL ORDER BY f.district;`);

    // Summary stats (real) — failures won't block the page
    let stats;
    try {
      stats = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM products WHERE available = true)::int AS listings,
        (SELECT COALESCE(SUM(quantity), 0) FROM products WHERE available = true)::int AS total_kg,
        (SELECT COUNT(*) FROM quality_passports WHERE quality_grade IN ('A','B'))::int AS certified
    `);
    } catch (e) { stats = { rows: [null] }; }

    // Gate farmer identity for anonymous visitors
    const mktUser = req.session ? req.session.user : null;
    const products = mktUser ? result.rows : result.rows.map(p => SubscriptionGating.maskForPublic(p));

    res.render('layout', {
      title: 'Marketplace — AGRICHAIN 360',
      page: 'marketplace',
      user: mktUser,
      data: {
        products,
        crops: crops.rows.map((r) => r.crop),
        districts: districts.rows.map((r) => r.district),
        stats: stats.rows[0],
        query: q || '',
        cropFilter: crop || '',
        districtFilter: district || '',
        user: req.session ? req.session.user : null
      },
      body: 'marketplace',
    });
  } catch (err) {
    next(err);
  }
});

// Product detail (public) + order form for buyers
router.get('/product/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).render('layout', {
        title: 'Not Found — AGRICHAIN 360',
        page: '404', data: {}, body: 'errorPage'
      });
    }
    const passport = await QualityPassport.findLatestByFarmerAndCrop(product.farmer_id, product.crop);
    res.render('layout', {
      title: `${product.crop} — AGRICHAIN 360 Marketplace`,
      page: 'productDetail',
      data: { product, passport, user: req.session ? req.session.user : null },
      body: 'productDetail',
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────
// QUALITY PASSPORT VERIFICATION (public)
// ─────────────────────────────────────────────────────

router.get('/verify', async (req, res) => {
  // Smart QR landing: /verify?batchId=AGR-...&action=view (encoded in every QR code)
  const batchId = req.query.batchId ? String(req.query.batchId).trim().slice(0, 60) : '';
  let scannedPassport = null, scannedSignatureValid = false;
  if (batchId) {
    try {
      scannedPassport = await QualityService.verifyPassport(batchId);
      if (scannedPassport && scannedPassport.passport_signature) {
        const { verifyPassportSignature } = require('../services/crypto.util');
        scannedSignatureValid = verifyPassportSignature(scannedPassport).valid;
      }
    } catch (e) { scannedPassport = null; }
  }
  res.render('layout', {
    title: batchId ? `Batch ${batchId} — AGRICHAIN 360` : 'Verify a Quality Passport — AGRICHAIN 360',
    page: 'verify',
    data: {
      batch: req.query.batch || '',
      batchId, action: req.query.action || 'view',
      scannedPassport, scannedSignatureValid,
      user: req.session ? req.session.user : null
    },
    body: 'verifyPassport',
  });
});

router.post('/verify', (req, res) => {
  const batch = (req.body.batch || '').trim();
  if (!batch) return res.redirect('/verify');
  res.redirect(`/verify?batchId=${encodeURIComponent(batch)}&action=view`);
});

router.get('/passport/:batchId', async (req, res) => {
  try {
    const passport = await QualityService.verifyPassport(req.params.batchId);
    let signature = null;
    if (passport) {
      try {
        const { verifyPassportSignature } = require('../services/crypto.util');
        signature = verifyPassportSignature(passport);
      } catch (e) { signature = null; }
    }
    res.render('layout', {
      title: `Digital Quality Passport — ${req.params.batchId}`,
      page: 'passport',
      data: { batchId: req.params.batchId, passport, signature, user: req.session ? req.session.user : null },
      body: 'passportVerify',
    });
  } catch (err) {
    res.render('layout', {
      title: 'Passport Verification',
      page: 'passport',
      data: { batchId: req.params.batchId, passport: null, error: err.message },
      body: 'passportVerify',
    });
  }
});

// ─────────────────────────────────────────────────────
// AUTHENTICATION (web sessions, database-backed only)
// ─────────────────────────────────────────────────────

router.get('/login', (req, res) => {
  if (req.session && req.session.user) return res.redirect('/login-home');
  res.render('layout', {
    title: 'Login — AGRICHAIN 360',
    page: 'login',
    data: { redirect: req.query.redirect || '', error: req.query.error || '', showDemo: process.env.SHOW_DEMO_CREDENTIALS !== 'false' },
    body: 'login',
  });
});

// Redirect a logged-in user to their role dashboard
router.get('/login-home', (req, res) => {
  const role = (req.session.user.role || '').toUpperCase();
  if (role === 'FARMER') return res.redirect('/farmer-dashboard');
  if (role === 'BUYER') return res.redirect('/buyer-dashboard');
  if (role === 'ADMIN') return res.redirect('/admin-dashboard');
  res.redirect('/marketplace');
});

router.post('/login', authLimiter, async (req, res) => {
  const phone = (req.body.phone || '').trim();
  const password = (req.body.password || '').trim();
  const redirect = req.body.redirect || '';

  if (!phone || phone.replace(/\D/g, '').length < 8) {
    return res.redirect('/login?error=' + encodeURIComponent('Enter a valid phone number'));
  }
  if (!password) {
    return res.redirect('/login?error=' + encodeURIComponent('Enter your password'));
  }

  try {
    const AuthService = require('../services/auth.service');
    const result = await AuthService.loginUser(phone, password, req);
    const user = result.user;
    if (req._loginAttemptKey) clearLoginAttempts(req._loginAttemptKey);

    req.session.user = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      token: result.token,
      dbConnected: true
    };

    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
      return res.redirect(redirect);
    }

    const role = (user.role || '').toUpperCase();
    if (role === 'FARMER') return res.redirect('/farmer-dashboard');
    if (role === 'BUYER') return res.redirect('/buyer-dashboard');
    if (role === 'ADMIN') return res.redirect('/admin-dashboard');
    return res.redirect('/marketplace');
  } catch (err) {
    if (req._loginAttemptKey && req._loginAttemptRecord) {
      recordLoginFailure(req._loginAttemptKey, req._loginAttemptRecord);
    }
    const msg = (err && err.message) || 'Login failed';
    return res.redirect('/login?error=' + encodeURIComponent(msg));
  }
});

router.get('/signup', (req, res) => {
  res.render('layout', {
    title: 'Create Account — AGRICHAIN 360',
    page: 'signup',
    data: {
      error: req.query.error || '',
      selectedRole: req.query.role || '',
      claimBatch: (req.query.claimBatch || '').trim().slice(0, 60)
    },
    body: 'signup',
  });
});

const ROLE_MAP = {
  farmer: 'FARMER', buyer: 'BUYER', partner: 'PARTNER',
  village_agent: 'PARTNER', input_dealer: 'PARTNER', lab: 'PARTNER', quality_officer: 'PARTNER',
  cooperative: 'BUYER', finance: 'BUYER', ngo: 'BUYER', researcher: 'BUYER',
  field_officer: 'FARMER'
};

router.post('/signup', registerLimiter, async (req, res) => {
  const body = req.body || {};
  const roleKey = (body.role || 'farmer').toLowerCase();
  const backendRole = ROLE_MAP[roleKey] || 'FARMER';

  if (roleKey === 'admin') {
    return res.redirect('/signup?error=' + encodeURIComponent('Administrator accounts are provisioned by the platform team.'));
  }

  const name = (body.name || body.org_name || '').trim();
  const phone = (body.phone || '').trim();
  const email = (body.email || '').trim();
  const password = body.password || '';

  if (!name || name.length < 2) {
    return res.redirect('/signup?error=' + encodeURIComponent('Enter your full name or organisation name'));
  }
  if (!phone || phone.replace(/\D/g, '').length < 8) {
    return res.redirect('/signup?error=' + encodeURIComponent('Enter a valid phone number'));
  }
  if (!password || password.length < 6) {
    return res.redirect('/signup?error=' + encodeURIComponent('Password must be at least 6 characters'));
  }

  try {
    const AuthService = require('../services/auth.service');
    const result = await AuthService.registerUser({
      name, phone, email: email || null, password, role: backendRole
    });
    const userId = result.user.id;

    // Role-specific profiles
    if (backendRole === 'FARMER') {
      try {
        const cropsArray = Array.isArray(body.crops) ? body.crops : (body.crops ? [body.crops] : []);
        await Farmer.create({
          user_id: userId,
          district: body.district || null,
          village: body.village || null,
          crops: cropsArray,
          farm_size: body.farm_size ? parseFloat(body.farm_size) : null,
          national_id: body.national_id || null
        });
      } catch (e) {
        req.app.locals.logger && req.app.locals.logger.warn('Farmer profile creation issue', { error: e.message });
      }
    }

    if (backendRole === 'BUYER') {
      try {
        const Buyer = require('../models/Buyer');
        await Buyer.createProfile({
          user_id: userId,
          company_name: body.org_name || name,
          business_type: roleKey === 'cooperative' ? 'COOPERATIVE' : (body.business_type || 'OTHER'),
          registration_number: body.registration_number || null,
          city: body.city || null,
          website: body.website || body.org_website || null
        });
      } catch (e) { /* profile optional */ }
      try { await SubscriptionGating.grantTrial(userId); } catch (e) { /* non-fatal */ }
    }

    if (backendRole === 'PARTNER') {
      try {
        const Partner = require('../models/Partner');
        await Partner.create({
          user_id: userId,
          partner_type: (body.partner_type || 'DRYER').toUpperCase(),
          business_name: body.business_name || name,
          location: body.partner_location || body.district || null,
          services: [],
          pricing: null
        });
      } catch (e) { /* profile optional */ }
    }

    req.session.user = {
      id: userId,
      phone,
      name,
      email,
      role: backendRole,
      token: result.token,
      dbConnected: true,
      createdAt: new Date().toISOString()
    };

    // Batch claim flow (from a scanned QR code): send the new user straight to the batch
    if (body.claimBatch) {
      return res.redirect(`/verify?batchId=${encodeURIComponent(body.claimBatch)}&action=view`);
    }
    if (backendRole === 'FARMER') return res.redirect('/farmer-dashboard');
    if (backendRole === 'BUYER') return res.redirect('/buyer-dashboard');
    return res.redirect('/marketplace');
  } catch (err) {
    const q = err.message || 'Registration failed';
    const claim = body.claimBatch ? `&claimBatch=${encodeURIComponent(body.claimBatch)}` : '';
    return res.redirect('/signup?error=' + encodeURIComponent(q) + claim);
  }
});

// Profile & Account settings
router.get('/profile-settings', requireWebAuth(), async (req, res) => {
  try {
    const profile = await require('../services/auth.service').getProfile(req.session.user.id);
    res.render('layout', {
      title: 'Profile & Account — AGRICHAIN 360',
      page: 'profile-settings',
      data: { user: req.session.user, profile: profile, error: req.query.error || '' },
      body: 'profileSettings',
    });
  } catch (err) { next(err); }
});

// User: delete own account (requires password confirmation)
router.post('/account/delete', requireWebAuth(), async (req, res) => {
  const password = req.body.password || '';
  try {
    const User = require('../models/User');
    const user = await User.findByPhone(req.session.user.phone);
    if (!user || !(await User.verifyPassword(password, user.password_hash))) {
      return res.redirect('/profile?error=' + encodeURIComponent('Incorrect password. Account not deleted.'));
    }
    await db.query('DELETE FROM users WHERE id = $1;', [req.session.user.id]);
    req.session.destroy(() => {
      res.redirect('/?deleted=1');
    });
  } catch (err) {
    res.redirect('/profile?error=' + encodeURIComponent('Could not delete account. ' + err.message));
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// ─────────────────────────────────────────────────────
// FARMER DASHBOARD (session + FARMER role)
// ─────────────────────────────────────────────────────

router.get('/farmer-dashboard', requireWebAuth(['FARMER']), async (req, res, next) => {
  try {
    const farmer = await Farmer.findByUserId(req.session.user.id);

    // Ensure a farmer profile exists (created on first visit after signup without profile)
    let farmerProfile = farmer;
    if (!farmerProfile) {
      farmerProfile = await Farmer.create({
        user_id: req.session.user.id, district: null, village: null,
        crops: [], farm_size: null, national_id: null
      });
    }

    const [products, passports, orders] = await Promise.all([
      Product.findByFarmerId(farmerProfile.id),
      QualityPassport.findByFarmerId(farmerProfile.id),
      OrderService.getOrdersForFarmer(farmerProfile.id)
    ]);

    // AI readiness recommendation for the latest batch
    let aiRecommendation = null;
    if (products.length > 0) {
      try {
        const AgriIntelService = require('../services/ai-advisor.service');
        aiRecommendation = await AgriIntelService.ask(
          `Can I list this ${products[0].crop} for sale?`,
          { user_id: req.session.user.id, district: farmerProfile.district }
        );
      } catch (e) { aiRecommendation = null; }
    }

    const earnings = orders
      .filter((o) => o.status === 'completed')
      .reduce((s, o) => s + parseFloat(o.total_amount - o.commission), 0);

    res.render('layout', {
      title: 'Farmer Dashboard — AGRICHAIN 360',
      page: 'farmer-dashboard',
      data: {
        user: req.session.user,
        farmer: farmerProfile,
        products,
        passports,
        orders,
        aiRecommendation,
        earnings,
        success: req.query.success || '',
        error: req.query.error || ''
      },
      body: 'farmerDashboard',
    });
  } catch (err) {
    next(err);
  }
});

// Register produce
router.post('/farmer/produce', requireWebAuth(['FARMER']), async (req, res, next) => {
  try {
    const farmer = await Farmer.findByUserId(req.session.user.id);
    if (!farmer) {
      return res.redirect('/farmer-dashboard?error=' + encodeURIComponent('Farmer profile missing. Please contact support.'));
    }

    const crop = (req.body.crop || '').trim();
    const quantity = parseFloat(req.body.quantity);
    const price = parseFloat(req.body.price_per_unit);
    const unit = (req.body.unit || 'kg').trim() || 'kg';

    if (!crop || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price <= 0) {
      return res.redirect('/farmer-dashboard?error=' + encodeURIComponent('Provide crop, quantity and price per unit.'));
    }

    // Existing latest passport for this crop decides initial quality status
    const passport = await QualityPassport.findLatestByFarmerAndCrop(farmer.id, crop);
    let qualityStatus = 'PENDING';
    if (passport && passport.quality_grade === 'A' || passport && passport.quality_grade === 'B') qualityStatus = 'APPROVED';
    if (passport && passport.quality_grade === 'REJECTED') qualityStatus = 'REJECTED';

    await Product.create({
      farmer_id: farmer.id,
      crop,
      quantity,
      unit,
      price_per_unit: price,
      quality_status: qualityStatus
    });

    res.redirect('/farmer-dashboard?success=' + encodeURIComponent(`Listing registered: ${quantity} ${unit} of ${crop}.`));
  } catch (err) {
    next(err);
  }
});

// Record quality information (creates/updates the batch passport)
router.post('/farmer/quality', requireWebAuth(['FARMER']), async (req, res, next) => {
  try {
    const farmer = await Farmer.findByUserId(req.session.user.id);
    if (!farmer) {
      return res.redirect('/farmer-dashboard?error=' + encodeURIComponent('Farmer profile missing.'));
    }

    const productId = parseInt(req.body.product_id);
    const moisture = req.body.moisture_level === '' ? null : parseFloat(req.body.moisture_level);
    const aflatoxin = req.body.aflatoxin_result === '' ? null : parseFloat(req.body.aflatoxin_result);
    const dryingCenter = (req.body.drying_center || '').trim() || null;

    const product = (await Product.findByFarmerId(farmer.id)).find((p) => p.id === productId);
    if (!product) {
      return res.redirect('/farmer-dashboard?error=' + encodeURIComponent('Select one of your registered batches.'));
    }

    // Reuse the latest passport for this farmer+crop, otherwise issue a new one
    const existing = await QualityPassport.findLatestByFarmerAndCrop(farmer.id, product.crop);
    if (existing) {
      await QualityService.updatePassportResults(existing.id, moisture, aflatoxin);
      await db.query('UPDATE quality_passports SET drying_center = $1 WHERE id = $2;', [dryingCenter, existing.id]);
    } else {
      await QualityService.createPassport({
        farmer_id: farmer.id,
        crop_type: product.crop,
        quantity: product.quantity,
        moisture_level: moisture,
        aflatoxin_result: aflatoxin,
        drying_center: dryingCenter,
        record_source: 'user'
      });
    }

    const grade = QualityService.determineGrade(moisture, aflatoxin);
    res.redirect('/farmer-dashboard?success=' + encodeURIComponent(
      `Quality information recorded for ${product.crop}. Determined grade: ${grade}.`));
  } catch (err) {
    next(err);
  }
});

// My listings + availability toggle
router.get('/my-listings', requireWebAuth(['FARMER']), async (req, res, next) => {
  try {
    const farmer = await Farmer.findByUserId(req.session.user.id);
    const products = farmer ? await Product.findByFarmerId(farmer.id) : [];
    const withPassports = [];
    for (const p of products) {
      const passport = await QualityPassport.findLatestByFarmerAndCrop(farmer.id, p.crop);
      withPassports.push({ ...p, passport });
    }
    res.render('layout', {
      title: 'My Listings — AGRICHAIN 360',
      page: 'my-listings',
      data: { user: req.session.user, products: withPassports, success: req.query.success || '', error: req.query.error || '' },
      body: 'myListings',
    });
  } catch (err) {
    next(err);
  }
});

router.post('/my-listings/:id/availability', requireWebAuth(['FARMER']), async (req, res, next) => {
  try {
    const farmer = await Farmer.findByUserId(req.session.user.id);
    const products = farmer ? await Product.findByFarmerId(farmer.id) : [];
    const owns = products.find((p) => p.id === parseInt(req.params.id));
    if (!owns) {
      return res.redirect('/my-listings?error=' + encodeURIComponent('Listing not found.'));
    }
    await Product.updateAvailability(owns.id, !owns.available);
    res.redirect('/my-listings');
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────
// BUYER DASHBOARD + ORDERS
// ─────────────────────────────────────────────────────

router.get('/buyer-dashboard', requireWebAuth(['BUYER']), async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const values = [];
    let where = 'p.available = true';
    if (q) {
      values.push(`%${q}%`);
      where += ` AND (LOWER(p.crop) LIKE LOWER($1) OR LOWER(f.district) LIKE LOWER($1))`;
    }

    const [productsResult, orders] = await Promise.all([
      db.query(
        `SELECT p.*, f.district, u.name AS farmer_name,
                qp.batch_number, qp.quality_grade, qp.moisture_level
         FROM products p
         JOIN farmers f ON p.farmer_id = f.id
         JOIN users u ON f.user_id = u.id
         LEFT JOIN LATERAL (
           SELECT * FROM quality_passports qq
           WHERE qq.farmer_id = p.farmer_id AND LOWER(qq.crop_type) = LOWER(p.crop)
           ORDER BY qq.created_at DESC LIMIT 1
         ) qp ON true
         WHERE ${where}
         ORDER BY p.created_at DESC LIMIT 12;`,
        values
      ),
      OrderService.getOrdersByBuyerUser(req.session.user.id)
    ]);

    let profile = null;
    try {
      const Buyer = require('../models/Buyer');
      profile = await Buyer.findByUserId(req.session.user.id);
    } catch (e) { profile = null; }

    // Subscription/trial status
    let subscription = null;
    try {
      subscription = await require('../services/subscription-gating.service').getAccess(req.session.user.id);
    } catch (e) { subscription = null; }

    res.render('layout', {
      title: 'Buyer Dashboard — AGRICHAIN 360',
      page: 'buyer-dashboard',
      data: {
        user: req.session.user,
        profile,
        products: productsResult.rows,
        orders,
        subscription,
        query: q,
        success: req.query.success || '',
        error: req.query.error || ''
      },
      body: 'buyerDashboard',
    });
  } catch (err) {
    next(err);
  }
});

// Place an order from the product page (web, buyers only)
router.post('/orders', requireWebAuth(['BUYER']), async (req, res, next) => {
  try {
    const productId = parseInt(req.body.product_id);
    const quantity = parseFloat(req.body.quantity);
    const order = await OrderService.createOrder({
      buyer_user_id: req.session.user.id,
      product_id: productId,
      quantity
    });
    res.redirect('/order-history?success=' + encodeURIComponent(
      `Order request placed for ${order.quantity} ${order.product.unit} of ${order.product.crop} (${order.product.farmer_name}). Total ${order.total_amount.toLocaleString()} UGX.`));
  } catch (err) {
    const back = req.body.back || '/marketplace';
    const safeBack = back.startsWith('/') && !back.startsWith('//') ? back : '/marketplace';
    return res.redirect(safeBack + '?error=' + encodeURIComponent(err.message));
  }
});

router.get('/order-history', requireWebAuth(['BUYER']), async (req, res, next) => {
  try {
    const orders = await OrderService.getOrdersByBuyerUser(req.session.user.id);
    res.render('layout', {
      title: 'Order History — AGRICHAIN 360',
      page: 'order-history',
      data: { user: req.session.user, orders, success: req.query.success || '', error: req.query.error || '' },
      body: 'orderHistory',
    });
  } catch (err) {
    next(err);
  }
});

// Cancel a pending order (buyer)
router.post('/orders/:id/cancel', requireWebAuth(['BUYER']), async (req, res, next) => {
  try {
    const dbq = await db.query('SELECT buyer_id, status FROM orders WHERE id = $1;', [req.params.id]);
    const row = dbq.rows[0];
    if (!row || row.buyer_id !== req.session.user.id) {
      return res.redirect('/order-history?error=' + encodeURIComponent('Order not found.'));
    }
    if (row.status !== 'pending') {
      return res.redirect('/order-history?error=' + encodeURIComponent('Only pending orders can be cancelled.'));
    }
    await OrderService.updateStatus(req.params.id, 'cancelled');
    res.redirect('/order-history?success=' + encodeURIComponent('Order cancelled.'));
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────────────

router.get('/admin-dashboard', requireWebAuth(['ADMIN']), async (req, res, next) => {
  try {
    const [users, counts, pendingFarmers, recentOrders, passportStats] = await Promise.all([
      db.query(`SELECT role, COUNT(*)::int AS n FROM users GROUP BY role ORDER BY role;`),
      db.query(`
        SELECT
          (SELECT COUNT(*) FROM users)::int AS users,
          (SELECT COUNT(*) FROM farmers)::int AS farmers,
          (SELECT COUNT(*) FROM buyer_profiles)::int AS buyers,
          (SELECT COUNT(*) FROM partners)::int AS partners,
          (SELECT COUNT(*) FROM products)::int AS products,
          (SELECT COUNT(*) FROM orders)::int AS orders,
          (SELECT COALESCE(SUM(total_amount), 0) FROM orders)::bigint AS order_value
      `),
      db.query(`
        SELECT f.*, u.name, u.phone FROM farmers f JOIN users u ON f.user_id = u.id
        WHERE f.verification_status = 'PENDING' ORDER BY f.created_at DESC LIMIT 10;
      `),
      OrderService.listRecent(10),
      QualityPassport.getStats()
    ]);

    const latestUsers = await db.query(
      `SELECT id, name, phone, role, status, created_at FROM users ORDER BY created_at DESC LIMIT 10;`
    );

    res.render('layout', {
      title: 'Admin Dashboard — AGRICHAIN 360',
      page: 'admin-dashboard',
      data: {
        user: req.session.user,
        roleCounts: users.rows,
        counts: counts.rows[0],
        pendingFarmers: pendingFarmers.rows,
        recentOrders,
        latestUsers: latestUsers.rows,
        passportStats,
        success: req.query.success || ''
      },
      body: 'adminDashboard',
    });
  } catch (err) {
    next(err);
  }
});

// Admin: list all users with search
router.get('/admin/users', requireWebAuth(['ADMIN']), async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const users = await db.query(
      `SELECT u.id, u.name, u.phone, u.role, u.status, u.created_at,
              f.district, f.verification_status
       FROM users u
       LEFT JOIN farmers f ON f.user_id = u.id
       WHERE ($1 = '' OR u.name ILIKE '%' || $1 || '%' OR u.phone ILIKE '%' || $1 || '%')
       ORDER BY u.created_at DESC LIMIT 100;`, [q]);
    res.render('layout', {
      title: 'User Management — AGRICHAIN 360',
      page: 'admin-users',
      data: { user: req.session.user, users: users.rows, query: q, success: req.query.success || '', error: req.query.error || '' },
      body: 'adminUsers',
    });
  } catch (err) { next(err); }
});

// Admin: enable/disable a user account
router.post('/admin/users/:id/status', requireWebAuth(['ADMIN']), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const newStatus = req.body.status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED';
    if (userId === req.session.user.id) {
      return res.redirect('/admin/users?error=' + encodeURIComponent('You cannot suspend your own account.'));
    }
    await db.query('UPDATE users SET status = $1 WHERE id = $2;', [newStatus, userId]);
    res.redirect('/admin/users?success=' + encodeURIComponent(`Account ${newStatus === 'ACTIVE' ? 'reactivated' : 'suspended'}.`));
  } catch (err) {
    res.redirect('/admin/users?error=' + encodeURIComponent(err.message));
  }
});

// Admin: delete a user account (cascade removes profiles, listings, passports)
router.post('/admin/users/:id/delete', requireWebAuth(['ADMIN']), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (userId === req.session.user.id) {
      return res.redirect('/admin/users?error=' + encodeURIComponent('You cannot delete your own admin account.'));
    }
    const u = await db.query('SELECT name, role FROM users WHERE id = $1;', [userId]);
    if (!u.rows[0]) return res.redirect('/admin/users?error=' + encodeURIComponent('User not found.'));
    await db.query('DELETE FROM users WHERE id = $1;', [userId]);
    res.redirect('/admin/users?success=' + encodeURIComponent(`Deleted ${u.rows[0].name} (${u.rows[0].role}) and all associated records.`));
  } catch (err) {
    res.redirect('/admin/users?error=' + encodeURIComponent(err.message));
  }
});

// Admin verifies a farmer
router.post('/admin/verify-farmer/:id', requireWebAuth(['ADMIN']), async (req, res, next) => {
  try {
    await Farmer.updateVerificationStatus(req.params.id, 'VERIFIED');
    res.redirect('/admin-dashboard?success=' + encodeURIComponent('Farmer verified.'));
  } catch (err) {
    next(err);
  }
});

// Live database view (Admin only) — shows judges the real PostgreSQL layer
router.get('/admin-database', requireWebAuth(['ADMIN']), async (req, res, next) => {
  try {
    const tables = ['users', 'farmers', 'buyer_profiles', 'partners', 'products',
      'quality_passports', 'orders', 'bookings', 'payments', 'dryer_telemetry', 'sessions', 'audit_logs'];
    const counts = [];
    for (const t of tables) {
      try {
        const c = await db.query(`SELECT COUNT(*)::int AS n FROM ${t};`);
        counts.push({ table: t, rows: c.rows[0].n });
      } catch (e) { counts.push({ table: t, rows: null }); }
    }
    const [meta, passports, telemetry, roles] = await Promise.all([
      db.query(`SELECT version() AS v, pg_size_pretty(pg_database_size(current_database())) AS size;`),
      db.query(`SELECT batch_number, crop_type, quality_grade, record_source,
                       (passport_signature IS NOT NULL) AS signed, created_at
                FROM quality_passports ORDER BY created_at DESC LIMIT 8;`),
      db.query(`SELECT device_id, hub, temperature_c, humidity_pct, grain_moisture_pct,
                       anomaly_flag, anomaly_reasons, received_at
                FROM dryer_telemetry ORDER BY received_at DESC LIMIT 8;`),
      db.query(`SELECT role, COUNT(*)::int AS n FROM users GROUP BY role ORDER BY role;`)
    ]);
    res.render('layout', {
      title: 'Database — AGRICHAIN 360',
      page: 'admin-database',
      data: {
        user: req.session.user, counts, roles: roles.rows,
        version: meta.rows[0].v.split(',')[0], size: meta.rows[0].size,
        passports: passports.rows, telemetry: telemetry.rows
      },
      body: 'adminDatabase',
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────
// JSON helpers (used by in-page scripts)
// ─────────────────────────────────────────────────────

router.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users)::int AS users,
        (SELECT COUNT(*) FROM farmers)::int AS farmers,
        (SELECT COUNT(*) FROM products WHERE available = true)::int AS active_listings,
        (SELECT COUNT(*) FROM quality_passports)::int AS passports
    `);
    res.json({ success: true, data: stats.rows[0] });
  } catch (e) {
    res.status(503).json({ success: false, message: 'Stats unavailable (database not connected).' });
  }
});

// Legacy JSON marketplace endpoint — now database-backed
router.get('/api/marketplace', async (req, res) => {
  try {
    const query = req.query.q || '';
    const values = [];
    let where = 'p.available = true';
    if (query) {
      values.push(`%${query}%`);
      where += ` AND (LOWER(p.crop) LIKE LOWER($1) OR LOWER(f.district) LIKE LOWER($1))`;
    }
    const result = await db.query(
      `SELECT p.id, p.crop, p.quantity, p.unit, p.price_per_unit, p.quality_status,
              f.district AS location, u.name AS farmer,
              qp.batch_number, qp.quality_grade AS grade, qp.moisture_level AS moisture
       FROM products p
       JOIN farmers f ON p.farmer_id = f.id
       JOIN users u ON f.user_id = u.id
       LEFT JOIN LATERAL (
         SELECT * FROM quality_passports q
         WHERE q.farmer_id = p.farmer_id AND LOWER(q.crop_type) = LOWER(p.crop)
         ORDER BY q.created_at DESC LIMIT 1
       ) qp ON true
       WHERE ${where} ORDER BY p.created_at DESC LIMIT 100;`,
      values
    );
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (e) {
    res.status(503).json({ success: false, message: 'Marketplace unavailable (database not connected).' });
  }
});

router.get('/api/check-login', (req, res) => {
  res.json({
    loggedIn: !!(req.session && req.session.user),
    role: req.session && req.session.user ? req.session.user.role : null
  });
});

// ─────────────────────────────────────────────────────
// Downloads & integrations (kept)
// ─────────────────────────────────────────────────────

router.get('/download/proposal', (req, res) => {
  const file = path.join(__dirname, '..', 'public', 'downloads', 'AGRICHAIN_360_AYuTe_Proposal.pdf');
  res.download(file);
});

// USSD callback stub — Africa's Talking USSD gateway
// Activates when pilot funding deploys and the USSD short code is assigned.
router.post('/api/v1/ussd/callback', (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body || {};
  // Stub response — the real USSD menu tree activates on pilot funding
  res.set('Content-Type', 'text/plain');
  res.send('CON Welcome to AGRICHAIN 360\n1. Check grain price\n2. Find drying centre\n3. My batches\n0. Exit');
});

// USSD gateway endpoint (integration point for telecom USSD providers)
router.use('/ussd', ussdRouter);

// ─────────────────────────────────────────────────────
// Retired pages → redirects (no dead ends)
// ─────────────────────────────────────────────────────

const RETIRED = {
  '/checkout': '/marketplace',
  '/my-sales': '/farmer-dashboard',
  '/analytics': '/admin-dashboard',
  '/finance': '/pricing',
  '/investor': '/',
  '/farmer': '/farmer-dashboard',
  '/buyer': '/buyer-dashboard',
  '/dryer': '/marketplace',
  '/transport': '/marketplace',
  '/warehouse': '/marketplace',
  '/iot-dryer': '/marketplace',
  '/ai-disease': '/ai-advisor',
  '/ai-growth': '/ai-advisor',
  '/lab-dashboard': '/login',
  '/field-officer': '/login',
  '/quality-officer': '/login',
  '/download-app': '/get-app',
  '/ussd/ussd-test': '/'
};
for (const [old, target] of Object.entries(RETIRED)) {
  router.get(old, (req, res) => res.redirect(302, target));
}

module.exports = router;
