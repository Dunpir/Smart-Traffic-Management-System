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
  const [buzzerTesting, setBuzzerTesting] = useState<boolean>(false);

  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    setIsConnected(webSerialService.getIsConnected());
    setPortName(webSerialService.getPortName() || 'ESP32 (CP2102 / CH340)');
    setSerialLogs(webSerialService.getLogs());

    const unsubStatus = webSerialService.subscribeStatus((connected, port) => {
      setIsConnected(connected);
      if (port) setPortName(port);
    });

    const unsubLogs = webSerialService.subscribeLogs((entry) => {
      setSerialLogs((prev) => [entry, ...prev.slice(0, 79)]);
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

  const handleTestSignal = async (dir: Direction, sig: LightState) => {
    soundEffects.playClick();
    await webSerialService.testSignal(dir, sig);
  };

  const handleTestBuzzer = async () => {
    soundEffects.playClick();
    setBuzzerTesting(true);
    await webSerialService.testBuzzer(true);
    setTimeout(async () => {
      await webSerialService.testBuzzer(false);
      setBuzzerTesting(false);
    }, 800);
  };

  const handleAllRed = async () => {
    soundEffects.playClick();
    await webSerialService.testAllRed();
  };

  const esp32SampleCode = `/*
 * Trafix Intelligent STMS - ESP32 Hardware-In-The-Loop Firmware
 * Microcontroller: ESP-WROOM-32 / NodeMCU-32S (Baud: 115200)
 */

#include <Arduino.h>

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

#define IR_TRIGGER_ACTIVE LOW // FC-51 IR outputs LOW on detection

void setup() {
  Serial.begin(115200);
  for (int l = 0; l < NUM_LANES; l++) {
    for (int c = 0; c < 3; c++) pinMode(signalPins[l][c], OUTPUT);
  }
  pinMode(irSensorPins[0], INPUT_PULLUP);
  pinMode(irSensorPins[1], INPUT_PULLUP);
  pinMode(irSensorPins[2], INPUT);
  pinMode(irSensorPins[3], INPUT);
  pinMode(rfReceiverPin, INPUT);
  pinMode(buzzerPin, OUTPUT);

  // Initial State: West Green, others Red
  digitalWrite(signalPins[NORTH][0], HIGH);
  digitalWrite(signalPins[EAST][0],  HIGH);
  digitalWrite(signalPins[SOUTH][0], HIGH);
  digitalWrite(signalPins[WEST][2],  HIGH);

  Serial.println("{\\"type\\":\\"HANDSHAKE\\",\\"device\\":\\"ESP32_TRAFFIC\\",\\"status\\":\\"READY\\"}");
}

void loop() {
  // 1. Process JSON commands from Web Dashboard
  if (Serial.available()) {
    String line = Serial.readStringUntil('\\n');
    line.trim();
    // Commands: SET_SIGNALS, SET_SIGNAL, BUZZER, ALL_RED
  }

  // 2. Scan IR sensors & RF Emergency
  if (digitalRead(rfReceiverPin) == HIGH) {
    Serial.println("{\\"type\\":\\"EVENT\\",\\"event\\":\\"RF_EMERGENCY\\",\\"lane\\":\\"EAST\\"}");
    digitalWrite(buzzerPin, HIGH);
    delay(500);
    digitalWrite(buzzerPin, LOW);
  }
  delay(30);
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(esp32SampleCode);
    soundEffects.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
                  ESP32 Physical Hardware Bridge
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono font-bold">
                  115200 BAUD
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Real-Time WebSerial Link • 4-Way Traffic Heads • IR Beam Sensors • RF Emergency • Siren Buzzer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Tab Selector */}
          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs">
            <button
              onClick={() => setConnectionType('WEBSERIAL')}
              className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                connectionType === 'WEBSERIAL'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 shadow-md shadow-cyan-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Usb className="w-4 h-4 text-cyan-400" />
              <span>WebSerial USB Link</span>
            </button>

            <button
              onClick={() => setConnectionType('WIFI_SYNC')}
              className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                connectionType === 'WIFI_SYNC'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 shadow-md shadow-cyan-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span>Wi-Fi REST Sync</span>
            </button>

            <button
              onClick={() => setConnectionType('FIRMWARE')}
              className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                connectionType === 'FIRMWARE'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 shadow-md shadow-cyan-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>ESP32 C++ Code</span>
            </button>
          </div>

          {/* WebSerial Tab Content */}
          {connectionType === 'WEBSERIAL' && (
            <div className="space-y-4 font-mono">
              {/* Safari / WebSerial Browser Alert */}
              {!webSerialService.isSupported() && (
                <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs flex flex-col gap-2 font-sans">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Safari Browser Detected: WebSerial Not Supported by Apple</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Apple Safari blocks web pages from accessing physical USB Serial COM ports. To connect your ESP32 with your USB cable:
                  </p>
                  <div className="p-2 rounded-xl bg-black/80 border border-amber-500/30 flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-300 select-all">https://smart-traffic-management-system-weld.vercel.app</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('https://smart-traffic-management-system-weld.vercel.app');
                        soundEffects.playClick();
                      }}
                      className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 hover:text-white border border-cyan-600 text-[10px] font-bold cursor-pointer transition"
                    >
                      Copy URL
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    👉 <strong>Open Google Chrome, Microsoft Edge, or Brave</strong> on your Mac, paste the link, and click <strong>"Select Port &amp; Connect USB"</strong>.
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
                          LIVE DUPLEX
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

              {/* Hardware Quick Test Bench */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase flex items-center justify-between">
                  <span>Interactive Hardware Test Bench (Direct Physical Actuation)</span>
                  <span className="text-[10px] text-slate-400">Click to pulse LEDs / Buzzer</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  <button
                    onClick={() => handleTestSignal('NORTH', 'GREEN')}
                    className="p-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 text-xs font-bold transition cursor-pointer"
                  >
                    North Green
                  </button>
                  <button
                    onClick={() => handleTestSignal('EAST', 'GREEN')}
                    className="p-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 text-xs font-bold transition cursor-pointer"
                  >
                    East Green
                  </button>
                  <button
                    onClick={() => handleTestSignal('SOUTH', 'GREEN')}
                    className="p-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 text-xs font-bold transition cursor-pointer"
                  >
                    South Green
                  </button>
                  <button
                    onClick={() => handleTestSignal('WEST', 'GREEN')}
                    className="p-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 text-xs font-bold transition cursor-pointer"
                  >
                    West Green
                  </button>
                  <button
                    onClick={handleTestBuzzer}
                    className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                      buzzerTesting
                        ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/50 animate-pulse'
                        : 'bg-rose-950 hover:bg-rose-900 border-rose-600/50 text-rose-300'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Test Buzzer</span>
                  </button>
                  <button
                    onClick={handleAllRed}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
                  >
                    All Red Lock
                  </button>
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
                    placeholder='Type raw command (e.g. {"cmd":"PING"} or {"cmd":"SET_SIGNAL","dir":"NORTH","sig":"GREEN"})'
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
                    ESP32 Arduino Firmware (docs/arduino/esp32_traffic_controller.ino)
                  </span>
                  <div className="text-[10px] text-slate-400">
                    Flash via Arduino IDE • Board: "ESP32 Dev Module" • Baud: 115200
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
