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

// Login Handler (Real Authentication)
router.post('/login', async (req, res) => {
  const { role, phone } = req.body;
  
  try {
    // Try to find existing user
    let user = await userService.findByPhone(phone);
    
    if (!user) {
      // Create new user if not exists
      user = await userService.createUser(phone, 'User', role);
    }
    
    // Set session
    req.session.user = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role || role
    };
    
    // Role-based redirects
    let redirectTo = req.body.redirect || '/';
    
    if (user.role === 'farmer' || role === 'farmer') redirectTo = '/farmer-dashboard';
    if (user.role === 'buyer' || role === 'buyer') redirectTo = '/buyer-dashboard';
    if (role === 'field_officer') redirectTo = '/field-officer';
    if (role === 'quality_officer') redirectTo = '/quality-officer';
    if (role === 'lab') redirectTo = '/lab-dashboard';
    if (role === 'admin') redirectTo = '/admin-dashboard';
    
    res.redirect(redirectTo);
    
  } catch (error) {
    console.error('Login error:', error);
    res.redirect('/login?error=1');
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

// Sign Up Handler (Real)
router.post('/signup', async (req, res) => {
  const { role, phone, name } = req.body;
  
  try {
    const user = await userService.createUser(phone, name || 'New User', role);
    
    req.session.user = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role
    };
    
    let redirectTo = '/';
    
    if (role === 'farmer') redirectTo = '/farmer-dashboard';
    if (role === 'buyer') redirectTo = '/buyer-dashboard';
    if (role === 'admin') redirectTo = '/admin-dashboard';
    
    res.redirect(redirectTo);
    
  } catch (error) {
    console.error('Signup error:', error);
    res.redirect('/signup?error=1');
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