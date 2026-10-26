import React, { useState } from 'react';
import {
  Cpu,
  Radio,
  Camera,
  Play,
  Square,
  Zap,
  Activity,
  Flame,
  Siren,
  Copy,
  Check,
  Sliders,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Usb,
} from 'lucide-react';
import {
  Direction,
  HardwareState,
  SimulationConfig,
  EmergencyVehicleType,
} from '../types';
import { api } from '../services/api';
import { soundEffects } from '../utils/soundEffects';
import { HilSerialBridgeModal } from '../components/hardware/HilSerialBridgeModal';

interface HardwareSimulatorPageProps {
  hardwareState: HardwareState | null;
  simConfig: SimulationConfig | null;
  onRefresh: () => void;
}

export const HardwareSimulatorPage: React.FC<HardwareSimulatorPageProps> = ({
  hardwareState,
  simConfig,
  onRefresh,
}) => {
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [selectedSpikeDir, setSelectedSpikeDir] = useState<Direction>('WEST');
  const [spikeCount, setSpikeCount] = useState<number>(38);
  const [selectedEmgDir, setSelectedEmgDir] = useState<Direction>('WEST');
  const [selectedEmgType, setSelectedEmgType] = useState<EmergencyVehicleType>('AMBULANCE');
  const [loading, setLoading] = useState<boolean>(false);
  const [isHilModalOpen, setIsHilModalOpen] = useState<boolean>(false);

  const isSimRunning = simConfig?.isRunning ?? false;
  const isArduinoAttached = hardwareState?.connected ?? false;

  const handleToggleSimulation = async () => {
    try {
      soundEffects.playClick();
      setLoading(true);
      if (isSimRunning) {
        await api.stopSimulation();
      } else {
        await api.startSimulation();
      }
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioChange = async (scenario: string) => {
    try {
      soundEffects.playClick();
      setLoading(true);
      await api.setScenario(scenario);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSpike = async () => {
    try {
      soundEffects.playClick();
      setLoading(true);
      await api.triggerSpike(selectedSpikeDir, spikeCount);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerEmergency = async () => {
    try {
      soundEffects.playEmergencySiren();
      setLoading(true);
      await api.triggerEmergency(selectedEmgDir, selectedEmgType);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHardware = async () => {
    try {
      soundEffects.playClick();
      setLoading(true);
      await api.toggleHardware(!isArduinoAttached);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const arduinoSampleCode = `/* ESP32 4-Way Traffic Controller Firmware */
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
const int rfReceiverPin = 26; // RF Data -> D26 (10k resistor to GND)
const int buzzerPin     = 15; // Active Buzzer -> D15

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
  Serial.println("{\\"type\\":\\"HANDSHAKE\\",\\"device\\":\\"ESP32_TRAFFIC\\",\\"baud\\":115200}");
}

void loop() {
  // Read WebSerial commands & send IR / RF telemetry
}`;

  const copyToClipboard = () => {
    soundEffects.playClick();
    navigator.clipboard.writeText(arduinoSampleCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 text-slate-900 dark:text-white transition-colors">
      {/* Header Banner */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Hardware Layer &amp; IoT Simulator
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans mt-0.5">
              Seamless Arduino Uno/Mega integration via Hardware Abstraction Layer &amp; REST telemetry endpoints.
            </p>
          </div>
        </div>

        {/* Hardware Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              soundEffects.playClick();
              setIsHilModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded font-mono text-xs font-semibold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 transition cursor-pointer shadow-xs"
          >
            <Usb className="w-3.5 h-3.5 text-cyan-400" />
            <span>CONNECT PHYSICAL HARDWARE (HIL)</span>
          </button>

          <button
            onClick={handleToggleHardware}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded font-mono text-xs font-semibold transition cursor-pointer shadow-xs ${
              isArduinoAttached
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{isArduinoAttached ? 'MOCK ARDUINO ATTACHED' : 'ATTACH MOCK ARDUINO'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Virtual Arduino Board Graphic & Serial Monitor Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Columns: Virtual Arduino Board Graphic with Live Illuminated LED Pins */}
        <div className="lg:col-span-7 bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-[#1f1f23]">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-500" />
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                ESP32 DevKit-V1 Smart Traffic Matrix
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
              240 MHz Xtensa LX6 • 3.3V Logic • 115200 Baud
            </span>
          </div>

          {/* Virtual PCB Board Graphic */}
          <div className="p-4 rounded-2xl bg-slate-950 border-2 border-cyan-600/40 shadow-xl relative overflow-hidden font-mono text-white">
            {/* PCB Trace Graphic Overlay */}
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Board Header */}
            <div className="flex items-center justify-between text-xs pb-3 border-b border-cyan-500/30 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-md shadow-cyan-400/50" />
                <span className="font-bold text-cyan-200 tracking-wider">TRAFIX ESP32-WROOM-32 NODE #01</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-bold">
                {hardwareState?.port ? hardwareState.port : 'PORT: USB-UART / CP2102 (115200)'}
              </span>
            </div>

            {/* Microcontroller Chip Graphic */}
            <div className="my-4 p-3 rounded-xl bg-black/90 border border-zinc-700 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-zinc-800 border border-cyan-500/50 flex items-center justify-center text-[10px] font-bold text-cyan-300">
                  ESP
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-100">ESP-WROOM-32 / NODEMCU-32S</div>
                  <div className="text-[9px] text-zinc-400">4-Way Signal Actuation + IR Stop-Lines + 433MHz RF Siren</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>{hardwareState?.connected ? 'ESP32 HARDWARE LINKED' : 'READY TO CONNECT'}</span>
              </div>
            </div>

            {/* Live Illuminated GPIO Pinouts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 relative z-10">
              {[
                { dir: 'NORTH' as Direction, red: 'D2', yel: 'D4', grn: 'D5', irPin: 'GPIO 32' },
                { dir: 'EAST' as Direction, red: 'D18', yel: 'D19', grn: 'D21', irPin: 'GPIO 33' },
                { dir: 'SOUTH' as Direction, red: 'D22', yel: 'D23', grn: 'D13', irPin: 'GPIO 34' },
                { dir: 'WEST' as Direction, red: 'D12', yel: 'D14', grn: 'D27', irPin: 'GPIO 35' },
              ].map(({ dir, red, yel, grn, irPin }) => {
                const currentSig = hardwareState?.actualHardwareSignalState?.[dir] || (dir === 'WEST' ? 'GREEN' : 'RED');
                const isGreen = currentSig === 'GREEN';
                const isYellow = currentSig === 'YELLOW';
                const isRed = currentSig === 'RED';

                return (
                  <div key={dir} className="p-2.5 rounded-lg bg-black/80 border border-cyan-500/30 text-center space-y-1.5">
                    <div className="text-[10px] font-bold text-cyan-300">{dir}</div>
                    <div className="flex items-center justify-center gap-2 py-1">
                      {/* Red LED */}
                      <div
                        className={`w-3.5 h-3.5 rounded-full border transition-all ${
                          isRed
                            ? 'bg-rose-500 border-rose-300 shadow-md shadow-rose-500 ring-2 ring-rose-400/50'
                            : 'bg-rose-950/40 border-rose-900 opacity-25'
                        }`}
                        title={`${red} (Red)`}
                      />
                      {/* Yellow LED */}
                      <div
                        className={`w-3.5 h-3.5 rounded-full border transition-all ${
                          isYellow
                            ? 'bg-amber-400 border-amber-200 shadow-md shadow-amber-400 ring-2 ring-amber-300/50'
                            : 'bg-amber-950/40 border-amber-900 opacity-25'
                        }`}
                        title={`${yel} (Yellow)`}
                      />
                      {/* Green LED */}
                      <div
                        className={`w-3.5 h-3.5 rounded-full border transition-all ${
                          isGreen
                            ? 'bg-emerald-400 border-emerald-200 shadow-md shadow-emerald-400 ring-2 ring-emerald-300/50'
                            : 'bg-emerald-950/40 border-emerald-900 opacity-25'
                        }`}
                        title={`${grn} (Green)`}
                      />
                    </div>
                    <div className="text-[9px] text-zinc-400">
                      {isGreen ? `${grn}: HIGH` : isYellow ? `${yel}: HIGH` : `${red}: HIGH`}
                    </div>
                    <div className="text-[8px] text-cyan-400/80 pt-0.5 border-t border-zinc-800">
                      {irPin}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive IR Tripwire Trigger Buttons */}
            <div className="mt-4 pt-3 border-t border-cyan-500/30 relative z-10">
              <div className="text-[10px] font-bold text-cyan-300 mb-2 flex items-center justify-between">
                <span>PHYSICAL IR OBSTACLE SENSORS (GPIO 32, 33, 34, 35)</span>
                <span className="text-zinc-400 text-[9px]">Click to inject queue</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { dir: 'NORTH' as Direction, pin: 'GPIO 32' },
                  { dir: 'EAST' as Direction, pin: 'GPIO 33' },
                  { dir: 'SOUTH' as Direction, pin: 'GPIO 34' },
                  { dir: 'WEST' as Direction, pin: 'GPIO 35' },
                ].map(({ dir, pin }) => {
                  const isTripped = hardwareState?.irSensorStates?.[dir] ?? false;
                  return (
                    <button
                      key={dir}
                      onClick={() => {
                        soundEffects.playClick();
                        api.triggerSpike(dir, isTripped ? 0 : 15);
                        onRefresh();
                      }}
                      className={`p-2 rounded-lg border text-center transition cursor-pointer text-xs font-bold ${
                        isTripped
                          ? 'bg-amber-500 text-black border-amber-300 shadow-lg shadow-amber-500/30'
                          : 'bg-black/60 hover:bg-cyan-900/40 text-cyan-200 border-cyan-500/30'
                      }`}
                    >
                      <div>{dir}</div>
                      <div className="text-[9px] font-normal">{isTripped ? '⚡ VEHICLE PRESENT' : `${pin} (CLEAR)`}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Emergency RF Receiver & Buzzer Actuation Row */}
            <div className="mt-3 pt-3 border-t border-cyan-500/30 grid grid-cols-2 gap-2 relative z-10">
              <div className="p-2 rounded-lg bg-black/60 border border-zinc-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Emergency RF Pin (GPIO 26):</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  hardwareState?.rfEmergencyActive
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {hardwareState?.rfEmergencyActive ? '🚨 RF DETECTED' : 'CLEAR'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-black/60 border border-zinc-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Active Buzzer (GPIO 15):</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  hardwareState?.buzzerActive
                    ? 'bg-amber-400 text-black animate-ping'
                    : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {hardwareState?.buzzerActive ? '🔊 SIREN ACTIVE' : 'SILENT'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Live Serial Monitor Console & Command Injector */}
        <div className="lg:col-span-5 bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-200 dark:border-[#1f1f23]">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                <span>ESP32 Live Serial Monitor (115200 Baud)</span>
              </h3>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">UART0 / DUPLEX</span>
            </div>

            {/* Serial Output Stream */}
            <div className="p-3 rounded-lg bg-black text-cyan-300 font-mono text-[11px] overflow-y-auto max-h-64 border border-zinc-800 space-y-1">
              <div>[00:00:01] &lt;-- {"{"}"device":"ESP32_TRAFFIC_CONTROLLER","baud":115200,"status":"ONLINE"{"}"}</div>
              <div>[00:00:02] --&gt; {"{"}"cmd":"SET_SIGNALS","NORTH":"RED","EAST":"RED","SOUTH":"RED","WEST":"GREEN"{"}"}</div>
              <div>[00:00:03] &lt;-- {"{"}"type":"ACK","status":"APPLIED","pins":"2,4,5,18,19,21,22,23,13,12,14,27"{"}"}</div>
              <div>[00:00:04] &lt;-- {"{"}"type":"EVENT","event":"IR_STATE","lane":"NORTH","active":false{"}"}</div>
              <div>[00:00:05] &lt;-- {"{"}"type":"TELEMETRY","lanes":4,"rf":false,"buzzer":false{"}"}</div>
              <div className="text-emerald-400">&gt; WebSerial link active • 0 dropped frames</div>
            </div>
          </div>

          {/* Quick Command Injector */}
          <div className="pt-2 border-t border-slate-200 dark:border-[#1f1f23] space-y-2">
            <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 uppercase font-bold">
              Instant ESP32 Signal Override
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  soundEffects.playClick();
                  api.sendManualCommand('NORTH', 'GREEN', 30);
                  onRefresh();
                }}
                className="flex-1 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 text-[10px] font-mono font-semibold transition cursor-pointer"
              >
                North Green (D5)
              </button>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  api.sendManualCommand('SOUTH', 'GREEN', 30);
                  onRefresh();
                }}
                className="flex-1 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 text-[10px] font-mono font-semibold transition cursor-pointer"
              >
                South Green (D13)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware-In-The-Loop (HIL) Serial & MQTT Modal */}
      <HilSerialBridgeModal
        isOpen={isHilModalOpen}
        onClose={() => setIsHilModalOpen(false)}
        hardwareState={hardwareState}
      />
    </div>
  );
};
