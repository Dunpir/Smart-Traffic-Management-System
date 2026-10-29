/*
 * INTELLIGENT TRAFFIC SIGNAL CONTROLLER
 * ESP32 DevKit V1 / ESP-WROOM-32
 * Firmware v3.0 - Manual/Automatic Web Serial Control
 *
 * Serial: 115200 baud, newline-delimited JSON
 *
 * Commands:
 * {"cmd":"SET_MODE","mode":"MANUAL"}
 * {"cmd":"SET_MODE","mode":"AUTO"}
 * {"cmd":"SET_SIGNAL","dir":"EAST","sig":"GREEN"}
 * {"cmd":"SET_SIGNALS","NORTH":"RED","EAST":"GREEN","SOUTH":"RED","WEST":"RED"}
 * {"cmd":"ALL_RED"}
 * {"cmd":"BUZZER","state":1}
 * {"cmd":"POLARITY","activeLow":1}
 * {"cmd":"PING"}
 *
 * Outputs assume LED anode -> resistor -> GPIO,
 * LED cathode -> GND. Set activeLowOutputs = true
 * for active-low relay boards.
 */

#include <Arduino.h>

bool activeLowOutputs = false;
#define IR_TRIGGER_ACTIVE LOW

const int NUM_LANES = 4;

enum Lane { NORTH = 0, EAST = 1, SOUTH = 2, WEST = 3 };
enum SignalColor { RED = 0, YELLOW = 1, GREEN = 2 };
enum ControlMode { MODE_AUTO, MODE_MANUAL };

const int signalPins[NUM_LANES][3] = {
  {2,  4,  5},    // North: Red, Yellow, Green
  {18, 19, 21},   // East
  {22, 23, 13},   // South
  {12, 14, 27}    // West
};

const int irPins[NUM_LANES] = {32, 33, 34, 35};
const char* laneNames[NUM_LANES] = {
  "NORTH", "EAST", "SOUTH", "WEST"
};

const int rfPin = 26;
const int buzzerPin = 15;

const unsigned long GREEN_MS = 7000;
const unsigned long YELLOW_MS = 2000;
const unsigned long SENSOR_SCAN_MS = 50;
const unsigned long TELEMETRY_MS = 1000;
const unsigned long BUZZER_TOGGLE_MS = 120;

ControlMode controlMode = MODE_AUTO;

SignalColor signals[NUM_LANES] = {
  RED, RED, RED, RED
};

bool irActive[NUM_LANES] = {false, false, false, false};
bool rfActive = false;
bool previousRf = false;
bool manualBuzzer = false;
bool buzzerOutput = false;

unsigned long lastSensorScan = 0;
unsigned long lastTelemetry = 0;
unsigned long lastBuzzerToggle = 0;
unsigned long phaseStarted = 0;

int autoLane = NORTH;
bool yellowPhase = false;

char inputBuffer[256];
size_t inputLength = 0;

// --------------------------------------------------
// GPIO and signal handling
// --------------------------------------------------

void writeOutput(int pin, bool on) {
  digitalWrite(pin, activeLowOutputs
                   ? (on ? LOW : HIGH)
                   : (on ? HIGH : LOW));
}

void allLightsOff() {
  for (int lane = 0; lane < NUM_LANES; lane++) {
    for (int c = 0; c < 3; c++) {
      writeOutput(signalPins[lane][c], false);
    }
  }
}

int laneFromName(const String& name) {
  for (int i = 0; i < NUM_LANES; i++) {
    if (name == laneNames[i]) return i;
  }
  return -1;
}

int colorFromName(const String& name) {
  if (name == "RED") return RED;
  if (name == "YELLOW") return YELLOW;
  if (name == "GREEN") return GREEN;
  return -1;
}

const char* colorName(SignalColor color) {
  switch (color) {
    case RED:    return "RED";
    case YELLOW: return "YELLOW";
    case GREEN:  return "GREEN";
  }
  return "RED";
}

void sendError(const char* message) {
  Serial.print("{\"type\":\"ERROR\",\"message\":\"");
  Serial.print(message);
  Serial.println("\"}");
}

void sendAck(const char* status) {
  Serial.print("{\"type\":\"ACK\",\"status\":\"");
  Serial.print(status);
  Serial.println("\"}");
}

// Single function to update signal outputs with direct pin writes (no blackout/flicker)
// A GREEN request makes every other lane RED (Single-Green Safety Rule)
bool setSignals(int targetLane, SignalColor requested) {
  if (targetLane < 0 || targetLane >= NUM_LANES) {
    return false;
  }

  for (int lane = 0; lane < NUM_LANES; lane++) {
    SignalColor targetCol = (lane == targetLane) ? requested : RED;
    for (int c = 0; c < 3; c++) {
      writeOutput(signalPins[lane][c], (c == targetCol));
    }
    signals[lane] = targetCol;
  }
  return true;
}

bool setFourSignals(const String requested[NUM_LANES]) {
  int greenLane = -1;
  int greenCount = 0;
  SignalColor parsed[NUM_LANES];

  for (int i = 0; i < NUM_LANES; i++) {
    int color = colorFromName(requested[i]);

    if (color < 0) {
      sendError("INVALID_SIGNAL");
      return false;
    }

    parsed[i] = (SignalColor)color;

    if (parsed[i] == GREEN) {
      greenLane = i;
      greenCount++;
    }
  }

  // STRICT SINGLE-GREEN SAFETY INTERLOCK:
  // Under NO condition may more than one direction have GREEN.
  if (greenCount > 1) {
    sendError("MULTIPLE_GREENS");
    return false;
  }

  if (greenCount == 1) {
    // Force all non-green lanes strictly to RED
    for (int i = 0; i < NUM_LANES; i++) {
      if (i != greenLane) {
        parsed[i] = RED;
      }
    }
  }

  // Apply target states directly without full-off intermediate flicker
  for (int lane = 0; lane < NUM_LANES; lane++) {
    for (int c = 0; c < 3; c++) {
      writeOutput(signalPins[lane][c], (c == parsed[lane]));
    }
    signals[lane] = parsed[lane];
  }

  return true;
}

unsigned long lastHostCommand = 0;
const unsigned long HOST_TIMEOUT_MS = 15000;

void enterManualMode() {
  controlMode = MODE_MANUAL;
}

void enterAutoMode() {
  controlMode = MODE_AUTO;
  // If host is active, do not force jump to NORTH; allow host simulation to command sequence
  if (lastHostCommand == 0 || millis() - lastHostCommand >= HOST_TIMEOUT_MS) {
    autoLane = NORTH;
    yellowPhase = false;
    phaseStarted = millis();
    setSignals(autoLane, GREEN);
  }
}

// --------------------------------------------------
// Simple JSON field readers
// Accept ordinary JSON.stringify() output.
// --------------------------------------------------

int findValueStart(const String& json, const String& key) {
  String pattern = "\"" + key + "\"";
  int p = json.indexOf(pattern);

  if (p < 0) return -1;

  p = json.indexOf(':', p + pattern.length());
  if (p < 0) return -1;

  p++;
  while (p < (int)json.length() &&
         (json[p] == ' ' || json[p] == '\t')) {
    p++;
  }

  return p;
}

String jsonString(const String& json, const String& key) {
  int p = findValueStart(json, key);
  if (p < 0 || json[p] != '"') return "";

  int end = json.indexOf('"', p + 1);
  if (end < 0) return "";

  return json.substring(p + 1, end);
}

int jsonInt(const String& json, const String& key, int fallback = -1) {
  int p = findValueStart(json, key);
  if (p < 0) return fallback;

  if (json[p] == '"') p++;

  if (p >= (int)json.length()) return fallback;

  int end = p;
  if (json[end] == '-') end++;

  while (end < (int)json.length() && isDigit(json[end])) {
    end++;
  }

  if (end == p) return fallback;
  return json.substring(p, end).toInt();
}

// --------------------------------------------------
// Command processing
// --------------------------------------------------

void processCommand(const String& json) {
  if (json.indexOf("\"cmd\"") < 0) {
    sendError("MISSING_CMD");
    return;
  }

  // Any valid command proves host is active and controlling the intersection
  lastHostCommand = millis();

  String cmd = jsonString(json, "cmd");

  if (cmd == "PING") {
    Serial.print("{\"type\":\"PONG\",\"uptime\":");
    Serial.print(millis());
    Serial.println("}");
    return;
  }

  if (cmd == "SET_MODE") {
    String mode = jsonString(json, "mode");

    if (mode == "MANUAL") {
      enterManualMode();
      sendAck("MODE_MANUAL");
    } else if (mode == "AUTO") {
      enterAutoMode();
      sendAck("MODE_AUTO");
    } else {
      sendError("INVALID_MODE");
    }
    return;
  }

  if (cmd == "SET_SIGNAL") {
    String dir = jsonString(json, "dir");
    String sig = jsonString(json, "sig");

    int lane = laneFromName(dir);
    int color = colorFromName(sig);

    if (lane < 0 || color < 0) {
      sendError("INVALID_LANE_OR_SIGNAL");
      return;
    }

    // Any direct signal command takes ownership from AUTO.
    enterManualMode();

    if (setSignals(lane, (SignalColor)color)) {
      Serial.print("{\"type\":\"ACK\",\"status\":\"APPLIED\",");
      Serial.print("\"mode\":\"MANUAL\",\"dir\":\"");
      Serial.print(dir);
      Serial.print("\",\"sig\":\"");
      Serial.print(sig);
      Serial.println("\"}");
    }
    return;
  }

  if (cmd == "SET_SIGNALS") {
    String requested[NUM_LANES];

    for (int i = 0; i < NUM_LANES; i++) {
      requested[i] = jsonString(json, laneNames[i]);

      if (requested[i] == "") {
        sendError("MISSING_LANE");
        return;
      }
    }

    // Validate before taking control.
    for (int i = 0; i < NUM_LANES; i++) {
      if (colorFromName(requested[i]) < 0) {
        sendError("INVALID_SIGNAL");
        return;
      }
    }

    String reqMode = jsonString(json, "mode");
    if (reqMode == "MANUAL") {
      enterManualMode();
    } else if (reqMode == "AUTO") {
      enterAutoMode();
    }
    // If no mode is specified, preserve current controlMode so AUTO mode isn't overridden

    if (setFourSignals(requested)) {
      sendAck("APPLIED");
    }

    int bz = jsonInt(json, "buzzer", -1);
    if (bz >= 0) {
      manualBuzzer = (bz == 1);
    }
    return;
  }

  if (cmd == "ALL_RED") {
    enterManualMode();

    String requested[NUM_LANES] = {
      "RED", "RED", "RED", "RED"
    };

    if (setFourSignals(requested)) {
      sendAck("ALL_RED_MANUAL");
    }
    return;
  }

  if (cmd == "BUZZER") {
    int state = jsonInt(json, "state");

    if (state != 0 && state != 1) {
      sendError("INVALID_BUZZER_STATE");
      return;
    }

    manualBuzzer = (state == 1);
    sendAck("BUZZER_SET");
    return;
  }

  if (cmd == "POLARITY") {
    int al = jsonInt(json, "activeLow", 0);
    activeLowOutputs = (al == 1);
    sendAck("POLARITY_SET");
    return;
  }

  sendError("UNKNOWN_COMMAND");
}

// --------------------------------------------------
// Non-blocking serial line reader
// --------------------------------------------------

void processSerialInput() {
  while (Serial.available() > 0) {
    char c = (char)Serial.read();

    if (c == '\r') continue;

    if (c == '\n') {
      inputBuffer[inputLength] = '\0';

      if (inputLength > 0) {
        processCommand(String(inputBuffer));
      }

      inputLength = 0;
      continue;
    }

    if (inputLength < sizeof(inputBuffer) - 1) {
      inputBuffer[inputLength++] = c;
    } else {
      inputLength = 0;
      sendError("COMMAND_TOO_LONG");
    }
  }
}

// --------------------------------------------------
// Sensors and RF emergency input
// --------------------------------------------------

void scanSensors() {
  for (int i = 0; i < NUM_LANES; i++) {
    bool detected = (digitalRead(irPins[i]) == IR_TRIGGER_ACTIVE);

    if (detected != irActive[i]) {
      irActive[i] = detected;

      Serial.print("{\"type\":\"EVENT\",\"event\":\"IR_STATE\",");
      Serial.print("\"lane\":\"");
      Serial.print(laneNames[i]);
      Serial.print("\",\"active\":");
      Serial.print(detected ? "true" : "false");
      Serial.println("}");
    }
  }

  rfActive = (digitalRead(rfPin) == HIGH);

  if (rfActive && !previousRf) {
    Serial.println(
      "{\"type\":\"EVENT\",\"event\":\"RF_EMERGENCY\","
      "\"lane\":\"EAST\",\"vehicle\":\"AMBULANCE\"}"
    );
  }

  previousRf = rfActive;
}

void handleBuzzer() {
  bool shouldSound = manualBuzzer || rfActive;
  unsigned long now = millis();

  if (!shouldSound) {
    buzzerOutput = false;
    digitalWrite(buzzerPin, LOW);
    return;
  }

  if (now - lastBuzzerToggle >= BUZZER_TOGGLE_MS) {
    lastBuzzerToggle = now;
    buzzerOutput = !buzzerOutput;
    digitalWrite(buzzerPin, buzzerOutput ? HIGH : LOW);
  }
}

// --------------------------------------------------
// Autonomous cycle
// --------------------------------------------------

void runAutoCycle() {
  unsigned long now = millis();

  if (!yellowPhase && now - phaseStarted >= GREEN_MS) {
    yellowPhase = true;
    phaseStarted = now;
    setSignals(autoLane, YELLOW);
  } else if (yellowPhase &&
             now - phaseStarted >= YELLOW_MS) {
    autoLane = (autoLane + 1) % NUM_LANES;
    yellowPhase = false;
    phaseStarted = now;
    setSignals(autoLane, GREEN);
  }
}

// --------------------------------------------------
// Telemetry
// --------------------------------------------------

void sendTelemetry() {
  Serial.print("{\"type\":\"TELEMETRY\",\"mode\":\"");
  Serial.print(controlMode == MODE_MANUAL ? "MANUAL" : "AUTO");
  Serial.print("\",\"lanes\":{");

  for (int i = 0; i < NUM_LANES; i++) {
    if (i > 0) Serial.print(",");

    Serial.print("\"");
    Serial.print(laneNames[i]);
    Serial.print("\":{\"sig\":\"");
    Serial.print(colorName(signals[i]));
    Serial.print("\",\"ir\":");
    Serial.print(irActive[i] ? "true" : "false");
    Serial.print("}");
  }

  Serial.print("},\"rf\":");
  Serial.print(rfActive ? "true" : "false");
  Serial.print(",\"buzzer\":");
  Serial.print((manualBuzzer || rfActive) ? "true" : "false");
  Serial.print(",\"uptime\":");
  Serial.print(millis());
  Serial.println("}");
}

// --------------------------------------------------
// Setup and main loop
// --------------------------------------------------

void setup() {
  Serial.begin(115200);

  // Set every LED output to a known OFF state.
  for (int lane = 0; lane < NUM_LANES; lane++) {
    for (int c = 0; c < 3; c++) {
      digitalWrite(signalPins[lane][c],
                   activeLowOutputs ? HIGH : LOW);
      pinMode(signalPins[lane][c], OUTPUT);
    }
  }

  pinMode(irPins[NORTH], INPUT_PULLUP);
  pinMode(irPins[EAST], INPUT_PULLUP);
  pinMode(irPins[SOUTH], INPUT);
  pinMode(irPins[WEST], INPUT);

  // External pull-down on RF input
  pinMode(rfPin, INPUT);

  pinMode(buzzerPin, OUTPUT);
  digitalWrite(buzzerPin, LOW);

  phaseStarted = millis();
  setSignals(NORTH, GREEN);

  Serial.println(
    "{\"type\":\"HANDSHAKE\",\"status\":\"ONLINE\","
    "\"device\":\"ESP32_TRAFFIC_CONTROLLER_V3\","
    "\"baud\":115200}"
  );
}

void loop() {
  unsigned long now = millis();

  processSerialInput();

  if (now - lastSensorScan >= SENSOR_SCAN_MS) {
    lastSensorScan = now;
    scanSensors();
  }

  // Standalone autonomous cycle ONLY runs when host is not connected and controlling
  bool hostActive = (lastHostCommand > 0 && (now - lastHostCommand < HOST_TIMEOUT_MS));
  if (controlMode == MODE_AUTO && !hostActive) {
    runAutoCycle();
  }

  handleBuzzer();

  if (now - lastTelemetry >= TELEMETRY_MS) {
    lastTelemetry = now;
    sendTelemetry();
  }
}
