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
    navigator.clipboard.writeText(arduinoSampleCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              Hardware Layer &amp; Simulation Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Seamless Arduino Uno/Mega integration via Hardware Abstraction Layer &amp; identical REST telemetry endpoints.
          </p>
        </div>

        {/* Arduino Connect Toggle Button */}
        <button
          onClick={handleToggleHardware}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
            isArduinoAttached
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>{isArduinoAttached ? 'PHYSICAL ARDUINO ATTACHED' : 'ATTACH PHYSICAL ARDUINO (MOCK)'}</span>
        </button>
      </div>

      {/* Grid: Live Hardware Pinout & Simulation Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Live Hardware Status & Pin Map */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>Physical &amp; Edge Sensor Status</span>
              </h3>
              <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                Junction J001 (12 Out / 4 In)
              </span>
            </div>

            {/* Cameras Status */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 mb-3.5">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>Optical AI Cameras (C001-C004)</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
                  ALL 4 ONLINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Purpose: Real-time vehicle detection, classification, and queue counting at 60 FPS UHD resolution.
              </p>
            </div>

            {/* IR Sensor States (4 Approaches) */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 mb-3.5">
              <div className="text-xs font-mono font-bold text-slate-300 mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-amber-400" />
                  <span>IR Obstacle Beam Sensors (A0-A3)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Stop-line Occupancy</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as Direction[]).map((dir, i) => {
                  const isActive = hardwareState?.irSensorStates[dir] ?? false;
                  return (
                    <div
                      key={dir}
                      className={`p-2 rounded-lg border flex items-center justify-between ${
                        isActive
                          ? 'bg-amber-950/40 border-amber-600/60 text-amber-300'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
                      }`}
                    >
                      <span>{dir} (A{i})</span>
                      <span className={`text-[10px] font-bold ${isActive ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`}>
                        {isActive ? 'OCCUPIED' : 'IDLE'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Arduino Digital Pinout Grid */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-xs font-mono font-bold text-slate-300 mb-2 flex items-center justify-between">
                <span>Arduino GPIO Pin Status</span>
                <span className="text-[10px] text-slate-400">D2 through D13</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-[11px] font-mono">
                {Object.entries(hardwareState?.pinStates || {}).slice(0, 12).map(([key, pin]) => (
                  <div
                    key={key}
                    className={`p-1.5 rounded text-center border ${
                      pin.value === 1 || pin.value === true
                        ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300 font-bold'
                        : 'bg-slate-800/50 border-slate-700/60 text-slate-400'
                    }`}
                  >
                    <div>{key}</div>
                    <div className="text-[9px] opacity-75 truncate">{pin.assignedTo.split('_')[1]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Hardware Watchdog:</span>
            <span className="text-emerald-400 font-semibold">ACTIVE (Auto-failsafe after 60s)</span>
          </div>
        </div>

        {/* Right Col: Simulation Engine Control Deck */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Simulation Engine Controls</span>
              </h3>
              <button
                onClick={handleToggleSimulation}
                disabled={loading}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  isSimRunning
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                }`}
              >
                {isSimRunning ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>STOP SIMULATOR</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>START SIMULATOR</span>
                  </>
                )}
              </button>
            </div>

            {/* Scenario Selection */}
            <div className="mb-4">
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                Select Simulation Scenario
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  { id: 'NORMAL_FLUCTUATION', label: 'Normal Fluctuation' },
                  { id: 'MORNING_RUSH', label: 'Morning Rush (N/S)' },
                  { id: 'EVENING_RUSH', label: 'Evening Rush (E/W)' },
                  { id: 'RAIN_STORM', label: 'Heavy Rain Storm' },
                ].map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => handleScenarioChange(sc.id)}
                    className={`py-2 px-3 rounded-xl font-semibold text-left transition-all border ${
                      simConfig?.scenario === sc.id
                        ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500 shadow-md'
                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800'
                    }`}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Traffic Congestion Spike Injector */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 mb-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 font-mono">
                <Flame className="w-4 h-4" />
                <span>Inject Sudden Traffic Spike</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <select
                  value={selectedSpikeDir}
                  onChange={(e) => setSelectedSpikeDir(e.target.value as Direction)}
                  className="px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-white font-mono text-xs"
                >
                  <option value="NORTH">North Road</option>
                  <option value="SOUTH">South Road</option>
                  <option value="EAST">East Road</option>
                  <option value="WEST">West Road</option>
                </select>

                <input
                  type="number"
                  min="20"
                  max="50"
                  value={spikeCount}
                  onChange={(e) => setSpikeCount(Number(e.target.value))}
                  className="px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-mono text-xs text-center font-bold"
                />

                <button
                  onClick={handleTriggerSpike}
                  disabled={loading}
                  className="py-1.5 px-3 rounded bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold transition-all shadow"
                >
                  INJECT SPIKE
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Pushes count to {spikeCount} vehicles &amp; verifies adaptive rule-based extension.
              </p>
            </div>

            {/* Emergency Vehicle Injector */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 font-mono">
                <Siren className="w-4 h-4" />
                <span>Inject Emergency Vehicle Priority</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={selectedEmgDir}
                  onChange={(e) => setSelectedEmgDir(e.target.value as Direction)}
                  className="px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-white font-mono text-xs"
                >
                  <option value="NORTH">North Road</option>
                  <option value="SOUTH">South Road</option>
                  <option value="EAST">East Road</option>
                  <option value="WEST">West Road</option>
                </select>

                <select
                  value={selectedEmgType}
                  onChange={(e) => setSelectedEmgType(e.target.value as EmergencyVehicleType)}
                  className="px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-rose-300 font-mono text-xs font-bold"
                >
                  <option value="AMBULANCE">Ambulance</option>
                  <option value="FIRE_TRUCK">Fire Truck</option>
                  <option value="POLICE">Police</option>
                </select>

                <button
                  onClick={handleTriggerEmergency}
                  disabled={loading}
                  className="py-1.5 px-3 rounded bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-all shadow"
                >
                  TRIGGER
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Arduino Firmware Inspector */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
              Arduino C++ Firmware Sketch (Ready to Flash)
            </h3>
          </div>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-colors border border-slate-700"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'COPIED TO CLIPBOARD' : 'COPY ARDUINO CODE'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-black/90 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
          {arduinoSampleCode}
        </pre>
      </div>
    </div>
  );
};
