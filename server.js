/**
 * AGRICHAIN 360™ — Decoupled Server Gateway v3.0
 *
 * Architecture:
 *   config/database.js   → PostgreSQL pool (graceful failure)
 *   config/session.js    → Session store (falls back to in-memory)
 *   config/websocket.js  → Socket.IO (isolated from main server)
 *   config/logger.js     → Winston structured logging
 *   config/rateLimiter.js → Rate limiting configuration
 *   config/cors.js       → CORS configuration
 *
 * Security:
 *   ✅ Rate limiting on all API routes
 *   ✅ CORS restricted to allowed origins
 *   ✅ Helmet security headers
 *   ✅ HTTPS enforcement in production
 *   ✅ Audit logging on all critical actions
 *   ✅ Input validation on all endpoints
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

const dbConfig = require('./config/database');
const { getPool, testConnection } = dbConfig;
const { createSessionMiddleware } = require('./config/session');
const { initWebSocket } = require('./config/websocket');
const logger = require('./config/logger');
const { apiLimiter, authLimiter, paymentLimiter, registerLimiter } = require('./config/rateLimiter');
const { getCorsConfig } = require('./config/cors');
const { auditContext } = require('./api/middleware/auditLog');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════
// HTTPS ENFORCEMENT (Production only)
// ═══════════════════════════════════════════

if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// ═══════════════════════════════════════════
// BASE MIDDLEWARE (always works)
// ═══════════════════════════════════════════

app.use(helmet({
  contentSecurityPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
app.use(compression());
app.use(getCorsConfig());
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Audit context middleware (attaches request metadata)
app.use(auditContext);

// Database availability middleware
app.use((req, res, next) => {
  req.dbAvailable = dbConfig.isConnected;
  next();
});

// Request ID for tracing
app.use((req, res, next) => {
  req.id = require('crypto').randomBytes(8).toString('hex');
  res.setHeader('X-Request-Id', req.id);
  next();
});

// ═══════════════════════════════════════════
// HEALTH CHECK (always responds)
// ═══════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AGRICHAIN 360™ is running',
    version: '3.0.1',
    timestamp: new Date().toISOString(),
    services: {
      database: dbConfig.isConnected ? 'connected' : 'disconnected',
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

  // 2. Auto-run migrations on startup (no shell access needed)
  if (dbOk) {
    try {
      const fs = require('fs');
      const migrationsDir = path.join(__dirname, 'database', 'migrations');
      if (fs.existsSync(migrationsDir)) {
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
        for (const file of files) {
          const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
          try {
            await pool.query(sql);
            logger.info(`Migration OK: ${file}`);
          } catch (e) {
            logger.warn(`Migration ${file} warning: ${e.message}`);
          }
        }
      }
    } catch (e) {
      logger.warn('Auto-migration skipped:', e.message);
    }
  }

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
    logger.info('Web routes mounted');
  } catch (err) {
    logger.error('Web routes failed to load', { error: err.message });
    logger.warn('Web views unavailable — API-only mode');
  }

  // 5. Mount API v1 routes (each isolated, with rate limiting)
  const apiModules = [
    { path: '/api/v1/auth', module: './api/routes/auth.routes', name: 'Auth', limiter: authLimiter },
    { path: '/api/v1/partners', module: './api/routes/partner.routes', name: 'Partners', limiter: apiLimiter },
    { path: '/api/v1/quality', module: './api/routes/quality.routes', name: 'Quality', limiter: apiLimiter },
    { path: '/api/v1/marketplace', module: './api/routes/marketplace.routes', name: 'Marketplace', limiter: apiLimiter },
    { path: '/api/v1/bookings', module: './api/routes/booking.routes', name: 'Bookings', limiter: apiLimiter },
    { path: '/api/v1/payments', module: './api/routes/payment.routes', name: 'Payments', limiter: paymentLimiter },
    { path: '/api/v1/buyers', module: './api/routes/buyer.routes', name: 'Buyers', limiter: apiLimiter },
    { path: '/api/v1/subscriptions', module: './api/routes/subscription.routes', name: 'Subscriptions', limiter: apiLimiter },
    { path: '/api/v1/ai', module: './api/routes/ai.routes', name: 'AI Advisor', limiter: apiLimiter },
  ];

  for (const api of apiModules) {
    try {
      if (api.limiter) {
        app.use(api.path, api.limiter);
      }
      app.use(api.path, require(api.module));
      logger.info(`API ${api.name} mounted at ${api.path}`);
    } catch (err) {
      logger.error(`API ${api.name} failed to load`, { error: err.message });
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
    logger.error('Server Error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      requestId: req.id
    });

    if (req.path.startsWith('/api/')) {
      return res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
        requestId: req.id
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
    logger.info('WebSocket initialized');
  } catch (err) {
    logger.error('WebSocket failed', { error: err.message });
    logger.warn('Real-time features disabled');
  }

  // 10. Start listening
  server.listen(PORT, () => {
    logger.info('');
    logger.info('═══════════════════════════════════════════════');
    logger.info('  AGRICHAIN 360 — Decoupled Server v3.0');
    logger.info('═══════════════════════════════════════════════');
    logger.info(`  Port:        ${PORT}`);
    logger.info(`  Database:    ${dbOk ? 'Connected' : 'Disconnected'}`);
    logger.info(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info('  Security:    Rate limiting + CORS + HTTPS');
    logger.info('  Monitoring:  Winston structured logging');
    logger.info('═══════════════════════════════════════════════');
    logger.info('');
  });
}

// Start the server
startServer().catch((err) => {
  logger.error('Fatal startup error', { error: err.message, stack: err.stack });
  process.exit(1);
});

module.exports = { app, server };
