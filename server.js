/**
 * AGRICHAIN 360™ — Decoupled Server Gateway
 *
 * Architecture:
 *   config/database.js  → PostgreSQL pool (graceful failure)
 *   config/session.js   → Session store (falls back to in-memory)
 *   config/websocket.js → Socket.IO (isolated from main server)
 *
 * If database is down → server still starts, returns 503 on DB routes
 * If MQTT crashes      → WebSocket silently skips IoT updates
 * If web routes fail   → API still serves
 */

require('dotenv').config();

const express = require('express');
const path = require('path');
const http = require('http');
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');

const { getPool, testConnection, isConnected: dbConnected } = require('./config/database');
const { createSessionMiddleware } = require('./config/session');
const { initWebSocket } = require('./config/websocket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════
// BASE MIDDLEWARE (always works)
// ═══════════════════════════════════════════

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database availability middleware
app.use((req, res, next) => {
  req.dbAvailable = dbConnected;
  next();
});

// ═══════════════════════════════════════════
// HEALTH CHECK (always responds)
// ═══════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AGRICHAIN 360™ is running',
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    services: {
      database: dbConnected ? 'connected' : 'disconnected',
      api: 'active',
      web: 'active',
      websocket: 'active'
    }
  });
});

// ═══════════════════════════════════════════
// STARTUP SEQUENCE
// ═══════════════════════════════════════════

async function startServer() {
  // 1. Test database connection (non-fatal)
  const dbOk = await testConnection();
  const pool = dbOk ? getPool() : null;

  // 2. Create session middleware (graceful fallback)
  const sessionMiddleware = createSessionMiddleware(pool);
  app.use(sessionMiddleware);

  // 3. EJS View Engine
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // 4. Mount web routes (isolated try/catch)
  try {
    const webRoutes = require('./routes/index');
    app.use('/', webRoutes);
    console.log('✅ Web routes mounted');
  } catch (err) {
    console.error('❌ Web routes failed to load:', err.message);
    console.warn('⚠️  Web views unavailable — API-only mode');
  }

  // 5. Mount API v1 routes (each isolated)
  const apiModules = [
    { path: '/api/v1/auth', module: './api/routes/auth.routes', name: 'Auth' },
    { path: '/api/v1/partners', module: './api/routes/partner.routes', name: 'Partners' },
    { path: '/api/v1/quality', module: './api/routes/quality.routes', name: 'Quality' },
    { path: '/api/v1/marketplace', module: './api/routes/marketplace.routes', name: 'Marketplace' },
    { path: '/api/v1/bookings', module: './api/routes/booking.routes', name: 'Bookings' },
    { path: '/api/v1/payments', module: './api/routes/payment.routes', name: 'Payments' },
    { path: '/api/v1/buyers', module: './api/routes/buyer.routes', name: 'Buyers' },
    { path: '/api/v1/subscriptions', module: './api/routes/subscription.routes', name: 'Subscriptions' },
  ];

  for (const api of apiModules) {
    try {
      app.use(api.path, require(api.module));
      console.log(`✅ API ${api.name} mounted at ${api.path}`);
    } catch (err) {
      console.error(`❌ API ${api.name} failed:`, err.message);
      app.use(api.path, (req, res) => {
        res.status(503).json({
          success: false,
          message: `${api.name} service temporarily unavailable`
        });
      });
    }
  }

  // 6. Passport verification (public — always available)
  app.get('/passport/:batchId', async (req, res) => {
    try {
      const QualityService = require('./services/quality.service');
      const passport = await QualityService.verifyPassport(req.params.batchId);
      res.render('layout', {
        title: `Digital Quality Passport — ${req.params.batchId}`,
        page: 'passport',
        data: { batchId: req.params.batchId, passport },
        body: 'passportVerify'
      });
    } catch (err) {
      res.render('layout', {
        title: 'Passport Verification',
        page: 'passport',
        data: { batchId: req.params.batchId, passport: null, error: err.message },
        body: 'passportVerify'
      });
    }
  });

  // 7. 404 handler
  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.path}`
      });
    }
    res.status(404).render('layout', {
      title: 'Page Not Found — AGRICHAIN 360',
      page: '404',
      data: {},
      body: 'landingPage'
    });
  });

  // 8. Global error handler
  app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack);
    if (req.path.startsWith('/api/')) {
      return res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
      });
    }
    res.status(err.status || 500).render('layout', {
      title: 'Error — AGRICHAIN 360',
      page: 'error',
      data: { error: err.message },
      body: 'landingPage'
    });
  });

  // 9. Initialize WebSocket (isolated)
  try {
    initWebSocket(server, sessionMiddleware);
    console.log('✅ WebSocket initialized');
  } catch (err) {
    console.error('❌ WebSocket failed:', err.message);
    console.warn('⚠️  Real-time features disabled');
  }

  // 10. Start listening
  server.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  🌾 AGRICHAIN 360™ — Decoupled Server v2.1              ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  📍 http://localhost:${PORT}                               ║`);
    console.log(`║  🗄️  Database:  ${dbOk ? 'Connected ✅' : 'Disconnected ❌'}                           ║`);
    console.log('║  🌐 Web:       EJS + Sessions                           ║');
    console.log('║  🔌 API:       /api/v1/*                                ║');
    console.log('║  ⚡ WebSocket:  Real-time IoT                           ║');
    console.log(`║  📦 Env:       ${process.env.NODE_ENV || 'development'}                              ║`);
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
  });
}

// Start the server
startServer().catch((err) => {
  console.error('💀 Fatal startup error:', err);
  process.exit(1);
});

module.exports = { app, server };
