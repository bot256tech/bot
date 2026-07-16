/**
 * AGRICHAIN 360™ — Production Server with WebSocket
 * Includes real-time IoT updates
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
const routes = require('./routes/index');
const mqttGateway = require('./mqtt-gateway');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Make io available globally for MQTT gateway
global.io = io;

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  // Send current device status
  socket.emit('devices-update', Object.values(mqttGateway.devices || {}));
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
  
  // Allow clients to request device data
  socket.on('request-devices', () => {
    socket.emit('devices-update', Object.values(mqttGateway.devices || {}));
  });
});

// Broadcast MQTT updates to all connected clients
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

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('combined'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', routes);

// Start Server
server.listen(PORT, () => {
  console.log(`\n🌾 AGRICHAIN 360™ — Live Server with WebSocket`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🔌 WebSocket enabled for real-time IoT updates`);
  console.log(`📡 MQTT Gateway running\n`);
});

module.exports = { app, server, io };