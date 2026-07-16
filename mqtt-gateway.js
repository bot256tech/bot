/**
 * AGRICHAIN 360™ — MQTT IoT Gateway
 * 
 * Safely handles MQTT connection.
 * If no broker available, silently disables IoT features.
 * Does NOT start its own server when required as a module.
 */

let devices = {};
let sensorData = {};
let client = null;

function sendCommand(deviceId, command) {
  if (client && client.connected) {
    const topic = `agrichain360/${deviceId}/command`;
    client.publish(topic, JSON.stringify(command), { qos: 1 });
    console.log(`📤 Command sent to ${deviceId}:`, command);
  }
}

// Only connect to MQTT if broker URL is configured
try {
  const brokerUrl = process.env.MQTT_BROKER_URL;
  if (brokerUrl && brokerUrl !== 'mqtt://localhost:1883') {
    const mqtt = require('mqtt');
    client = mqtt.connect(brokerUrl, {
      clientId: 'agrichain360_gateway_' + Date.now(),
      clean: true,
      reconnectPeriod: 10000,
      connectTimeout: 5000
    });

    client.on('connect', () => {
      console.log('✅ MQTT connected to broker');
      client.subscribe('agrichain360/+/sensors', { qos: 1 });
      client.subscribe('agrichain360/+/status', { qos: 1 });
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        const deviceId = topic.split('/')[1];
        if (!devices[deviceId]) {
          devices[deviceId] = { id: deviceId, lastSeen: new Date() };
        }
        devices[deviceId].lastSeen = new Date();
        sensorData[deviceId] = { ...payload, timestamp: new Date() };
        if (global.io) {
          global.io.emit('iot-update', { deviceId, data: payload });
        }
      } catch (err) {
        // Ignore parse errors
      }
    });

    client.on('error', (err) => {
      console.warn('⚠️  MQTT error (IoT features disabled):', err.message);
    });
  } else {
    console.log('ℹ️  MQTT broker not configured — IoT features in simulation mode');
  }
} catch (err) {
  console.warn('⚠️  MQTT module failed to load — IoT features disabled:', err.message);
}

module.exports = { client, sendCommand, devices, sensorData };
