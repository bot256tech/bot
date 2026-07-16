// ═══════════════════════════════════════════════════════════
// AGRICHAIN 360 — Data Service Layer
// Currently uses in-memory JS objects
// TO MIGRATE TO DATABASE: Replace each getXxx() function
// with a database query. The route handlers won't need to change.
// ═══════════════════════════════════════════════════════════

const farmers = require('./farmers');
const marketplace = require('./marketplace');
const buyers = require('./buyers');
const notifications = require('./notifications');
const transactions = require('./transactions');
const analytics = require('./analytics');
const transport = require('./transport');
const aiAdvisor = require('./aiAdvisor');
const pricing = require('./pricing');

const dataService = {
  // Farmers
  getFarmers: () => farmers,
  getFarmerById: (id) => farmers.find(f => f.id === id),

  // Marketplace
  getMarketplaceListings: () => marketplace,
  searchMarketplace: (query) => {
    const q = query.toLowerCase();
    return marketplace.filter(item =>
      item.crop.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.grade.toLowerCase().includes(q)
    );
  },

  // Buyers
  getBuyers: () => buyers,
  getBuyerByName: (name) => buyers.find(b => b.name === name),

  // Notifications
  getNotifications: () => notifications,

  // Transactions
  getTransactions: () => transactions,

  // Analytics
  getAnalytics: () => analytics,

  // Transport
  getTransportRoutes: () => transport,

  // AI Advisor
  getAiAdvice: () => aiAdvisor,
  askAI: (question) => {
    const q = question.toLowerCase();
    // Find best match or return default
    const match = aiAdvisor.find(a =>
      q.includes(a.q.split(' ').slice(0, 3).join(' ').toLowerCase())
    );
    return match || aiAdvisor[0];
  },

  // Pricing
  getPricingTable: () => pricing,

  // Platform Stats
  getPlatformStats: () => ({
    farmers: 800,
    tonsProcessed: 1000,
    farmerSavings: 350000000,
    jobsCreated: 35,
    monthlyRevenue: 15600000,
    monthlyCosts: 11000000,
    netMonthlySurplus: 4600000,
    breakEvenMonth: 22,
    targetDistricts: ['Jinja', 'Iganga', 'Kamuli', 'Mayuge'],
    womenFarmersPct: 62,
    youthFarmersPct: 55,
  }),
};

module.exports = dataService;