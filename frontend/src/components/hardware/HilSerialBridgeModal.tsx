import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Cpu,
  Radio,
  Usb,
  Wifi,
  Copy,
  Check,
  Zap,
  Activity,
  Terminal,
  ShieldCheck,
  Send,
  Trash2,
  Volume2,
  AlertTriangle,
  Play,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { HardwareState, Direction, LightState } from '../../types';
import { soundEffects } from '../../utils/soundEffects';
import { webSerialService, SerialLogEntry } from '../../services/webSerialService';

interface HilSerialBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  hardwareState: HardwareState | null;
}

export const HilSerialBridgeModal: React.FC<HilSerialBridgeModalProps> = ({
  isOpen,
  onClose,
  hardwareState,
}) => {
  const [connectionType, setConnectionType] = useState<'WEBSERIAL' | 'WIFI_SYNC' | 'FIRMWARE'>('WEBSERIAL');
  const [baudRate, setBaudRate] = useState<number>(115200);
  const [isConnected, setIsConnected] = useState<boolean>(webSerialService.getIsConnected());
  const [portName, setPortName] = useState<string>(webSerialService.getPortName() || 'ESP32 (CP2102 / CH340)');
  const [copied, setCopied] = useState<boolean>(false);
  const [serialLogs, setSerialLogs] = useState<SerialLogEntry[]>(webSerialService.getLogs());
  const [manualCmd, setManualCmd] = useState<string>('');
  const [activeLow, setActiveLow] = useState<boolean>(webSerialService.getPolarity());

  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    setIsConnected(webSerialService.getIsConnected());
    setPortName(webSerialService.getPortName() || 'ESP32 (CP2102 / CH340)');
    setSerialLogs(webSerialService.getLogs());
    setActiveLow(webSerialService.getPolarity());

    const unsubStatus = webSerialService.subscribeStatus((connected, port) => {
      setIsConnected(connected);
      if (port) setPortName(port);
    });

    const unsubLogs = webSerialService.subscribeLogs((entry) => {
      setSerialLogs((prev) => [entry, ...prev.slice(0, 99)]);
    });

    return () => {
      unsubStatus();
      unsubLogs();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnectSerial = async () => {
    soundEffects.playClick();
    const res = await webSerialService.connect(baudRate);
    if (res.success) {
      setIsConnected(true);
      setPortName(webSerialService.getPortName());
    }
  };

  const handleDisconnect = async () => {
    soundEffects.playClick();
    await webSerialService.disconnect();
    setIsConnected(false);
  };

  const handleSendManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCmd.trim()) return;
    await webSerialService.writeLine(manualCmd.trim());
    setManualCmd('');
  };

  const handleTestGreen = async (dir: Direction) => {
    soundEffects.playClick();
    await webSerialService.testSignal(dir, 'GREEN');
  };

  const handleTestAllRed = async () => {
    soundEffects.playClick();
    await webSerialService.testAllRed();
  };

  const handleTestBuzzer = async () => {
    soundEffects.playClick();
    await webSerialService.testBuzzer(true);
    setTimeout(async () => {
      await webSerialService.testBuzzer(false);
    }, 600);
  };

  const handleTogglePolarity = async () => {
    soundEffects.playClick();
    const next = !activeLow;
    setActiveLow(next);
    await webSerialService.setPolarity(next);
  };

  const esp32SampleCode = `/*
 * ============================================================================
 * INTELLIGENT TRAFFIC SIGNAL CONTROLLER - ESP32 FIRMWARE (v2.0 PRODUCTION)
 * 4-Way Junction Actuators + IR Sensors + RF Emergency + Siren Buzzer
 * ============================================================================
 * 
 * Hardware Target: ESP-WROOM-32 / NodeMCU-32S / ESP32 DEVKIT V1 (30/38 Pin)
 * Baud Rate: 115200 (USB Serial)
 *
 * EXACT PIN ASSIGNMENTS:
 * ----------------------------------------------------------------------------
 * 1. North Approach: Red -> GPIO 2,  Yellow -> GPIO 4,  Green -> GPIO 5,  IR -> GPIO 32
 * 2. East Approach:  Red -> GPIO 18, Yellow -> GPIO 19, Green -> GPIO 21, IR -> GPIO 33
 * 3. South Approach: Red -> GPIO 22, Yellow -> GPIO 23, Green -> GPIO 13, IR -> GPIO 34
 * 4. West Approach:  Red -> GPIO 12, Yellow -> GPIO 14, Green -> GPIO 27, IR -> GPIO 35
 * 5. Emergency Subsystem:
 *    - RF Receiver Data -> GPIO 26 (with 10k pull-down to GND)
 *    - Active Buzzer    -> GPIO 15 (Active HIGH Siren)
 * ============================================================================
 */

#include <Arduino.h>

// Set to true if using an Active-LOW Relay Module, false for direct LEDs
bool activeLowOutputs = false;
#define IR_TRIGGER_ACTIVE LOW

#define NUM_LANES 4
enum LaneIndex { NORTH = 0, EAST = 1, SOUTH = 2, WEST = 3 };

const int signalPins[NUM_LANES][3] = {
  {2,  4,  5},   // North: Red, Yellow, Green
  {18, 19, 21},  // East:  Red, Yellow, Green
  {22, 23, 13},  // South: Red, Yellow, Green
  {12, 14, 27}   // West:  Red, Yellow, Green
};

const int irSensorPins[NUM_LANES] = {32, 33, 34, 35};
const char* laneNames[NUM_LANES] = {"NORTH", "EAST", "SOUTH", "WEST"};

const int rfReceiverPin = 26; // RF Data -> D26 (10k resistor to GND)
const int buzzerPin     = 15; // Active Buzzer (+) -> D15

// Optional Wi-Fi Cloud Sync
#define ENABLE_WIFI false
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

String currentSignals[NUM_LANES] = {"RED", "RED", "RED", "RED"};
bool lastIrState[NUM_LANES]      = {false, false, false, false};
bool isBuzzerActive              = false;
bool isRfEmergencyActive         = false;
bool isOnlineMode                = false;

unsigned long lastSerialCommandTime = 0;
unsigned long lastHeartbeatTime     = 0;
unsigned long lastSensorScanTime    = 0;
unsigned long buzzerToggleTime      = 0;
bool buzzerBeepState                = false;

// Standby Autonomous Cycle Timing
unsigned long standbyPhaseStartTime = 0;
int standbyActiveLane               = NORTH;
int standbyPhaseState               = 0;

const unsigned long STANDBY_GREEN_MS   = 7000;
const unsigned long STANDBY_YELLOW_MS  = 2000;
const unsigned long OFFLINE_TIMEOUT_MS = 20000; // 20s watchdog
const unsigned long HEARTBEAT_INTERVAL_MS = 1000;
const unsigned long SENSOR_SCAN_MS        = 50;

void writePin(int pin, bool state) {
  if (activeLowOutputs) {
    digitalWrite(pin, state ? LOW : HIGH);
  } else {
    digitalWrite(pin, state ? HIGH : LOW);
  }
}

void applySignal(int lane, const String& color) {
  if (lane < 0 || lane >= NUM_LANES) return;
  currentSignals[lane] = color;

  // STRICT SINGLE-GREEN INVARIANT
  if (color == "GREEN") {
    for (int l = 0; l < NUM_LANES; l++) {
      if (l == lane) {
        writePin(signalPins[l][0], false);
        writePin(signalPins[l][1], false);
        writePin(signalPins[l][2], true);
        currentSignals[l] = "GREEN";
      } else {
        writePin(signalPins[l][0], true);
        writePin(signalPins[l][1], false);
        writePin(signalPins[l][2], false);
        currentSignals[l] = "RED";
      }
    }
    return;
  }

  int redPin    = signalPins[lane][0];
  int yellowPin = signalPins[lane][1];
  int greenPin  = signalPins[lane][2];

  if (color == "YELLOW") {
    writePin(redPin, false);
    writePin(yellowPin, true);
    writePin(greenPin, false);
  } else {
    writePin(redPin, true);
    writePin(yellowPin, false);
    writePin(greenPin, false);
  }
}

void setAllSignals(const String& north, const String& east, const String& south, const String& west) {
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
    applySignal(NORTH, north);
    applySignal(EAST, east);
    applySignal(SOUTH, south);
    applySignal(WEST, west);
  }
}

void runAutonomousStandbyCycle() {
  unsigned long now = millis();
  unsigned long elapsed = now - standbyPhaseStartTime;

  if (standbyPhaseState == 0) {
    if (elapsed >= STANDBY_GREEN_MS) {
      standbyPhaseState = 1;
      standbyPhaseStartTime = now;
      applySignal(standbyActiveLane, "YELLOW");
    }
  } else {
    if (elapsed >= STANDBY_YELLOW_MS) {
      standbyActiveLane = (standbyActiveLane + 1) % NUM_LANES;
      standbyPhaseState = 0;
      standbyPhaseStartTime = now;
      applySignal(standbyActiveLane, "GREEN");
    }
  }
}

void scanSensors() {
  for (int i = 0; i < NUM_LANES; i++) {
    int raw = digitalRead(irSensorPins[i]);
    bool isDetected = (raw == IR_TRIGGER_ACTIVE);

    if (isDetected != lastIrState[i]) {
      lastIrState[i] = isDetected;
      Serial.print("{\\"type\\":\\"EVENT\\",\\"event\\":\\"IR_STATE\\",\\"lane\\":\\"");
      Serial.print(laneNames[i]);
      Serial.print("\\",\\"active\\":");
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
    Serial.println("{\\"type\\":\\"EVENT\\",\\"event\\":\\"RF_EMERGENCY\\",\\"lane\\":\\"EAST\\",\\"vehicle\\":\\"AMBULANCE\\"}");
  } else if (!rfTriggered && isRfEmergencyActive) {
    isRfEmergencyActive = false;
  }
}

String extractJsonString(const String& json, const String& key) {
  int keyIdx = json.indexOf("\\"" + key + "\\"");
  if (keyIdx == -1) return "";
  int colonIdx = json.indexOf(":", keyIdx);
  if (colonIdx == -1) return "";
  int firstQuote = json.indexOf("\\"", colonIdx);
  if (firstQuote == -1) return "";
  int secondQuote = json.indexOf("\\"", firstQuote + 1);
  if (secondQuote == -1) return "";
  return json.substring(firstQuote + 1, secondQuote);
}

int extractJsonInt(const String& json, const String& key) {
  int keyIdx = json.indexOf("\\"" + key + "\\"");
  if (keyIdx == -1) return -1;
  int colonIdx = json.indexOf(":", keyIdx);
  if (colonIdx == -1) return -1;
  int startIdx = colonIdx + 1;
  while (startIdx < json.length() && (json[startIdx] == ' ' || json[startIdx] == '\\"')) {
    startIdx++;
  }
  int endIdx = startIdx;
  while (endIdx < json.length() && isDigit(json[endIdx])) {
    endIdx++;
  }
  if (startIdx == endIdx) return -1;
  return json.substring(startIdx, endIdx).toInt();
}

void parseSerialCommand(const String& json) {
  if (json.indexOf("\\"SET_SIGNALS\\"") >= 0) {
    String n = extractJsonString(json, "NORTH");
    String e = extractJsonString(json, "EAST");
    String s = extractJsonString(json, "SOUTH");
    String w = extractJsonString(json, "WEST");

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
    if (bz != -1) isBuzzerActive = (bz == 1);
    Serial.println("{\\"type\\":\\"ACK\\",\\"status\\":\\"APPLIED\\"}");
    return;
  }

  if (json.indexOf("\\"SET_SIGNAL\\"") >= 0) {
    String dir = extractJsonString(json, "dir");
    String sig = extractJsonString(json, "sig");
    int targetLane = -1;
    if (dir == "NORTH") targetLane = NORTH;
    else if (dir == "EAST") targetLane = EAST;
    else if (dir == "SOUTH") targetLane = SOUTH;
    else if (dir == "WEST") targetLane = WEST;

    if (targetLane != -1 && sig.length() > 0) {
      applySignal(targetLane, sig);
      Serial.println("{\\"type\\":\\"ACK\\",\\"status\\":\\"APPLIED\\",\\"dir\\":\\"" + dir + "\\",\\"sig\\":\\"" + sig + "\\"}");
    }
    return;
  }

  if (json.indexOf("\\"POLARITY\\"") >= 0) {
    int al = extractJsonInt(json, "activeLow");
    if (al != -1) {
      activeLowOutputs = (al == 1);
      setAllSignals(currentSignals[NORTH], currentSignals[EAST], currentSignals[SOUTH], currentSignals[WEST]);
      Serial.println("{\\"type\\":\\"ACK\\",\\"status\\":\\"POLARITY_SET\\",\\"activeLow\\":" + String(activeLowOutputs ? "true" : "false") + "}");
    }
    return;
  }

  if (json.indexOf("\\"BUZZER\\"") >= 0) {
    int state = extractJsonInt(json, "state");
    isBuzzerActive = (state == 1);
    Serial.println("{\\"type\\":\\"ACK\\",\\"status\\":\\"BUZZER_SET\\",\\"active\\":" + String(isBuzzerActive ? "true" : "false") + "}");
    return;
  }

  if (json.indexOf("\\"ALL_RED\\"") >= 0) {
    setAllSignals("RED", "RED", "RED", "RED");
    Serial.println("{\\"type\\":\\"ACK\\",\\"status\\":\\"ALL_RED_LOCKED\\"}");
    return;
  }

  if (json.indexOf("\\"PING\\"") >= 0) {
    Serial.println("{\\"type\\":\\"PONG\\",\\"uptime\\":" + String(millis()) + "}");
    return;
  }
}

void processSerialInput() {
  while (Serial.available() > 0) {
    String line = Serial.readStringUntil('\\n');
    line.trim();
    if (line.length() > 0) {
      lastSerialCommandTime = millis();
      isOnlineMode = true;
      parseSerialCommand(line);
    }
  }
}

void sendTelemetry() {
  String payload = "{\\"type\\":\\"TELEMETRY\\",\\"mode\\":\\"" + String(isOnlineMode ? "ONLINE" : "STANDBY") + "\\",\\"lanes\\":{";
  for (int i = 0; i < NUM_LANES; i++) {
    payload += "\\"" + String(laneNames[i]) + "\\":{";
    payload += "\\"sig\\":\\"" + currentSignals[i] + "\\",";
    payload += "\\"ir\\":" + String(lastIrState[i] ? "true" : "false");
    payload += "}";
    if (i < NUM_LANES - 1) payload += ",";
  }
  payload += "},\\"rf\\":" + String(isRfEmergencyActive ? "true" : "false");
  payload += ",\\"buzzer\\":" + String(isBuzzerActive ? "true" : "false");
  payload += "}";
  Serial.println(payload);
}

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

void setup() {
  Serial.begin(115200);
  Serial.setTimeout(20);
  delay(150);

  for (int lane = 0; lane < NUM_LANES; lane++) {
    for (int c = 0; c < 3; c++) {
      pinMode(signalPins[lane][c], OUTPUT);
      writePin(signalPins[lane][c], false);
    }
  }

  pinMode(irSensorPins[NORTH], INPUT_PULLUP);
  pinMode(irSensorPins[EAST],  INPUT_PULLUP);
  pinMode(irSensorPins[SOUTH], INPUT);
  pinMode(irSensorPins[WEST],  INPUT);

  pinMode(rfReceiverPin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  digitalWrite(buzzerPin, LOW);

  // Power-on self-test
  for (int lane = 0; lane < NUM_LANES; lane++) writePin(signalPins[lane][2], true);
  digitalWrite(buzzerPin, HIGH);
  delay(100);
  digitalWrite(buzzerPin, LOW);
  delay(100);
  for (int lane = 0; lane < NUM_LANES; lane++) writePin(signalPins[lane][2], false);

  standbyActiveLane = NORTH;
  standbyPhaseState = 0;
  standbyPhaseStartTime = millis();
  applySignal(NORTH, "GREEN");

  Serial.println("{\\"type\\":\\"HANDSHAKE\\",\\"status\\":\\"ONLINE\\",\\"device\\":\\"ESP32_TRAFFIC_CONTROLLER_V2\\",\\"baud\\":115200,\\"lanes\\":4}");
}

void loop() {
  unsigned long now = millis();

  processSerialInput();

  if (now - lastSensorScanTime >= SENSOR_SCAN_MS) {
    lastSensorScanTime = now;
    scanSensors();
    scanRfEmergency();
  }

  if (now - lastHeartbeatTime >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatTime = now;
    sendTelemetry();
  }

  handleBuzzerSound();

  if (isOnlineMode) {
    if (now - lastSerialCommandTime > OFFLINE_TIMEOUT_MS) {
      isOnlineMode = false;
      standbyActiveLane = NORTH;
      standbyPhaseState = 0;
      standbyPhaseStartTime = now;
      applySignal(NORTH, "GREEN");
    }
  } else {
    runAutonomousStandbyCycle();
  }
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(esp32SampleCode);
    soundEffects.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSafari =
    typeof navigator !== 'undefined' &&
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/80 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-950/50">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  ESP32 Microcontroller HIL Serial Bridge
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  WebSerial 115200 Baud
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Physical Traffic Light Actuator &amp; Sensor Telemetry Gateway
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center px-5 py-2.5 bg-slate-900/60 border-b border-slate-800 gap-2 shrink-0">
          <button
            onClick={() => {
              soundEffects.playClick();
              setConnectionType('WEBSERIAL');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
              connectionType === 'WEBSERIAL'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Usb className="w-3.5 h-3.5" />
            <span>USB WebSerial (Active)</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setConnectionType('FIRMWARE');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
              connectionType === 'FIRMWARE'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Copy ESP32 Sketch (.ino)</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setConnectionType('WIFI_SYNC');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
              connectionType === 'WIFI_SYNC'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Wi-Fi Cloud Sync</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {connectionType === 'WEBSERIAL' && (
            <div className="space-y-4 font-mono text-xs">
              {/* Safari Warning Banner */}
              {isSafari && (
                <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/60 text-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Apple Safari Does Not Support WebSerial USB</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-100/90">
                    Safari restricts direct serial port hardware access. Please use <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.
                  </p>
                </div>
              )}

              {/* Connection Banner Card */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <span className="relative flex h-3.5 w-3.5">
                    {isConnected && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                        isConnected ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>STATUS: {isConnected ? 'CONNECTED TO ESP32' : 'DISCONNECTED'}</span>
                      {isConnected && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                          LIVE DUPLEX (HEARTBEAT 1.5s)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                      Port: <span className="text-cyan-300">{portName}</span> • 115200 Baud, 8-N-1
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  {!isConnected ? (
                    <button
                      onClick={handleConnectSerial}
                      className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-cyan-600/30"
                    >
                      <Usb className="w-4 h-4" />
                      <span>Select Port &amp; Connect USB</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleDisconnect}
                      className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <span>Disconnect ESP32</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Actuator Test Toolbar (Immediate Physical Verification) */}
              {isConnected && (
                <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Instant Hardware Test (Click to Verify LEDs &amp; Buzzer)</span>
                    </span>
                    <button
                      onClick={handleTogglePolarity}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black border border-cyan-500/50 text-cyan-300 hover:text-white text-[10px] cursor-pointer transition"
                    >
                      {activeLow ? <ToggleRight className="w-3.5 h-3.5 text-amber-400" /> : <ToggleLeft className="w-3.5 h-3.5 text-zinc-400" />}
                      <span>Polarity: {activeLow ? 'Active LOW (Relay)' : 'Active HIGH (Direct LED)'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                    {(['NORTH', 'EAST', 'SOUTH', 'WEST'] as Direction[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => handleTestGreen(d)}
                        className="py-1.5 px-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/60 font-bold text-center cursor-pointer transition shadow-xs"
                      >
                        {d} GREEN
                      </button>
                    ))}
                    <button
                      onClick={handleTestAllRed}
                      className="py-1.5 px-2 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-600/60 font-bold text-center cursor-pointer transition shadow-xs"
                    >
                      ALL RED
                    </button>
                    <button
                      onClick={handleTestBuzzer}
                      className="py-1.5 px-2 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-600/60 font-bold text-center cursor-pointer transition shadow-xs flex items-center justify-center gap-1"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>BUZZER</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Exact Pinout Mapping Table */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-cyan-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>ESP32 Physical Pinout Wiring Configuration</span>
                  </span>
                  <span className="text-[10px] text-slate-400">3.3V Logic Level</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-slate-400 font-bold">NORTH APPROACH</div>
                    <div className="text-emerald-400 font-bold mt-1">R:D2 • Y:D4 • G:D5</div>
                    <div className="text-[10px] text-cyan-400 mt-0.5">IR Sensor: GPIO 32</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-slate-400 font-bold">EAST APPROACH</div>
                    <div className="text-emerald-400 font-bold mt-1">R:D18 • Y:D19 • G:D21</div>
                    <div className="text-[10px] text-cyan-400 mt-0.5">IR Sensor: GPIO 33</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-slate-400 font-bold">SOUTH APPROACH</div>
                    <div className="text-emerald-400 font-bold mt-1">R:D22 • Y:D23 • G:D13</div>
                    <div className="text-[10px] text-cyan-400 mt-0.5">IR Sensor: GPIO 34</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-slate-400 font-bold">WEST APPROACH</div>
                    <div className="text-emerald-400 font-bold mt-1">R:D12 • Y:D14 • G:D27</div>
                    <div className="text-[10px] text-cyan-400 mt-0.5">IR Sensor: GPIO 35</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between px-3">
                    <span className="text-slate-400">Emergency RF Receiver:</span>
                    <span className="text-amber-400 font-bold">GPIO 26 (+10k to GND)</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between px-3">
                    <span className="text-slate-400">Active Siren Buzzer:</span>
                    <span className="text-rose-400 font-bold">GPIO 15 (Active HIGH)</span>
                  </div>
                </div>
              </div>

              {/* Real-Time Live Serial Monitor Console */}
              <div className="p-4 rounded-2xl bg-black border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">Live Serial Telemetry Stream</span>
                    <span className="text-[10px] text-zinc-400">TX = Green, RX = Cyan</span>
                  </div>
                  <button
                    onClick={() => webSerialService.clearLogs()}
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>

                <div className="h-44 overflow-y-auto space-y-1 font-mono text-[11px] pr-1">
                  {serialLogs.length === 0 ? (
                    <div className="text-zinc-500 py-6 text-center">
                      Waiting for ESP32 connection or data packets...
                    </div>
                  ) : (
                    serialLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-zinc-600 shrink-0 text-[10px]">[{log.timestamp}]</span>
                        <span
                          className={`font-bold shrink-0 text-[10px] ${
                            log.direction === 'TX'
                              ? 'text-emerald-400'
                              : log.direction === 'RX'
                              ? 'text-cyan-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {log.direction === 'TX' ? '-->' : log.direction === 'RX' ? '<--' : ' * '}
                        </span>
                        <span
                          className={`break-all ${
                            log.direction === 'TX'
                              ? 'text-emerald-300'
                              : log.direction === 'RX'
                              ? 'text-cyan-200'
                              : 'text-amber-300/80'
                          }`}
                        >
                          {log.text}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={consoleEndRef} />
                </div>

                {/* Send Raw Command Form */}
                <form onSubmit={handleSendManual} className="flex gap-2 pt-2 border-t border-zinc-800">
                  <input
                    type="text"
                    value={manualCmd}
                    onChange={(e) => setManualCmd(e.target.value)}
                    placeholder='Type raw command (e.g. {"cmd":"PING"} or {"cmd":"SET_SIGNALS",...})'
                    className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Wi-Fi Sync Tab Content */}
          {connectionType === 'WIFI_SYNC' && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs leading-relaxed space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  <span>Wireless ESP32 Cloud &amp; Local Synchronization</span>
                </div>
                <p>
                  Your ESP32 can connect directly to your <strong>Live Production Cloud Backend</strong> on Render,
                  operating completely untethered over Wi-Fi without needing a computer running:
                </p>
                <div className="p-2.5 rounded-xl bg-black text-cyan-300 text-[11px] font-mono border border-zinc-800">
                  POST https://smart-traffic-management-system-zhgn.onrender.com/api/hardware/esp32/sync
                </div>
                <p className="text-slate-400 text-[11px]">
                  In <code className="text-white">esp32_traffic_controller.ino</code>, set{' '}
                  <code className="text-cyan-300">#define ENABLE_WIFI true</code> and input your Wi-Fi SSID &amp; Password.
                  The ESP32 will auto-connect via SSL to the live website!
                </p>
              </div>
            </div>
          )}

          {/* Firmware Code View */}
          {connectionType === 'FIRMWARE' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white uppercase">
                    ESP32 Production Firmware (Complete Working Sketch)
                  </span>
                  <div className="text-[10px] text-slate-400">
                    Flash via Arduino IDE • Board: "ESP32 Dev Module" • Baud: 115200 • Upload Speed: 921600
                  </div>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/60 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy ESP32 Sketch'}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs leading-relaxed">
                👉 <strong>How to Flash:</strong> Open the Arduino IDE, paste this entire sketch into a new tab, select your ESP32 COM/ttyUSB port, and click <strong>Upload (Ctrl+U / Cmd+U)</strong>. Once uploaded, open Chrome and click <strong>"Select Port &amp; Connect USB"</strong>!
              </div>

              <pre className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] text-cyan-300 max-h-80 overflow-y-auto font-mono leading-relaxed select-all">
                {esp32SampleCode}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
