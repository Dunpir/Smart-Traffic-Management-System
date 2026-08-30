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
} from 'lucide-react';
import {
  Direction,
  HardwareState,
  SimulationConfig,
  EmergencyVehicleType,
} from '../types';
import { api } from '../services/api';
import { soundEffects } from '../utils/soundEffects';

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

  const arduinoSampleCode = `/* Arduino UNO / Mega 4-Way Traffic Controller Firmware */
#include <Arduino.h>

const int PIN_N_RED = 2, PIN_N_YEL = 3, PIN_N_GRN = 4;
const int PIN_S_RED = 5, PIN_S_YEL = 6, PIN_S_GRN = 7;
const int PIN_E_RED = 8, PIN_E_YEL = 9, PIN_E_GRN = 10;
const int PIN_W_RED = 11, PIN_W_YEL = 12, PIN_W_GRN = 13;

const int PIN_IR_N = A0, PIN_IR_S = A1, PIN_IR_E = A2, PIN_IR_W = A3;

void setup() {
  Serial.begin(9600);
  for (int p = 2; p <= 13; p++) pinMode(p, OUTPUT);
  pinMode(PIN_IR_N, INPUT_PULLUP);
  pinMode(PIN_IR_S, INPUT_PULLUP);
  pinMode(PIN_IR_E, INPUT_PULLUP);
  pinMode(PIN_IR_W, INPUT_PULLUP);
  Serial.println("{\\"type\\":\\"HANDSHAKE\\",\\"device\\":\\"ARDUINO_TRAFFIC_V1\\"}");
}

void loop() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\\n');
    // Parse JSON command & set Digital Pins
  }
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

        {/* Arduino Connect Toggle Button */}
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
          <span>{isArduinoAttached ? 'PHYSICAL ARDUINO ATTACHED' : 'ATTACH ARDUINO (MOCK)'}</span>
        </button>
      </div>

      {/* Grid: Live Hardware Pinout & Simulation Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Col: Live Hardware Status & Pin Map */}
        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200 dark:border-[#1f1f23]">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                <span>Edge Sensor Status</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 font-semibold">
                Junction J001 (12 Out / 4 In)
              </span>
            </div>

            {/* Cameras Status */}
            <div className="p-3 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] mb-3">
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-900 dark:text-white font-bold flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                  <span>Optical AI Cameras (C001-C004)</span>
                </span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 font-bold text-[10px]">
                  ONLINE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-sans">
                Real-time vehicle detection, classification, and queue counting at 60 FPS UHD resolution.
              </p>
            </div>

            {/* IR Sensor States (4 Approaches) */}
            <div className="p-3 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] mb-3">
              <div className="text-xs font-mono font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-amber-500" />
                  <span>IR Obstacle Beam Sensors (A0-A3)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Stop-line Occupancy</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as Direction[]).map((dir, i) => {
                  const isActive = hardwareState?.irSensorStates[dir] ?? false;
                  return (
                    <div
                      key={dir}
                      className={`p-2 rounded border flex items-center justify-between ${
                        isActive
                          ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300'
                          : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      <span>{dir} (A{i})</span>
                      <span className={`text-[10px] font-bold ${isActive ? 'text-amber-600 dark:text-amber-400 animate-pulse' : 'text-slate-400'}`}>
                        {isActive ? 'OCCUPIED' : 'IDLE'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Arduino Digital Pinout Grid */}
            <div className="p-3 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23]">
              <div className="text-xs font-mono font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
                <span>Arduino GPIO Pin Status</span>
                <span className="text-[10px] text-slate-500 font-normal">D2 through D13</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-[11px] font-mono">
                {Object.entries(hardwareState?.pinStates || {}).slice(0, 12).map(([key, pin]) => {
                  const isHigh = Boolean(pin.value);
                  return (
                    <div
                      key={key}
                      className={`p-1 rounded text-center border ${
                        isHigh
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-300'
                          : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500'
                      }`}
                    >
                      <div className="text-[9px]">{key}</div>
                      <div className="font-bold">{isHigh ? 'HIGH' : 'LOW'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Arduino C++ Code Snippet */}
        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200 dark:border-[#1f1f23]">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                <span>Microcontroller Firmware (C++)</span>
              </h3>
              <button
                onClick={copyToClipboard}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 text-[11px] font-mono flex items-center gap-1 transition cursor-pointer"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <pre className="p-3 rounded bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-80 border border-slate-800">
              <code>{arduinoSampleCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
