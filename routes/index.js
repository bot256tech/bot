const express = require('express');
const router = express.Router();
const dataService = require('../data/index');
const path = require('path');
const ussdRouter = require('./ussd');
const userService = require('../services/userService');

// New Professional Landing Page
router.get('/', (req, res) => {
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
    data: {
      stats: dataService.getPlatformStats(),
      pricing: dataService.getPricingTable(),
    },
    body: 'investor',
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

// Digital Quality Passport
router.get('/passport/:batchId', (req, res) => {
  res.render('layout', {
    title: `Digital Quality Passport — ${req.params.batchId}`,
    page: 'passport',
    data: {
      batchId: req.params.batchId
    },
    body: 'passport',
  });
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

// Login Page
router.get('/login', (req, res) => {
  res.render('layout', {
    title: 'Login — AGRICHAIN 360',
    page: 'login',
    data: { redirect: req.query.redirect || '/' },
    body: 'login',
  });
});

// Login Handler — uses AuthService with password verification
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  const redirect = req.body.redirect || '';
  
  try {
    const AuthService = require('../services/auth.service');
    const result = await AuthService.loginUser(phone, password);
    const user = result.user;
    
    // Set session
    req.session.user = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      token: result.token
    };
    
    // Role-based redirects
    let redirectTo = redirect || '/';
    const role = user.role.toUpperCase();
    
    if (role === 'FARMER') redirectTo = redirectTo || '/farmer-dashboard';
    else if (role === 'BUYER') redirectTo = redirectTo || '/buyer-dashboard';
    else if (role === 'PARTNER') redirectTo = redirectTo || '/';
    else if (role === 'VILLAGE_AGENT') redirectTo = redirectTo || '/';
    else if (role === 'ADMIN') redirectTo = redirectTo || '/admin-dashboard';
    else if (role === 'FIELD_OFFICER') redirectTo = redirectTo || '/field-officer';
    else if (role === 'QUALITY_OFFICER') redirectTo = redirectTo || '/quality-officer';
    else if (role === 'LAB') redirectTo = redirectTo || '/lab-dashboard';
    else redirectTo = redirectTo || '/';
    
    res.redirect(redirectTo);
    
  } catch (error) {
    console.error('Login error:', error.message);
    res.redirect('/login?error=' + encodeURIComponent(error.message));
  }
});

// Sign Up Page
router.get('/signup', (req, res) => {
  res.render('layout', {
    title: 'Sign Up — AGRICHAIN 360',
    page: 'signup',
    data: {},
    body: 'signup',
  });
});

// Sign Up Handler — creates user + role-specific profile
router.post('/signup', async (req, res) => {
  const { role, phone, name, email, password, district, village, crops, farm_size, national_id,
          business_type, registration_number, city, website,
          partner_type, partner_location, business_name,
          territory, sub_county, parish, agent_village,
          org_name, focus_area, org_country, org_website } = req.body;
  
  try {
    const AuthService = require('../services/auth.service');
    const Farmer = require('../models/Farmer');
    const Buyer = require('../models/Buyer');
    const Partner = require('../models/Partner');
    const VillageAgent = require('../models/VillageAgent');

    // Map frontend roles to backend roles
    const roleMap = {
      'farmer': 'FARMER', 'buyer': 'BUYER', 'partner': 'PARTNER',
      'village_agent': 'PARTNER', 'input_dealer': 'PARTNER',
      'cooperative': 'BUYER', 'ngo': 'ADMIN', 'finance': 'BUYER',
      'researcher': 'ADMIN', 'field_officer': 'FARMER',
      'quality_officer': 'FARMER', 'lab': 'FARMER', 'admin': 'ADMIN'
    };
    const backendRole = roleMap[role] || 'FARMER';

    // Create user via AuthService
    const result = await AuthService.registerUser({
      name: name || org_name || 'User',
      phone,
      email: email || null,
      password: password || 'changeme123',
      role: backendRole
    });

    const user = result.user;

    // Create role-specific profiles
    if (role === 'farmer' || role === 'field_officer' || role === 'quality_officer' || role === 'lab') {
      try {
        const cropsArray = Array.isArray(crops) ? crops : (crops ? [crops] : []);
        await Farmer.create({
          user_id: user.id,
          district: district || null,
          village: village || null,
          crops: cropsArray,
          farm_size: farm_size ? parseFloat(farm_size) : null,
          national_id: national_id || null
        });
      } catch (e) { console.error('Farmer profile creation:', e.message); }
    }

    if (role === 'buyer' || role === 'cooperative' || role === 'finance') {
      try {
        const bType = role === 'cooperative' ? 'COOPERATIVE' : (business_type || 'OTHER');
        await Buyer.createProfile({
          user_id: user.id,
          company_name: org_name || name || 'Company',
          business_type: bType,
          registration_number: registration_number || null,
          city: city || null,
          website: website || org_website || null
        });
      } catch (e) { console.error('Buyer profile creation:', e.message); }
    }

    if (role === 'partner' || role === 'input_dealer') {
      try {
        await Partner.create({
          user_id: user.id,
          partner_type: partner_type || (role === 'input_dealer' ? 'WAREHOUSE' : 'DRYER'),
          business_name: business_name || name || 'Partner',
          location: partner_location || null,
          services: [],
          pricing: null
        });
      } catch (e) { console.error('Partner profile creation:', e.message); }
    }

    if (role === 'village_agent') {
      try {
        await VillageAgent.create({
          user_id: user.id,
          territory: territory || district || null,
          sub_county: sub_county || null,
          parish: parish || null,
          village: agent_village || village || null
        });
      } catch (e) { console.error('Village agent creation:', e.message); }
    }

    // Set session
    req.session.user = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      token: result.token
    };

    // Redirect based on role
    let redirectTo = '/';
    if (role === 'farmer') redirectTo = '/farmer-dashboard';
    else if (role === 'buyer') redirectTo = '/buyer-dashboard';
    else if (role === 'partner' || role === 'input_dealer') redirectTo = '/';
    else if (role === 'village_agent') redirectTo = '/';
    else if (role === 'admin' || role === 'ngo' || role === 'researcher') redirectTo = '/admin-dashboard';
    else redirectTo = '/';

    res.redirect(redirectTo);

  } catch (error) {
    console.error('Signup error:', error.message);
    res.redirect('/signup?error=' + encodeURIComponent(error.message));
  }
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