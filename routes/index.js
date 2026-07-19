const express = require('express');
const router = express.Router();
const dataService = require('../data/index');
const path = require('path');
const ussdRouter = require('./ussd');
const userService = require('../services/userService');

// Landing Page — standalone Bootstrap page (no layout.ejs wrapper)
router.get('/', (req, res) => {
  res.render('bootstrapLanding');
});

// Old landing page (accessible at /home)
router.get('/home', (req, res) => {
  res.render('layout', {
    title: 'AGRICHAIN 360™ — Premium Post-Harvest Platform',
    page: 'landingPage',
    data: {},
    body: 'landingPage',
  });
});

// Farmer Portal (Protected)
router.get('/farmer', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login?redirect=/farmer');
  }
  res.render('layout', {
    title: 'Farmer Portal — AGRICHAIN 360',
    page: 'farmer',
    data: {
      farmers: dataService.getFarmers(),
      selectedFarmer: dataService.getFarmerById('F001'),
      user: req.session.user
    },
    body: 'farmer',
  });
});

// AI Crop Advisor
router.get('/ai-advisor', (req, res) => {
  res.render('layout', {
    title: 'AI Crop Advisor — AGRICHAIN 360',
    page: 'ai-advisor',
    data: {
      aiAdvice: dataService.getAiAdvice(),
    },
    body: 'aiAdvisor',
  });
});

// AI Disease Detection
router.get('/ai-disease', (req, res) => {
  res.render('layout', {
    title: 'AI Disease Detection — AGRICHAIN 360',
    page: 'ai-disease',
    data: {},
    body: 'aiDisease',
  });
});

// AI Growth & Yield Prediction
router.get('/ai-growth', (req, res) => {
  res.render('layout', {
    title: 'AI Growth & Yield Prediction — AGRICHAIN 360',
    page: 'ai-growth',
    data: {},
    body: 'aiGrowth',
  });
});

// IoT Smart Dryer (Real MQTT version)
router.get('/iot-dryer', (req, res) => {
  res.render('layout', {
    title: 'IoT Smart Solar Dryer — AGRICHAIN 360',
    page: 'iot-dryer',
    data: {},
    body: 'iotDryerReal',
  });
});

// Solar Drying
router.get('/dryer', (req, res) => {
  res.render('layout', {
    title: 'Solar Drying System — AGRICHAIN 360',
    page: 'dryer',
    data: {
      pricing: dataService.getPricingTable(),
    },
    body: 'dryer',
  });
});

// Transport Hub
router.get('/transport', (req, res) => {
  res.render('layout', {
    title: 'Transport Hub — AGRICHAIN 360',
    page: 'transport',
    data: {
      transport: dataService.getTransportRoutes(),
    },
    body: 'transport',
  });
});

// IoT Warehouse
router.get('/warehouse', (req, res) => {
  res.render('layout', {
    title: 'IoT Warehouse — AGRICHAIN 360',
    page: 'warehouse',
    data: {},
    body: 'warehouse',
  });
});

// Marketplace
router.get('/marketplace', (req, res) => {
  const query = req.query.q || '';
  const listings = query
    ? dataService.searchMarketplace(query)
    : dataService.getMarketplaceListings();
  res.render('layout', {
    title: 'AgriTrade Marketplace — AGRICHAIN 360',
    page: 'marketplace',
    data: {
      listings,
      query,
    },
    body: 'marketplace',
  });
});

// Buyer Portal
router.get('/buyer', (req, res) => {
  res.render('layout', {
    title: 'Buyer Portal — AGRICHAIN 360',
    page: 'buyer',
    data: {
      buyers: dataService.getBuyers(),
      selectedBuyer: dataService.getBuyerByName('GrainCorp East Africa'),
    },
    body: 'buyer',
  });
});

// Finance & Wallet
router.get('/finance', (req, res) => {
  res.render('layout', {
    title: 'Finance & Wallet — AGRICHAIN 360',
    page: 'finance',
    data: {
      transactions: dataService.getTransactions(),
      stats: dataService.getPlatformStats(),
    },
    body: 'finance',
  });
});

// Analytics
router.get('/analytics', (req, res) => {
  res.render('layout', {
    title: 'Analytics Dashboard — AGRICHAIN 360',
    page: 'analytics',
    data: {
      analytics: dataService.getAnalytics(),
    },
    body: 'analytics',
  });
});

// Investor Deck
router.get('/investor', (req, res) => {
  res.render('layout', {
    title: 'Investor Deck — AGRICHAIN 360',
    page: 'investor',
    data: { user: req.session.user },
    body: 'investor',
  });
});

// Pricing / Subscription Plans
router.get('/pricing', (req, res) => {
  res.render('layout', {
    title: 'Pricing & Plans — AGRICHAIN 360',
    page: 'pricing',
    data: {
      pricing: dataService.getPricingTable(),
      user: req.session.user,
    },
    body: 'pricing',
  });
});

// Lab Dashboard
router.get('/lab-dashboard', (req, res) => {
  res.render('layout', {
    title: 'Laboratory Dashboard — AGRICHAIN 360',
    page: 'lab-dashboard',
    data: { user: req.session.user },
    body: 'labDashboard',
  });
});

// Field Officer Dashboard
router.get('/field-officer', (req, res) => {
  res.render('layout', {
    title: 'Field Officer Dashboard — AGRICHAIN 360',
    page: 'field-officer',
    data: { user: req.session.user },
    body: 'fieldOfficer',
  });
});

// Quality Officer Dashboard
router.get('/quality-officer', (req, res) => {
  res.render('layout', {
    title: 'Quality Officer Dashboard — AGRICHAIN 360',
    page: 'quality-officer',
    data: { user: req.session.user },
    body: 'qualityOfficer',
  });
});

// Role Selection Page
router.get('/roles', (req, res) => {
  res.render('layout', {
    title: 'Select Role — AGRICHAIN 360',
    page: 'roles',
    data: {},
    body: 'roles',
  });
});

// USSD Routes
router.use('/ussd', ussdRouter);

// MQTT Gateway
const mqttGateway = require('../mqtt-gateway');
router.use('/mqtt', express.static('mqtt-gateway')); // expose gateway API
router.get('/mqtt/devices', (req, res) => {
  res.json(Object.values(mqttGateway.devices || {}));
});
router.get('/mqtt/devices/:id', (req, res) => {
  const data = mqttGateway.sensorData?.[req.params.id];
  res.json(data || { error: 'No data' });
});
router.post('/mqtt/devices/:id/command', (req, res) => {
  mqttGateway.sendCommand(req.params.id, req.body);
  res.json({ success: true });
});

// Download Proposal
router.get('/download/proposal', (req, res) => {
  const filePath = path.join(__dirname, '..', 'public', 'downloads', 'AGRICHAIN_360_AYuTe_Proposal.pdf');
  res.download(filePath, 'AGRICHAIN_360_AYuTe_Proposal.pdf');
});

// Download App Page
router.get('/download-app', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'download-app.html'));
});

// Digital Quality Passport — Public Verification Page
router.get('/passport/:batchId', async (req, res) => {
  try {
    const QualityPassport = require('./models/QualityPassport');
    let passport = null;
    try {
      passport = await QualityPassport.findByBatchNumber(req.params.batchId);
    } catch (e) {
      // DB not available, show demo data
    }
    res.render('layout', {
      title: `Digital Quality Passport — ${req.params.batchId}`,
      page: 'passport',
      data: {
        batchId: req.params.batchId,
        passport: passport || {
          batch_number: req.params.batchId,
          crop_type: 'Maize',
          quantity: 2000,
          moisture_level: '12.5',
          aflatoxin_result: '4.2',
          quality_grade: 'A',
          created_at: new Date(),
          verified_at: new Date(),
        },
      },
      body: 'passportVerify',
    });
  } catch (error) {
    res.render('layout', {
      title: `Digital Quality Passport — ${req.params.batchId}`,
      page: 'passport',
      data: { batchId: req.params.batchId, passport: null, error: error.message },
      body: 'passportVerify',
    });
  }
});

// Checkout Page
router.get('/checkout', (req, res) => {
  const { crop, tons, price, location, farmer } = req.query;
  res.render('layout', {
    title: 'Checkout — AGRICHAIN 360',
    page: 'checkout',
    data: { crop, tons: parseFloat(tons), price: parseFloat(price), location, farmer },
    body: 'checkout',
  });
});

// My Sales (Farmer)
router.get('/my-sales', (req, res) => {
  res.render('layout', {
    title: 'My Sales — AGRICHAIN 360',
    page: 'my-sales',
    data: {},
    body: 'mySales',
  });
});

// My Listings (Farmer) - Protected
router.get('/my-listings', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login?redirect=/my-listings');
  }
  res.render('layout', {
    title: 'My Listings — AGRICHAIN 360',
    page: 'my-listings',
    data: {},
    body: 'myListings',
  });
});

// Buyer Order History - Protected
router.get('/order-history', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login?redirect=/order-history');
  }
  res.render('layout', {
    title: 'Order History — AGRICHAIN 360',
    page: 'order-history',
    data: {},
    body: 'orderHistory',
  });
});

// Farmer Dashboard
router.get('/farmer-dashboard', (req, res) => {
  res.render('layout', {
    title: 'Farmer Dashboard — AGRICHAIN 360',
    page: 'farmer-dashboard',
    data: { user: req.session.user },
    body: 'farmerDashboard',
  });
});

// Buyer Dashboard
router.get('/buyer-dashboard', (req, res) => {
  res.render('layout', {
    title: 'Buyer Dashboard — AGRICHAIN 360',
    page: 'buyer-dashboard',
    data: { user: req.session.user },
    body: 'buyerDashboard',
  });
});

// Admin Dashboard
router.get('/admin-dashboard', (req, res) => {
  res.render('layout', {
    title: 'Admin Dashboard — AGRICHAIN 360',
    page: 'admin-dashboard',
    data: { user: req.session.user },
    body: 'adminDashboard',
  });
});

// Login Page
router.get('/login', (req, res) => {
  res.render('layout', {
    title: 'Login — AGRICHAIN 360',
    page: 'login',
    data: { redirect: req.query.redirect || '/', error: req.query.error || '' },
    body: 'login',
  });
});

// Login Handler — works with database or session-only fallback
router.post('/login', async (req, res) => {
  const phone = (req.body.phone || '').trim();
  const password = (req.body.password || '').trim();
  const redirect = req.body.redirect || '';

  // Validate
  if (!phone || phone.length < 8) {
    return res.redirect('/login?error=Please+enter+your+phone+number');
  }
  if (!password) {
    return res.redirect('/login?error=Please+enter+your+password');
  }

  // Try database login first
  try {
    const AuthService = require('../services/auth.service');
    const result = await AuthService.loginUser(phone, password);
    const user = result.user;

    req.session.user = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      token: result.token,
      dbConnected: true
    };

    // Role-based redirect
    const role = (user.role || '').toUpperCase();
    let redirectTo = redirect || '/';
    if (!redirect) {
      if (role === 'FARMER') redirectTo = '/farmer-dashboard';
      else if (role === 'BUYER') redirectTo = '/buyer-dashboard';
      else if (role === 'ADMIN') redirectTo = '/admin-dashboard';
    }

    return res.redirect(redirectTo);

  } catch (dbError) {
    // Database login failed — try session-based demo login
    console.error('DB login failed:', dbError.message);

    // Demo accounts for when DB is not available
    const demoAccounts = {
      '+256700000000': { name: 'System Admin', role: 'ADMIN', password: 'admin123' },
      '+256700111111': { name: 'Demo Farmer', role: 'FARMER', password: 'demo123' },
      '+256700222222': { name: 'Demo Buyer', role: 'BUYER', password: 'demo123' },
      '+256700333333': { name: 'Demo Partner', role: 'PARTNER', password: 'demo123' }
    };

    const demo = demoAccounts[phone];
    if (demo && demo.password === password) {
      req.session.user = {
        id: Date.now(),
        phone: phone,
        name: demo.name,
        role: demo.role,
        token: 'demo-' + Date.now(),
        dbConnected: false,
        demoMode: true
      };

      let redirectTo = redirect || '/';
      if (!redirect) {
        if (demo.role === 'FARMER') redirectTo = '/farmer-dashboard';
        else if (demo.role === 'BUYER') redirectTo = '/buyer-dashboard';
        else if (demo.role === 'ADMIN') redirectTo = '/admin-dashboard';
      }
      return res.redirect(redirectTo);
    }

    // If DB error was about invalid credentials (not connection issue), show that
    if (dbError.message.includes('Invalid') || dbError.message.includes('password')) {
      return res.redirect('/login?error=Invalid+phone+number+or+password');
    }

    // DB not available — show helpful message
    return res.redirect('/login?error=Database+is+connecting.+Try+demo+account:+256700111111+password+demo123');
  }
});

// Sign Up Page
router.get('/signup', (req, res) => {
  res.render('layout', {
    title: 'Sign Up — AGRICHAIN 360',
    page: 'signup',
    data: { error: req.query.error || '', selectedRole: req.query.role || '' },
    body: 'signup',
  });
});

// Sign Up Handler — creates user + role-specific profile (works with or without DB)
router.post('/signup', async (req, res) => {
  const body = req.body || {};
  const role = body.role || 'farmer';
  const name = body.name || body.org_name || 'User';
  const phone = body.phone || '';
  const email = body.email || '';
  const password = body.password || 'changeme123';

  // Validate required fields
  if (!name || name.length < 2) {
    return res.redirect('/signup?error=name');
  }
  if (!phone || phone.length < 8) {
    return res.redirect('/signup?error=phone');
  }
  if (!password || password.length < 6) {
    return res.redirect('/signup?error=password');
  }

  // Map frontend roles to backend roles
  const roleMap = {
    'farmer': 'FARMER', 'buyer': 'BUYER', 'partner': 'PARTNER',
    'village_agent': 'PARTNER', 'input_dealer': 'PARTNER',
    'cooperative': 'BUYER', 'ngo': 'ADMIN', 'finance': 'BUYER',
    'researcher': 'ADMIN', 'field_officer': 'FARMER',
    'quality_officer': 'FARMER', 'lab': 'FARMER', 'admin': 'ADMIN'
  };
  const backendRole = roleMap[role] || 'FARMER';

  // Try to create user in database
  let userId = Date.now();
  let token = null;
  let dbSuccess = false;

  try {
    const AuthService = require('../services/auth.service');
    const result = await AuthService.registerUser({
      name: name,
      phone: phone,
      email: email || null,
      password: password,
      role: backendRole
    });
    userId = result.user.id;
    token = result.token;
    dbSuccess = true;

    // Create role-specific profiles in database
    if (role === 'farmer' || role === 'field_officer' || role === 'quality_officer' || role === 'lab') {
      try {
        const Farmer = require('../models/Farmer');
        const cropsArray = Array.isArray(body.crops) ? body.crops : (body.crops ? [body.crops] : []);
        await Farmer.create({
          user_id: userId,
          district: body.district || null,
          village: body.village || null,
          crops: cropsArray,
          farm_size: body.farm_size ? parseFloat(body.farm_size) : null,
          national_id: body.national_id || null
        });
      } catch (e) { console.error('Farmer profile:', e.message); }
    }

    if (role === 'buyer' || role === 'cooperative' || role === 'finance') {
      try {
        const Buyer = require('../models/Buyer');
        await Buyer.createProfile({
          user_id: userId,
          company_name: body.org_name || name,
          business_type: role === 'cooperative' ? 'COOPERATIVE' : (body.business_type || 'OTHER'),
          registration_number: body.registration_number || null,
          city: body.city || null,
          website: body.website || body.org_website || null
        });
      } catch (e) { console.error('Buyer profile:', e.message); }
    }

    if (role === 'partner' || role === 'input_dealer') {
      try {
        const Partner = require('../models/Partner');
        await Partner.create({
          user_id: userId,
          partner_type: body.partner_type || (role === 'input_dealer' ? 'WAREHOUSE' : 'DRYER'),
          business_name: body.business_name || name,
          location: body.partner_location || null,
          services: [],
          pricing: null
        });
      } catch (e) { console.error('Partner profile:', e.message); }
    }

    if (role === 'village_agent') {
      try {
        const VillageAgent = require('../models/VillageAgent');
        await VillageAgent.create({
          user_id: userId,
          territory: body.territory || body.district || null,
          sub_county: body.sub_county || null,
          parish: body.parish || null,
          village: body.agent_village || body.village || null
        });
      } catch (e) { console.error('Village agent:', e.message); }
    }

  } catch (error) {
    // Database not available — create user in session only (still works!)
    console.error('DB signup fallback:', error.message);
    token = 'session-only-' + userId;
  }

  // Set session (always works, even without DB)
  req.session.user = {
    id: userId,
    phone: phone,
    name: name,
    email: email,
    role: backendRole,
    token: token,
    dbConnected: dbSuccess,
    createdAt: new Date().toISOString()
  };

  // Redirect based on role
  let redirectTo = '/';
  if (role === 'farmer') redirectTo = '/farmer-dashboard';
  else if (role === 'buyer') redirectTo = '/buyer-dashboard';
  else if (role === 'admin' || role === 'ngo' || role === 'researcher') redirectTo = '/admin-dashboard';

  res.redirect(redirectTo);
});

// API endpoint (for future AJAX calls)
router.get('/api/stats', (req, res) => {
  res.json(dataService.getPlatformStats());
});

router.get('/api/marketplace', (req, res) => {
  const query = req.query.q || '';
  const listings = query
    ? dataService.searchMarketplace(query)
    : dataService.getMarketplaceListings();
  res.json(listings);
});

// Check if user is logged in
router.get('/api/check-login', (req, res) => {
  res.json({ loggedIn: !!(req.session && req.session.user) });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;