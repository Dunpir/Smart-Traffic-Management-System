/*
  =============================================================================
  INTELLIGENT TRAFFIC SIGNAL CONTROLLER - ARDUINO UNO / MEGA FIRMWARE
  Physical Hardware Layer: 4-Way Junction Actuator & IR Sensor Bridge
  =============================================================================
  
  Features:
  - 12 Digital Output channels for 4-way Traffic Light Heads (R/Y/G)
  - 4 Analog/Digital Input channels for Stop-line IR Obstacle Sensors
  - High-speed Serial JSON command/telemetry protocol with Node.js Backend
  - Hardware Watchdog / Fail-Safe: All-Yellow Flashing if connectivity drops
*/

#include <Arduino.h>

// ==========================================
// PIN DEFINITIONS
// ==========================================

// North Road Traffic Light (R001)
const int PIN_NORTH_RED    = 2;
const int PIN_NORTH_YELLOW = 3;
const int PIN_NORTH_GREEN  = 4;

// South Road Traffic Light (R002)
const int PIN_SOUTH_RED    = 5;
const int PIN_SOUTH_YELLOW = 6;
const int PIN_SOUTH_GREEN  = 7;

// East Road Traffic Light (R003)
const int PIN_EAST_RED     = 8;
const int PIN_EAST_YELLOW  = 9;
const int PIN_EAST_GREEN   = 10;

// West Road Traffic Light (R004)
const int PIN_WEST_RED     = 11;
const int PIN_WEST_YELLOW  = 12;
const int PIN_WEST_GREEN   = 13;

// IR Obstacle Detection Sensors (Analog/Digital Inputs)
const int PIN_IR_NORTH = A0;
const int PIN_IR_SOUTH = A1;
const int PIN_IR_EAST  = A2;
const int PIN_IR_WEST  = A3;

// Sensor Debouncing and Telemetry Rate
unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 1000;

// Watchdog timer (Failsafe mode if serial lost for > 60s)
unsigned long lastCommandReceivedTime = 0;
const unsigned long WATCHDOG_TIMEOUT_MS = 60000;
bool isFailsafeActive = false;

// ==========================================
// FUNCTION DECLARATIONS
// ==========================================
void setSignal(const String& direction, const String& state);
void readAndSendSensorTelemetry();
void processIncomingSerialCommand(String jsonCommand);
void enterFailsafeMode();

void setup() {
  // Initialize Serial Communication with Backend Gateway
  Serial.begin(9600);
  while (!Serial) {
    ; // Wait for serial port to connect
  }

  // Configure Actuator LED Pins as OUTPUT
  pinMode(PIN_NORTH_RED, OUTPUT);
  pinMode(PIN_NORTH_YELLOW, OUTPUT);
  pinMode(PIN_NORTH_GREEN, OUTPUT);

  pinMode(PIN_SOUTH_RED, OUTPUT);
  pinMode(PIN_SOUTH_YELLOW, OUTPUT);
  pinMode(PIN_SOUTH_GREEN, OUTPUT);

  pinMode(PIN_EAST_RED, OUTPUT);
  pinMode(PIN_EAST_YELLOW, OUTPUT);
  pinMode(PIN_EAST_GREEN, OUTPUT);

  pinMode(PIN_WEST_RED, OUTPUT);
  pinMode(PIN_WEST_YELLOW, OUTPUT);
  pinMode(PIN_WEST_GREEN, OUTPUT);

  // Configure IR Sensor Pins as INPUT_PULLUP
  pinMode(PIN_IR_NORTH, INPUT_PULLUP);
  pinMode(PIN_IR_SOUTH, INPUT_PULLUP);
  pinMode(PIN_IR_EAST, INPUT_PULLUP);
  pinMode(PIN_IR_WEST, INPUT_PULLUP);

  // Initial Safe Boot State: West GREEN, all others RED
  setSignal("NORTH", "RED");
  setSignal("SOUTH", "RED");
  setSignal("EAST", "RED");
  setSignal("WEST", "GREEN");

  lastCommandReceivedTime = millis();

  // Send System Online Handshake JSON to Backend
  Serial.println("{\"type\":\"HANDSHAKE\",\"status\":\"ONLINE\",\"device\":\"ARDUINO_TRAFFIC_CONTROLLER_V1\",\"junctionId\":\"J001\"}");
}

void loop() {
  unsigned long currentMillis = millis();

  // 1. Process incoming commands from Node.js Backend
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    if (input.length() > 0) {
      processIncomingSerialCommand(input);
      lastCommandReceivedTime = currentMillis;
      isFailsafeActive = false;
    }
  }

  // 2. Periodic Sensor Telemetry Broadcast
  if (currentMillis - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = currentMillis;
    readAndSendSensorTelemetry();
  }

  // 3. Failsafe Watchdog Check
  if (currentMillis - lastCommandReceivedTime > WATCHDOG_TIMEOUT_MS) {
    enterFailsafeMode();
  }
}

/**
 * Switch Red, Yellow, Green LEDs for an approach direction
 */
void setSignal(const String& direction, const String& state) {
  int redPin = 0, yellowPin = 0, greenPin = 0;

  if (direction == "NORTH") {
    redPin = PIN_NORTH_RED; yellowPin = PIN_NORTH_YELLOW; greenPin = PIN_NORTH_GREEN;
  } else if (direction == "SOUTH") {
    redPin = PIN_SOUTH_RED; yellowPin = PIN_SOUTH_YELLOW; greenPin = PIN_SOUTH_GREEN;
  } else if (direction == "EAST") {
    redPin = PIN_EAST_RED; yellowPin = PIN_EAST_YELLOW; greenPin = PIN_EAST_GREEN;
  } else if (direction == "WEST") {
    redPin = PIN_WEST_RED; yellowPin = PIN_WEST_YELLOW; greenPin = PIN_WEST_GREEN;
  } else {
    return;
  }

  if (state == "GREEN") {
    digitalWrite(redPin, LOW);
    digitalWrite(yellowPin, LOW);
    digitalWrite(greenPin, HIGH);
  } else if (state == "YELLOW") {
    digitalWrite(redPin, LOW);
    digitalWrite(yellowPin, HIGH);
    digitalWrite(greenPin, LOW);
  } else { // RED
    digitalWrite(redPin, HIGH);
    digitalWrite(yellowPin, LOW);
    digitalWrite(greenPin, LOW);
  }
}

/**
 * Reads IR Sensors and sends JSON packet to Backend
 */
void readAndSendSensorTelemetry() {
  // Low reading on active-low IR sensor indicates vehicle presence
  bool northActive = (digitalRead(PIN_IR_NORTH) == LOW);
  bool southActive = (digitalRead(PIN_IR_SOUTH) == LOW);
  bool eastActive  = (digitalRead(PIN_IR_EAST) == LOW);
  bool westActive  = (digitalRead(PIN_IR_WEST) == LOW);

  String telemetryJson = "{\"type\":\"SENSOR_POLL\",\"junctionId\":\"J001\",\"sensors\":{";
  telemetryJson += "\"NORTH\":{\"pin\":\"A0\",\"active\":" + String(northActive ? "true" : "false") + "},";
  telemetryJson += "\"SOUTH\":{\"pin\":\"A1\",\"active\":" + String(southActive ? "true" : "false") + "},";
  telemetryJson += "\"EAST\":{\"pin\":\"A2\",\"active\":" + String(eastActive ? "true" : "false") + "},";
  telemetryJson += "\"WEST\":{\"pin\":\"A3\",\"active\":" + String(westActive ? "true" : "false") + "}";
  telemetryJson += "}}";

  Serial.println(telemetryJson);
}

/**
 * Parses incoming JSON command from backend
 * Format: {"cmd":"SET_SIGNAL","dir":"WEST","sig":"GREEN"}
 */
void processIncomingSerialCommand(String jsonCommand) {
  // Simple fast substring parser for Arduino memory efficiency
  int cmdIdx = jsonCommand.indexOf("\"cmd\":\"SET_SIGNAL\"");
  if (cmdIdx >= 0) {
    int dirIdx = jsonCommand.indexOf("\"dir\":\"");
    int sigIdx = jsonCommand.indexOf("\"sig\":\"");

    if (dirIdx >= 0 && sigIdx >= 0) {
      String dir = jsonCommand.substring(dirIdx + 7, jsonCommand.indexOf("\"", dirIdx + 7));
      String sig = jsonCommand.substring(sigIdx + 7, jsonCommand.indexOf("\"", sigIdx + 7));
      setSignal(dir, sig);

      Serial.println("{\"type\":\"ACK\",\"status\":\"APPLIED\",\"dir\":\"" + dir + "\",\"sig\":\"" + sig + "\"}");
    }
  } else if (jsonCommand.indexOf("\"cmd\":\"PING\"") >= 0) {
    Serial.println("{\"type\":\"PONG\",\"timestamp\":" + String(millis()) + "}");
  }
}

/**
 * Watchdog Failsafe: Flash all Yellow lights
 */
void enterFailsafeMode() {
  isFailsafeActive = true;
  // Turn off greens and reds
  digitalWrite(PIN_NORTH_RED, LOW); digitalWrite(PIN_NORTH_GREEN, LOW);
  digitalWrite(PIN_SOUTH_RED, LOW); digitalWrite(PIN_SOUTH_GREEN, LOW);
  digitalWrite(PIN_EAST_RED, LOW);  digitalWrite(PIN_EAST_GREEN, LOW);
  digitalWrite(PIN_WEST_RED, LOW);  digitalWrite(PIN_WEST_GREEN, LOW);

  // Toggle yellow lights
  int yellowState = (millis() / 500) % 2;
  digitalWrite(PIN_NORTH_YELLOW, yellowState);
  digitalWrite(PIN_SOUTH_YELLOW, yellowState);
  digitalWrite(PIN_EAST_YELLOW, yellowState);
  digitalWrite(PIN_WEST_YELLOW, yellowState);
}
