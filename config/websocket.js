const { Server } = require('socket.io');

function initWebSocket(server, sessionMiddleware) {
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  if (sessionMiddleware) {
    try {
      io.engine.use(sessionMiddleware);
    } catch (err) {
      console.warn('⚠️  Could not attach session to WebSocket:', err.message);
    }
  }

  io.on('connection', (socket) => {
    console.log('🔌 WebSocket connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected:', socket.id);
    });

    socket.on('request-devices', () => {
      try {
        const mqttGateway = require('../mqtt-gateway');
        socket.emit('devices-update', Object.values(mqttGateway.devices || {}));
      } catch (err) {
        socket.emit('devices-update', []);
      }
    });
  });

  // IoT broadcast loop — wrapped in try/catch so MQTT failure doesn't crash server
  setInterval(() => {
    try {
      const mqttGateway = require('../mqtt-gateway');
      if (mqttGateway.sensorData) {
        Object.keys(mqttGateway.sensorData).forEach(deviceId => {
          io.emit('iot-live-update', {
            deviceId,
            data: mqttGateway.sensorData[deviceId]
          });
        });
      }
    } catch (err) {
      // MQTT gateway unavailable — silently skip
    }
  }, 3000);

  global.io = io;
  return io;
}

module.exports = { initWebSocket };
