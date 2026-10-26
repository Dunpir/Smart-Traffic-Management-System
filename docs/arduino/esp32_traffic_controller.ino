/*
 * ============================================================================
 * INTELLIGENT TRAFFIC SIGNAL CONTROLLER - ESP32 FIRMWARE (v2.0 PRODUCTION)
 * 4-Way Junction Actuators + IR Sensors + RF Emergency + Siren Buzzer
 * ============================================================================
 * 
 * Hardware Target: ESP-WROOM-32 / NodeMCU-32S / ESP32 DEVKIT V1 (30/38 Pin)
 * Baud Rate: 115200 (USB Serial)
 * Supported Modes:
 *   1. USB WebSerial Duplex Link (Chrome / Edge / Brave) - 1:1 Live Mimic of Simulation Tab
 *   2. Autonomous Standby Cycling - Safe local 4-way cycle if USB is disconnected (NO annoying blinking yellow lockup!)
 *   3. Optional Wi-Fi Cloud Sync
 *
 * EXACT PIN ASSIGNMENTS:
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
// 1. HARDWARE OUTPUT & SENSOR POLARITY
// ==========================================
// Set to true if using an Active-LOW Relay Module (where LOW turns relay ON).
// Set to false if connecting direct LEDs with series resistors (HIGH turns LED ON).
#define ACTIVE_LOW_OUTPUTS false

// IR Obstacle Sensor Output Logic Level:
// Standard FC-51 / TCRT5000 IR sensor modules output LOW when an obstacle is detected.
#define IR_TRIGGER_ACTIVE LOW

// ==========================================
// 2. PIN DEFINITIONS & CONSTANTS
// ==========================================
#define NUM_LANES 4

enum LaneIndex { NORTH = 0, EAST = 1, SOUTH = 2, WEST = 3 };

// Pinout matrix: [Lane][0=Red, 1=Yellow, 2=Green]
const int signalPins[NUM_LANES][3] = {
  {2,  4,  5},   // North: Red -> D2,  Yellow -> D4,  Green -> D5
  {18, 19, 21},  // East:  Red -> D18, Yellow -> D19, Green -> D21
  {22, 23, 13},  // South: Red -> D22, Yellow -> D23, Green -> D13
  {12, 14, 27}   // West:  Red -> D12, Yellow -> D14, Green -> D27
};

const int irSensorPins[NUM_LANES] = {32, 33, 34, 35};
const char* laneNames[NUM_LANES] = {"NORTH", "EAST", "SOUTH", "WEST"};

const int rfReceiverPin = 26; // RF Data -> D26 (10k resistor to GND)
const int buzzerPin     = 15; // Active Buzzer (+) -> D15

// ==========================================
// 3. OPTIONAL WI-FI CONFIGURATION
// (Set to true only if using wireless sync instead of USB WebSerial)
// ==========================================
#define ENABLE_WIFI false
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

#define USE_PRODUCTION_CLOUD true
const char* PROD_CLOUD_URL = "https://smart-traffic-management-system-zhgn.onrender.com/api/hardware/esp32/sync";
const char* LOCAL_BACKEND_HOST = "192.168.1.100";
const int   LOCAL_BACKEND_PORT = 5001;

#if ENABLE_WIFI
  #include <WiFi.h>
  #include <WiFiClientSecure.h>
  #include <HTTPClient.h>
#endif

// ==========================================
// 4. SYSTEM STATE & TIMERS
// ==========================================
String currentSignals[NUM_LANES] = {"RED", "RED", "RED", "RED"};
bool lastIrState[NUM_LANES]      = {false, false, false, false};
bool isBuzzerActive              = false;
bool isRfEmergencyActive         = false;

// Operating Mode:
// true  = Website / Simulation is actively controlling the physical lights in real time
// false = Running autonomous 4-way fallback cycling (North -> East -> South -> West)
bool isOnlineMode = false;

unsigned long lastSerialCommandTime = 0;
unsigned long lastHeartbeatTime     = 0;
unsigned long lastSensorScanTime    = 0;
unsigned long lastWifiSyncTime      = 0;
unsigned long buzzerToggleTime      = 0;
bool buzzerBeepState                = false;

// Standby Autonomous Cycle Timing
unsigned long standbyPhaseStartTime = 0;
int standbyActiveLane               = NORTH;
int standbyPhaseState               = 0; // 0 = GREEN, 1 = YELLOW

const unsigned long STANDBY_GREEN_MS  = 7000; // 7 seconds green per lane in standby
const unsigned long STANDBY_YELLOW_MS = 2000; // 2 seconds yellow transition
const unsigned long OFFLINE_TIMEOUT_MS = 8000; // After 8s of no USB commands, resume standby cycle
const unsigned long HEARTBEAT_INTERVAL_MS = 1000;
const unsigned long SENSOR_SCAN_MS        = 50;
const unsigned long WIFI_SYNC_INTERVAL_MS = 600;

// ==========================================
// 5. HELPER: HARDWARE PIN WRITE WITH POLARITY
// ==========================================
void writePin(int pin, bool state) {
#if ACTIVE_LOW_OUTPUTS
  digitalWrite(pin, state ? LOW : HIGH);
#else
  digitalWrite(pin, state ? HIGH : LOW);
#endif
}

// ==========================================
// 6. HARDWARE ACTUATION WITH STRICT SINGLE-GREEN RULE
// ==========================================
void applySignal(int lane, const String& color) {
  if (lane < 0 || lane >= NUM_LANES) return;

  currentSignals[lane] = color;

  // STRICT SINGLE-GREEN RULE: If lane is GREEN, all other lanes MUST be RED!
  if (color == "GREEN") {
    for (int l = 0; l < NUM_LANES; l++) {
      if (l == lane) {
        writePin(signalPins[l][0], false); // Red OFF
        writePin(signalPins[l][1], false); // Yellow OFF
        writePin(signalPins[l][2], true);  // Green ON
        currentSignals[l] = "GREEN";
      } else {
        writePin(signalPins[l][0], true);  // Red ON
        writePin(signalPins[l][1], false); // Yellow OFF
        writePin(signalPins[l][2], false); // Green OFF
        currentSignals[l] = "RED";
      }
    }
    return;
  }

  // Normal Yellow or Red for target lane
  int redPin    = signalPins[lane][0];
  int yellowPin = signalPins[lane][1];
  int greenPin  = signalPins[lane][2];

  if (color == "YELLOW") {
    writePin(redPin, false);
    writePin(yellowPin, true);
    writePin(greenPin, false);
  } else { // RED (Safe default)
    writePin(redPin, true);
    writePin(yellowPin, false);
    writePin(greenPin, false);
  }
}

void setAllSignals(const String& north, const String& east, const String& south, const String& west) {
  // If any direction is GREEN, apply that direction last so it forces others RED
  if (north == "GREEN") {
    applySignal(EAST, east);
    applySignal(SOUTH, south);
    applySignal(WEST, west);
    applySignal(NORTH, "GREEN");
  } else if (east == "GREEN") {
    applySignal(NORTH, north);
    applySignal(SOUTH, south);
    applySignal(WEST, west);
    applySignal(EAST, "GREEN");
  } else if (south == "GREEN") {
    applySignal(NORTH, north);
    applySignal(EAST, east);
    applySignal(WEST, west);
    applySignal(SOUTH, "GREEN");
  } else if (west == "GREEN") {
    applySignal(NORTH, north);
    applySignal(EAST, east);
    applySignal(SOUTH, south);
    applySignal(WEST, "GREEN");
  } else {
    // All red or transitions
    applySignal(NORTH, north);
    applySignal(EAST, east);
    applySignal(SOUTH, south);
    applySignal(WEST, west);
  }
}

// ==========================================
// 7. AUTONOMOUS STANDBY CYCLING (NO FREEZE / NO BLINKING STUCK)
// ==========================================
void runAutonomousStandbyCycle() {
  unsigned long now = millis();
  unsigned long elapsed = now - standbyPhaseStartTime;

  if (standbyPhaseState == 0) {
    // State 0: Current Lane GREEN
    if (elapsed >= STANDBY_GREEN_MS) {
      standbyPhaseState = 1; // Transition to Yellow
      standbyPhaseStartTime = now;
      applySignal(standbyActiveLane, "YELLOW");
    }
  } else {
    // State 1: Current Lane YELLOW
    if (elapsed >= STANDBY_YELLOW_MS) {
      // Advance to next lane
      standbyActiveLane = (standbyActiveLane + 1) % NUM_LANES;
      standbyPhaseState = 0; // Next lane GREEN
      standbyPhaseStartTime = now;
      applySignal(standbyActiveLane, "GREEN");
    }
  }
}

// ==========================================
// 8. SENSOR & RF INTERRUPT SCANNING
// ==========================================
void scanSensors() {
  for (int i = 0; i < NUM_LANES; i++) {
    int raw = digitalRead(irSensorPins[i]);
    bool isDetected = (raw == IR_TRIGGER_ACTIVE);

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
  int rfVal = digitalRead(rfReceiverPin);
  bool rfTriggered = (rfVal == HIGH);

  if (rfTriggered && !isRfEmergencyActive) {
    isRfEmergencyActive = true;
    isBuzzerActive = true;
    Serial.println("{\"type\":\"EVENT\",\"event\":\"RF_EMERGENCY\",\"lane\":\"EAST\",\"vehicle\":\"AMBULANCE\"}");
  } else if (!rfTriggered && isRfEmergencyActive) {
    isRfEmergencyActive = false;
  }
}

// ==========================================
// 9. STRING JSON PARSER & SERIAL PROTOCOL
// ==========================================
String extractJsonString(const String& json, const String& key) {
  String searchKey = "\"" + key + "\":\"";
  int startIdx = json.indexOf(searchKey);
  if (startIdx == -1) return "";
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
  // Command: SET_SIGNALS (Multi-Lane Full Update from Simulation Tab)
  if (json.indexOf("\"SET_SIGNALS\"") >= 0) {
    String n = extractJsonString(json, "NORTH");
    String e = extractJsonString(json, "EAST");
    String s = extractJsonString(json, "SOUTH");
    String w = extractJsonString(json, "WEST");

    // STRICT SAFETY CHECK: Ensure only ONE lane is GREEN
    int greenCount = (n == "GREEN" ? 1 : 0) + (e == "GREEN" ? 1 : 0) + (s == "GREEN" ? 1 : 0) + (w == "GREEN" ? 1 : 0);
    if (greenCount > 1) {
      String activeDir = extractJsonString(json, "activeDir");
      n = (activeDir == "NORTH") ? "GREEN" : "RED";
      e = (activeDir == "EAST")  ? "GREEN" : "RED";
      s = (activeDir == "SOUTH") ? "GREEN" : "RED";
      w = (activeDir == "WEST")  ? "GREEN" : "RED";
    }

    setAllSignals(
      n.length() > 0 ? n : "RED",
      e.length() > 0 ? e : "RED",
      s.length() > 0 ? s : "RED",
      w.length() > 0 ? w : "RED"
    );

    int bz = extractJsonInt(json, "buzzer");
    if (bz != -1) {
      isBuzzerActive = (bz == 1);
    }

    Serial.println("{\"type\":\"ACK\",\"status\":\"APPLIED\"}");
    return;
  }

  // Command: SET_SIGNAL (Single Lane Direct Override)
  if (json.indexOf("\"SET_SIGNAL\"") >= 0) {
    String dir = extractJsonString(json, "dir");
    String sig = extractJsonString(json, "sig");

    int targetLane = -1;
    if (dir == "NORTH") targetLane = NORTH;
    else if (dir == "EAST") targetLane = EAST;
    else if (dir == "SOUTH") targetLane = SOUTH;
    else if (dir == "WEST") targetLane = WEST;

    if (targetLane != -1 && sig.length() > 0) {
      applySignal(targetLane, sig);
      Serial.println("{\"type\":\"ACK\",\"status\":\"APPLIED\",\"dir\":\"" + dir + "\",\"sig\":\"" + sig + "\"}");
    }
    return;
  }

  // Command: BUZZER Manual Override
  if (json.indexOf("\"BUZZER\"") >= 0) {
    int state = extractJsonInt(json, "state");
    isBuzzerActive = (state == 1);
    Serial.println("{\"type\":\"ACK\",\"status\":\"BUZZER_SET\",\"active\":" + String(isBuzzerActive ? "true" : "false") + "}");
    return;
  }

  // Command: ALL_RED (Safety Freeze)
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

void processSerialInput() {
  while (Serial.available() > 0) {
    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.length() > 0) {
      lastSerialCommandTime = millis();
      isOnlineMode = true; // Switch to website online mode immediately
      parseSerialCommand(line);
    }
  }
}

// ==========================================
// 10. TELEMETRY TRANSMISSION (TO WEBSITE)
// ==========================================
void sendTelemetry() {
  String payload = "{\"type\":\"TELEMETRY\",\"mode\":\"" + String(isOnlineMode ? "ONLINE" : "STANDBY") + "\",\"lanes\":{";
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
// 12. SETUP INITIALIZATION
// ==========================================
void setup() {
  // Start high-speed hardware UART
  Serial.begin(115200);
  delay(150);

  // Initialize 12 Traffic Light Actuator Pins as OUTPUT
  for (int lane = 0; lane < NUM_LANES; lane++) {
    for (int c = 0; c < 3; c++) {
      pinMode(signalPins[lane][c], OUTPUT);
      writePin(signalPins[lane][c], false);
    }
  }

  // Initialize IR Sensor Pins
  pinMode(irSensorPins[NORTH], INPUT_PULLUP);
  pinMode(irSensorPins[EAST],  INPUT_PULLUP);
  pinMode(irSensorPins[SOUTH], INPUT);
  pinMode(irSensorPins[WEST],  INPUT);

  // Initialize RF Emergency & Buzzer Pins
  pinMode(rfReceiverPin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  digitalWrite(buzzerPin, LOW);

  // Quick 200ms power-on LED self-test
  for (int lane = 0; lane < NUM_LANES; lane++) {
    writePin(signalPins[lane][2], true); // Green on
  }
  digitalWrite(buzzerPin, HIGH);
  delay(100);
  digitalWrite(buzzerPin, LOW);
  delay(100);
  for (int lane = 0; lane < NUM_LANES; lane++) {
    writePin(signalPins[lane][2], false); // Green off
  }

  // Start in safe autonomous standby: North GREEN, all others RED
  standbyActiveLane = NORTH;
  standbyPhaseState = 0;
  standbyPhaseStartTime = millis();
  applySignal(NORTH, "GREEN");

  // Transmit Ready Handshake
  Serial.println("{\"type\":\"HANDSHAKE\",\"status\":\"ONLINE\",\"device\":\"ESP32_TRAFFIC_CONTROLLER_V2\",\"baud\":115200,\"lanes\":4}");

#if ENABLE_WIFI
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
#endif
}

// ==========================================
// 13. MAIN CONTROLLER LOOP
// ==========================================
void loop() {
  unsigned long now = millis();

  // 1. Read incoming commands from USB WebSerial
  processSerialInput();

  // 2. Scan Stop-Line IR Sensors and RF Receiver
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

  // 4. Emergency / Pedestrian Buzzer Sounding
  handleBuzzerSound();

  // 5. Execution Logic: Online Slave vs Standby Autonomous Cycle
  if (isOnlineMode) {
    // If website stopped sending commands for > 8s, safely resume standby cycle
    if (now - lastSerialCommandTime > OFFLINE_TIMEOUT_MS) {
      isOnlineMode = false;
      standbyActiveLane = NORTH;
      standbyPhaseState = 0;
      standbyPhaseStartTime = now;
      applySignal(NORTH, "GREEN");
    }
  } else {
    // Run smooth 4-way autonomous cycle (North -> East -> South -> West)
    runAutonomousStandbyCycle();
  }
}
