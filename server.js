/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  AGRICHAIN 360™ — Unified Server                         ║
 * ║  Web App + REST API + WebSocket + IoT Gateway             ║
 * ║  Phase 1: Foundation (Services + Auth + PostgreSQL)       ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

require('dotenv').config();

const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');

const { pool } = require('./database/connection');
const routes = require('./routes/index');
const mqttGateway = require('./mqtt-gateway');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Make io available globally for MQTT gateway and routes
global.io = io;

// ═══════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration (PostgreSQL-backed)
const sessionMiddleware = session({
  store: new pgSession({
    pool: pool,
    tableName: 'sessions',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'agrichain360_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }
});

app.use(sessionMiddleware);

// Share session with WebSocket
io.engine.use(sessionMiddleware);

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ═══════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AGRICHAIN 360™ is running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    services: {
      api: 'active',
      web: 'active',
      websocket: 'active',
      mqtt: mqttGateway ? 'active' : 'inactive'
    }
  });
});

// ═══════════════════════════════════════════════════════════
// WEB ROUTES (EJS Views)
// ═══════════════════════════════════════════════════════════

app.use('/', routes);

// ═══════════════════════════════════════════════════════════
// REST API v1 ROUTES
// ═══════════════════════════════════════════════════════════

app.use('/api/v1/auth', require('./api/routes/auth.routes'));
app.use('/api/v1/partners', require('./api/routes/partner.routes'));
app.use('/api/v1/quality', require('./api/routes/quality.routes'));
app.use('/api/v1/marketplace', require('./api/routes/marketplace.routes'));
app.use('/api/v1/bookings', require('./api/routes/booking.routes'));

// ═══════════════════════════════════════════════════════════
// WEBSOCKET — Real-time IoT Updates
// ═══════════════════════════════════════════════════════════

io.on('connection', (socket) => {
  console.log('🔌 WebSocket client connected:', socket.id);

  // Send current device status on connect
  socket.emit('devices-update', Object.values(mqttGateway.devices || {}));

  socket.on('disconnect', () => {
    console.log('🔌 WebSocket client disconnected:', socket.id);
  });

  // Allow clients to request device data
  socket.on('request-devices', () => {
    socket.emit('devices-update', Object.values(mqttGateway.devices || {}));
  });
});

// Broadcast MQTT sensor updates every 3 seconds
setInterval(() => {
  if (global.io && mqttGateway.sensorData) {
    Object.keys(mqttGateway.sensorData).forEach(deviceId => {
      global.io.emit('iot-live-update', {
        deviceId,
        data: mqttGateway.sensorData[deviceId]
      });
    });
  }
}, 3000);

// ═══════════════════════════════════════════════════════════
// 404 HANDLER
// ═══════════════════════════════════════════════════════════

app.use((req, res) => {
  // API requests get JSON 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.path}`
    });
  }

  // Web requests get a page (or redirect to home)
  res.status(404).render('layout', {
    title: 'Page Not Found — AGRICHAIN 360',
    page: '404',
    data: {},
    body: 'landingPage'
  });
});

// ═══════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLER
// ═══════════════════════════════════════════════════════════

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);

  if (req.path.startsWith('/api/')) {
    return res.status(err.status || 500).json({
      success: false,
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message
    });
  }

  res.status(err.status || 500).render('layout', {
    title: 'Error — AGRICHAIN 360',
    page: 'error',
    data: { error: err.message },
    body: 'landingPage'
  });
});

// ═══════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════

server.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  🌾 AGRICHAIN 360™ — Unified Server v2.0             ║');
  console.log('╠═══════════════════════════════════════════════════════╣');
  console.log(`║  📍 http://localhost:${PORT}                            ║`);
  console.log('║  🌐 Web App:       EJS + Sessions                    ║');
  console.log('║  🔌 API:           /api/v1/*                         ║');
  console.log('║  ⚡ WebSocket:     Real-time IoT                     ║');
  console.log('║  📡 MQTT Gateway:  Active                            ║');
  console.log(`║  📦 Environment:   ${process.env.NODE_ENV || 'development'}                     ║`);
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');
});

module.exports = { app, server, io };
