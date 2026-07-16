/**
 * AGRICHAIN 360™ — MQTT IoT Gateway
 * Real MQTT broker connection for IoT devices (ESP32, sensors, etc.)
 * 
 * This is a fully working gateway.
 * Run with: node mqtt-gateway.js
 */

const mqtt = require('mqtt');
const express = require('express');

// In-memory device store (replace with DB later)
let devices = {};
let sensorData = {};

// Connect to public Mosquitto test broker (free)
const client = mqtt.connect('mqtt://test.mosquitto.org', {
  clientId: 'agrichain360_gateway_' + Date.now(),
  clean: true,
  reconnectPeriod: 5000
});

client.on('connect', () => {
  console.log('✅ [MQTT Gateway] Connected to Mosquitto broker');
  
  // Subscribe to all AGRICHAIN topics
  client.subscribe('agrichain360/+/sensors', { qos: 1 });
  client.subscribe('agrichain360/+/status', { qos: 1 });
  client.subscribe('agrichain360/+/command', { qos: 1 });
  
  console.log('📡 Subscribed to AGRICHAIN 360 topics');
});

client.on('message', (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    const deviceId = topic.split('/')[1];
    
    console.log(`📥 [MQTT] ${topic} →`, payload);
    
    // Store latest data
    if (!devices[deviceId]) {
      devices[deviceId] = { id: deviceId, lastSeen: new Date() };
    }
    
    devices[deviceId].lastSeen = new Date();
    sensorData[deviceId] = { ...payload, timestamp: new Date() };
    
    // Broadcast to connected web clients (via WebSocket in future)
    if (global.io) {
      global.io.emit('iot-update', { deviceId, data: payload });
    }
    
  } catch (err) {
    console.error('MQTT parse error:', err.message);
  }
});

// Publish command to a device
function sendCommand(deviceId, command) {
  const topic = `agrichain360/${deviceId}/command`;
  client.publish(topic, JSON.stringify(command), { qos: 1 });
  console.log(`📤 Command sent to ${deviceId}:`, command);
}

// REST API for the gateway
const app = express();
app.use(express.json());

app.get('/devices', (req, res) => {
  res.json(Object.values(devices));
});

app.get('/devices/:id', (req, res) => {
  const data = sensorData[req.params.id];
  if (data) res.json(data);
  else res.status(404).json({ error: 'Device not found' });
});

app.post('/devices/:id/command', (req, res) => {
  sendCommand(req.params.id, req.body);
  res.json({ success: true, message: 'Command sent' });
});

// Start gateway server
const PORT = process.env.MQTT_PORT || 1884;
app.listen(PORT, () => {
  console.log(`🚀 MQTT Gateway running on port ${PORT}`);
  console.log(`   Devices: http://localhost:${PORT}/devices`);
});

// Export for use in main server
module.exports = { client, sendCommand, devices, sensorData };