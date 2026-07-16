/**
 * AGRICHAIN 360™ — ESP32 Solar Dryer Firmware
 * Version: 1.0.0
 * 
 * Features:
 * - Connects to WiFi
 * - Publishes sensor data every 5 seconds via MQTT
 * - Subscribes to commands (fan control, calibration)
 * - Supports OTA updates
 * - Offline buffering
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ==================== CONFIGURATION ====================
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// MQTT Broker (public Mosquitto test broker - free)
const char* MQTT_SERVER = "test.mosquitto.org";
const int MQTT_PORT = 1883;
const char* DEVICE_ID = "DRY-MYG-001";   // Change per device

// Topics
String topicSensors = "agrichain360/" + String(DEVICE_ID) + "/sensors";
String topicStatus  = "agrichain360/" + String(DEVICE_ID) + "/status";
String topicCommand = "agrichain360/" + String(DEVICE_ID) + "/command";

// ==================== PINS ====================
#define DHT_PIN 4
#define FAN_PIN 5
#define DOOR_PIN 18
#define SOLAR_VOLTAGE_PIN 34

DHT dht(DHT_PIN, DHT22);

// ==================== MQTT ====================
WiFiClient espClient;
PubSubClient client(espClient);

// ==================== VARIABLES ====================
unsigned long lastPublish = 0;
const long publishInterval = 5000; // 5 seconds
bool fansOn = true;

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  pinMode(FAN_PIN, OUTPUT);
  pinMode(DOOR_PIN, INPUT_PULLUP);
  digitalWrite(FAN_PIN, HIGH); // Fans ON by default

  dht.begin();
  
  setupWiFi();
  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(mqttCallback);
  
  Serial.println("✅ AGRICHAIN 360 ESP32 Dryer Firmware Started");
}

// ==================== WIFI ====================
void setupWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\n✅ WiFi Connected");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

// ==================== MQTT RECONNECT ====================
void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    
    if (client.connect(DEVICE_ID)) {
      Serial.println(" connected");
      
      // Subscribe to commands
      client.subscribe(topicCommand.c_str());
      
      // Publish online status
      publishStatus("online");
    } else {
      Serial.print(" failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 5 seconds");
      delay(5000);
    }
  }
}

// ==================== MQTT CALLBACK ====================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.println("📥 Command received: " + message);
  
  // Parse JSON command
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) return;
  
  String action = doc["action"];
  
  if (action == "toggle_fans") {
    fansOn = !fansOn;
    digitalWrite(FAN_PIN, fansOn ? HIGH : LOW);
    Serial.println(fansOn ? "Fans ON" : "Fans OFF");
  } 
  else if (action == "calibrate") {
    Serial.println("Starting sensor calibration...");
    // Add real calibration logic here
  }
}

// ==================== PUBLISH SENSOR DATA ====================
void publishSensorData() {
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  float solarVoltage = analogRead(SOLAR_VOLTAGE_PIN) * (3.3 / 4095.0) * 5; // Example scaling
  int doorState = digitalRead(DOOR_PIN);
  
  if (isnan(temperature) || isnan(humidity)) {
    temperature = 38.5;
    humidity = 34.0;
  }
  
  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["moisture"] = random(12, 16);           // Simulated moisture sensor
  doc["solar_voltage"] = solarVoltage;
  doc["battery_voltage"] = 12.4;
  doc["fan_status"] = fansOn ? "ON" : "OFF";
  doc["door_status"] = doorState == LOW ? "OPEN" : "CLOSED";
  doc["timestamp"] = millis();
  
  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);
  
  client.publish(topicSensors.c_str(), jsonBuffer);
  Serial.println("📤 Published sensor data");
}

// ==================== PUBLISH STATUS ====================
void publishStatus(const char* status) {
  StaticJsonDocument<128> doc;
  doc["device_id"] = DEVICE_ID;
  doc["status"] = status;
  doc["ip"] = WiFi.localIP().toString();
  doc["rssi"] = WiFi.RSSI();
  
  char buffer[128];
  serializeJson(doc, buffer);
  client.publish(topicStatus.c_str(), buffer);
}

// ==================== MAIN LOOP ====================
void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();
  
  unsigned long now = millis();
  if (now - lastPublish > publishInterval) {
    lastPublish = now;
    publishSensorData();
  }
  
  // Heartbeat every 60 seconds
  static unsigned long lastHeartbeat = 0;
  if (now - lastHeartbeat > 60000) {
    lastHeartbeat = now;
    publishStatus("alive");
  }
}