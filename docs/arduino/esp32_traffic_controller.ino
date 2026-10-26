/*
 * ============================================================================
 * INTELLIGENT TRAFFIC SIGNAL CONTROLLER - ESP32 FIRMWARE
 * 4-Way Junction Actuators + IR Sensors + RF Emergency + Siren Buzzer
 * ============================================================================
 * 
 * Hardware Target: ESP-WROOM-32 / NodeMCU-32S / ESP32 DEVKIT V1 (30/38 Pin)
 * Baud Rate: 115200 (USB Serial)
 * Dual-Mode: WebSerial USB Plug-and-Play (Recommended) + Optional Wi-Fi Sync
 *
 * EXACT PIN CONFIGURATION (AS WIRED):
 * ----------------------------------------------------------------------------
 * 1. North Approach:
 *    - Red LED    -> GPIO 2  (D2)
 *    - Yellow LED -> GPIO 4  (D4)
 *    - Green LED  -> GPIO 5  (D5)
 *    - IR Sensor  -> GPIO 32 (D32)
 *
 * 2. East Approach:
 *    - Red LED    -> GPIO 18 (D18)
 *    - Yellow LED -> GPIO 19 (D19)
 *    - Green LED  -> GPIO 21 (D21)
 *    - IR Sensor  -> GPIO 33 (D33)
 *
 * 3. South Approach:
 *    - Red LED    -> GPIO 22 (D22)
 *    - Yellow LED -> GPIO 23 (D23)
 *    - Green LED  -> GPIO 13 (D13)
 *    - IR Sensor  -> GPIO 34 (D34 - Input Only)
 *
 * 4. West Approach:
 *    - Red LED    -> GPIO 12 (D12)
 *    - Yellow LED -> GPIO 14 (D14)
 *    - Green LED  -> GPIO 27 (D27)
 *    - IR Sensor  -> GPIO 35 (D35 - Input Only)
 *
 * 5. Emergency Subsystem:
 *    - RF Receiver Data -> GPIO 26 (D26 - with 10k resistor to GND)
 *    - Active Buzzer    -> GPIO 15 (D15 - Active HIGH Siren)
 * ============================================================================
 */

#include <Arduino.h>

// ==========================================
// 1. PIN DEFINITIONS & CONSTANTS
// ==========================================
#define NUM_LANES 4

enum LaneIndex { NORTH = 0, EAST = 1, SOUTH = 2, WEST = 3 };

// Pinout: [Lane][0=Red, 1=Yellow, 2=Green]
const int signalPins[NUM_LANES][3] = {
  {2,  4,  5},   // North: Red -> D2,  Yellow -> D4,  Green -> D5
  {18, 19, 21},  // East:  Red -> D18, Yellow -> D19, Green -> D21
  {22, 23, 13},  // South: Red -> D22, Yellow -> D23, Green -> D13
  {12, 14, 27}   // West:  Red -> D12, Yellow -> D14, Green -> D27
};

const int irSensorPins[NUM_LANES] = {32, 33, 34, 35};
const char* laneNames[NUM_LANES] = {"NORTH", "EAST", "SOUTH", "WEST"};

const int rfReceiverPin = 26; // RF Data -> D26 (add 10k resistor to GND)
const int buzzerPin     = 15; // Active Buzzer (+) -> D15

// IR Sensor Active Logic Level:
// Standard FC-51 / TCRT5000 IR obstacle modules output LOW (0V) when obstacle detected.
// Change to HIGH if your sensor module outputs HIGH when triggered.
#define IR_TRIGGER_ACTIVE LOW

// ==========================================
// 2. OPTIONAL WI-FI CONFIGURATION
// (Set to true if using wireless HTTP sync instead of USB WebSerial)
// ==========================================
#define ENABLE_WIFI false
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Set to true to connect to your live production cloud backend (Render)
// Set to false to connect to your laptop's local development server
#define USE_PRODUCTION_CLOUD true
const char* PROD_CLOUD_URL = "https://smart-traffic-management-system-zhgn.onrender.com/api/hardware/esp32/sync";
const char* LOCAL_BACKEND_HOST = "192.168.1.100"; // Laptop IP if running locally
const int   LOCAL_BACKEND_PORT = 5001;

#if ENABLE_WIFI
  #include <WiFi.h>
  #include <WiFiClientSecure.h>
  #include <HTTPClient.h>
#endif

// ==========================================
// 3. SYSTEM STATE & TIMERS
// ==========================================
String currentSignals[NUM_LANES] = {"RED", "RED", "RED", "GREEN"};
bool lastIrState[NUM_LANES]      = {false, false, false, false};
bool isBuzzerActive              = false;
bool isRfEmergencyActive         = false;
bool failsafeMode                = false;

unsigned long lastSerialCommandTime = 0;
unsigned long lastHeartbeatTime     = 0;
unsigned long lastSensorScanTime    = 0;
unsigned long lastWifiSyncTime      = 0;
unsigned long buzzerToggleTime      = 0;
bool buzzerBeepState                = false;

const unsigned long HEARTBEAT_INTERVAL_MS = 1000;
const unsigned long SENSOR_SCAN_MS        = 50;
const unsigned long WATCHDOG_TIMEOUT_MS   = 30000; // 30s before failsafe yellow blink
const unsigned long WIFI_SYNC_INTERVAL_MS = 600;

// ==========================================
// 4. FUNCTION DECLARATIONS
// ==========================================
void applySignal(int lane, const String& color);
void setAllSignals(const String& north, const String& east, const String& south, const String& west);
void scanSensors();
void scanRfEmergency();
void processSerialInput();
void parseSerialCommand(const String& json);
void sendTelemetry();
void updateFailsafeWatchdog();
void handleBuzzerSound();
#if ENABLE_WIFI
  void initWiFi();
  void syncWithBackendHttp();
#endif

// ==========================================
// 5. SETUP INITIALIZATION
// ==========================================
void setup() {
  // Start high-speed hardware UART
  Serial.begin(115200);
  delay(200);

  // Initialize 12 Traffic Light Actuator Pins as OUTPUT
  for (int lane = 0; lane < NUM_LANES; lane++) {
    for (int c = 0; c < 3; c++) {
      pinMode(signalPins[lane][c], OUTPUT);
      digitalWrite(signalPins[lane][c], LOW);
    }
  }

  // Initialize IR Sensor Pins
  // GPIO 32 and 33 support internal pullups; 34 and 35 are input-only
  pinMode(irSensorPins[NORTH], INPUT_PULLUP);
  pinMode(irSensorPins[EAST],  INPUT_PULLUP);
  pinMode(irSensorPins[SOUTH], INPUT);
  pinMode(irSensorPins[WEST],  INPUT);

  // Initialize RF Emergency & Buzzer Pins
  pinMode(rfReceiverPin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  digitalWrite(buzzerPin, LOW);

  // Boot sequence: brief 300ms LED test
  for (int lane = 0; lane < NUM_LANES; lane++) {
    digitalWrite(signalPins[lane][2], HIGH); // Green on
  }
  digitalWrite(buzzerPin, HIGH);
  delay(150);
  digitalWrite(buzzerPin, LOW);
  delay(150);
  for (int lane = 0; lane < NUM_LANES; lane++) {
    digitalWrite(signalPins[lane][2], LOW); // Green off
  }

  // Set default initial intersection state: West GREEN, all others RED
  setAllSignals("RED", "RED", "RED", "GREEN");

  lastSerialCommandTime = millis();

  // Transmit Ready Handshake to Website
  Serial.println("{\"type\":\"HANDSHAKE\",\"status\":\"ONLINE\",\"device\":\"ESP32_TRAFFIC_CONTROLLER\",\"baud\":115200,\"lanes\":4}");

#if ENABLE_WIFI
  initWiFi();
#endif
}

// ==========================================
// 6. MAIN CONTROLLER LOOP
// ==========================================
void loop() {
  unsigned long now = millis();

  // 1. Process incoming commands from WebSerial (USB)
  processSerialInput();

  // 2. Scan Stop-Line IR Sensors for vehicles
  if (now - lastSensorScanTime >= SENSOR_SCAN_MS) {
    lastSensorScanTime = now;
    scanSensors();
    scanRfEmergency();
  }

  // 3. Periodic Telemetry Heartbeat to Website
  if (now - lastHeartbeatTime >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatTime = now;
    sendTelemetry();
  }

  // 4. Emergency & Pedestrian Siren Pulsing
  handleBuzzerSound();

  // 5. Watchdog Failsafe (Flash yellow if website disconnects for > 30s)
  updateFailsafeWatchdog();

#if ENABLE_WIFI
  // 6. Optional WiFi HTTP sync
  if (WiFi.status() == WL_CONNECTED && (now - lastWifiSyncTime >= WIFI_SYNC_INTERVAL_MS)) {
    lastWifiSyncTime = now;
    syncWithBackendHttp();
  }
#endif
}

// ==========================================
// 7. HARDWARE ACTUATION
// ==========================================
void applySignal(int lane, const String& color) {
  if (lane < 0 || lane >= NUM_LANES) return;

  int redPin    = signalPins[lane][0];
  int yellowPin = signalPins[lane][1];
  int greenPin  = signalPins[lane][2];

  currentSignals[lane] = color;

  if (color == "GREEN") {
    digitalWrite(redPin, LOW);
    digitalWrite(yellowPin, LOW);
    digitalWrite(greenPin, HIGH);
  } else if (color == "YELLOW") {
    digitalWrite(redPin, LOW);
    digitalWrite(yellowPin, HIGH);
    digitalWrite(greenPin, LOW);
  } else { // RED (Default safe)
    digitalWrite(redPin, HIGH);
    digitalWrite(yellowPin, LOW);
    digitalWrite(greenPin, LOW);
  }
}

void setAllSignals(const String& north, const String& east, const String& south, const String& west) {
  applySignal(NORTH, north);
  applySignal(EAST, east);
  applySignal(SOUTH, south);
  applySignal(WEST, west);
}

// ==========================================
// 8. SENSOR & RF INTERRUPT SCANNING
// ==========================================
void scanSensors() {
  for (int i = 0; i < NUM_LANES; i++) {
    int raw = digitalRead(irSensorPins[i]);
    bool isDetected = (raw == IR_TRIGGER_ACTIVE);

    // State change event: transmit to website immediately
    if (isDetected != lastIrState[i]) {
      lastIrState[i] = isDetected;

      Serial.print("{\"type\":\"EVENT\",\"event\":\"IR_STATE\",\"lane\":\"");
      Serial.print(laneNames[i]);
      Serial.print("\",\"active\":");
      Serial.print(isDetected ? "true" : "false");
      Serial.println("}");
    }
  }
}

void scanRfEmergency() {
  // RF Receiver pin: HIGH indicates RF transmitter button pressed (Ambulance siren trigger)
  int rfVal = digitalRead(rfReceiverPin);
  bool rfTriggered = (rfVal == HIGH);

  if (rfTriggered && !isRfEmergencyActive) {
    isRfEmergencyActive = true;
    isBuzzerActive = true;

    // Transmit instant emergency alert to website
    Serial.println("{\"type\":\"EVENT\",\"event\":\"RF_EMERGENCY\",\"lane\":\"EAST\",\"vehicle\":\"AMBULANCE\"}");
  } else if (!rfTriggered && isRfEmergencyActive) {
    isRfEmergencyActive = false;
  }
}

// ==========================================
// 9. SERIAL PROTOCOL & JSON PARSER
// ==========================================
void processSerialInput() {
  while (Serial.available() > 0) {
    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.length() > 0) {
      lastSerialCommandTime = millis();
      failsafeMode = false;
      parseSerialCommand(line);
    }
  }
}

String extractJsonString(const String& json, const String& key) {
  String searchKey = "\"" + key + "\":\"";
  int startIdx = json.indexOf(searchKey);
  if (startIdx == -1) {
    // Try without quotes around value
    return "";
  }
  startIdx += searchKey.length();
  int endIdx = json.indexOf("\"", startIdx);
  if (endIdx == -1) return "";
  return json.substring(startIdx, endIdx);
}

int extractJsonInt(const String& json, const String& key) {
  String searchKey = "\"" + key + "\":";
  int startIdx = json.indexOf(searchKey);
  if (startIdx == -1) return -1;
  startIdx += searchKey.length();
  while (startIdx < json.length() && (json[startIdx] == ' ' || json[startIdx] == '\"')) {
    startIdx++;
  }
  int endIdx = startIdx;
  while (endIdx < json.length() && isDigit(json[endIdx])) {
    endIdx++;
  }
  return json.substring(startIdx, endIdx).toInt();
}

void parseSerialCommand(const String& json) {
  // Command: SET_SIGNALS (Multi-Lane Full Update)
  // Format: {"cmd":"SET_SIGNALS","signals":{"NORTH":"RED","EAST":"RED","SOUTH":"RED","WEST":"GREEN"},"buzzer":0}
  if (json.indexOf("\"SET_SIGNALS\"") >= 0) {
    String n = extractJsonString(json, "NORTH");
    String e = extractJsonString(json, "EAST");
    String s = extractJsonString(json, "SOUTH");
    String w = extractJsonString(json, "WEST");

    // STRICT SAFETY CHECK: Ensure at most ONE lane can ever be GREEN!
    int greenCount = (n == "GREEN" ? 1 : 0) + (e == "GREEN" ? 1 : 0) + (s == "GREEN" ? 1 : 0) + (w == "GREEN" ? 1 : 0);
    if (greenCount > 1) {
      String activeDir = extractJsonString(json, "activeDir");
      n = (activeDir == "NORTH") ? "GREEN" : "RED";
      e = (activeDir == "EAST") ? "GREEN" : "RED";
      s = (activeDir == "SOUTH") ? "GREEN" : "RED";
      w = (activeDir == "WEST") ? "GREEN" : "RED";
    }

    if (n.length() > 0) applySignal(NORTH, n);
    if (e.length() > 0) applySignal(EAST, e);
    if (s.length() > 0) applySignal(SOUTH, s);
    if (w.length() > 0) applySignal(WEST, w);

    int bz = extractJsonInt(json, "buzzer");
    if (bz != -1) {
      isBuzzerActive = (bz == 1);
    }

    Serial.println("{\"type\":\"ACK\",\"status\":\"APPLIED\"}");
    return;
  }

  // Command: SET_SIGNAL (Single Lane Direct Override with Single-Green Safety Interlock)
  // Format: {"cmd":"SET_SIGNAL","dir":"WEST","sig":"GREEN"}
  if (json.indexOf("\"SET_SIGNAL\"") >= 0) {
    String dir = extractJsonString(json, "dir");
    String sig = extractJsonString(json, "sig");

    int targetLane = -1;
    if (dir == "NORTH") targetLane = NORTH;
    else if (dir == "EAST") targetLane = EAST;
    else if (dir == "SOUTH") targetLane = SOUTH;
    else if (dir == "WEST") targetLane = WEST;

    if (targetLane != -1 && sig.length() > 0) {
      if (sig == "GREEN") {
        // STRICT SAFETY INTERLOCK: Only ONE green light can exist at any time!
        for (int l = 0; l < NUM_LANES; l++) {
          if (l == targetLane) {
            applySignal(l, "GREEN");
          } else {
            applySignal(l, "RED");
          }
        }
      } else {
        applySignal(targetLane, sig);
      }
      Serial.println("{\"type\":\"ACK\",\"status\":\"APPLIED\",\"dir\":\"" + dir + "\",\"sig\":\"" + sig + "\"}");
    }
    return;
  }

  // Command: BUZZER Manual Override
  // Format: {"cmd":"BUZZER","state":1}
  if (json.indexOf("\"BUZZER\"") >= 0) {
    int state = extractJsonInt(json, "state");
    isBuzzerActive = (state == 1);
    Serial.println("{\"type\":\"ACK\",\"status\":\"BUZZER_SET\",\"active\":" + String(isBuzzerActive ? "true" : "false") + "}");
    return;
  }

  // Command: ALL_RED (Immediate Safety Lock)
  if (json.indexOf("\"ALL_RED\"") >= 0) {
    setAllSignals("RED", "RED", "RED", "RED");
    Serial.println("{\"type\":\"ACK\",\"status\":\"ALL_RED_LOCKED\"}");
    return;
  }

  // Command: PING -> Respond with PONG
  if (json.indexOf("\"PING\"") >= 0) {
    Serial.println("{\"type\":\"PONG\",\"uptime\":" + String(millis()) + "}");
    return;
  }
}

// ==========================================
// 10. TELEMETRY TRANSMISSION
// ==========================================
void sendTelemetry() {
  String payload = "{\"type\":\"TELEMETRY\",\"lanes\":{";
  for (int i = 0; i < NUM_LANES; i++) {
    payload += "\"" + String(laneNames[i]) + "\":{";
    payload += "\"sig\":\"" + currentSignals[i] + "\",";
    payload += "\"ir\":" + String(lastIrState[i] ? "true" : "false");
    payload += "}";
    if (i < NUM_LANES - 1) payload += ",";
  }
  payload += "},\"rf\":" + String(isRfEmergencyActive ? "true" : "false");
  payload += ",\"buzzer\":" + String(isBuzzerActive ? "true" : "false");
  payload += "}";

  Serial.println(payload);
}

// ==========================================
// 11. BUZZER AUDIBLE ALARM PATTERN
// ==========================================
void handleBuzzerSound() {
  if (isBuzzerActive) {
    // Beep with 120ms cycle (audible warning chirp)
    unsigned long now = millis();
    if (now - buzzerToggleTime >= 120) {
      buzzerToggleTime = now;
      buzzerBeepState = !buzzerBeepState;
      digitalWrite(buzzerPin, buzzerBeepState ? HIGH : LOW);
    }
  } else {
    digitalWrite(buzzerPin, LOW);
  }
}

// ==========================================
// 12. WATCHDOG FAILSAFE MODE
// ==========================================
void updateFailsafeWatchdog() {
  unsigned long now = millis();
  if (now - lastSerialCommandTime > WATCHDOG_TIMEOUT_MS) {
    failsafeMode = true;

    // Flash Yellow lights at 1Hz (500ms ON / 500ms OFF)
    bool yellowState = ((now / 500) % 2 == 0);

    for (int lane = 0; lane < NUM_LANES; lane++) {
      digitalWrite(signalPins[lane][0], LOW); // Red off
      digitalWrite(signalPins[lane][2], LOW); // Green off
      digitalWrite(signalPins[lane][1], yellowState ? HIGH : LOW); // Yellow blink
    }
  }
}

// ==========================================
// 13. OPTIONAL WI-FI HTTP CLIENT SYNC
// ==========================================
#if ENABLE_WIFI
void initWiFi() {
  Serial.print("Connecting to Wi-Fi SSID: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void syncWithBackendHttp() {
  HTTPClient http;
  bool beginSuccess = false;

  #if USE_PRODUCTION_CLOUD
    WiFiClientSecure secureClient;
    secureClient.setInsecure(); // Skip certificate verification for cloud REST endpoint
    beginSuccess = http.begin(secureClient, PROD_CLOUD_URL);
  #else
    String url = "http://" + String(LOCAL_BACKEND_HOST) + ":" + String(LOCAL_BACKEND_PORT) + "/api/hardware/esp32/sync";
    beginSuccess = http.begin(url);
  #endif

  if (beginSuccess) {
    http.addHeader("Content-Type", "application/json");

    // Send IR sensor array [NORTH, EAST, SOUTH, WEST] and RF status
    String body = "{\"ir\":[";
    for (int i = 0; i < NUM_LANES; i++) {
      body += String(lastIrState[i] ? "1" : "0");
      if (i < NUM_LANES - 1) body += ",";
    }
    body += "],\"rfEmergency\":" + String(isRfEmergencyActive ? "true" : "false") + "}";

    int httpCode = http.POST(body);
    if (httpCode == HTTP_CODE_OK) {
      String response = http.getString();
      lastSerialCommandTime = millis();
      failsafeMode = false;
      parseSerialCommand(response);
    }
    http.end();
  }
}
#endif
