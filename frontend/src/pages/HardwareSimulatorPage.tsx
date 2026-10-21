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
              <Cpu className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Virtual Arduino Uno R3 PCB Matrix
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              16 MHz ATmega328P • 5V TTL
            </span>
          </div>

          {/* Virtual PCB Board Graphic */}
          <div className="p-4 rounded-2xl bg-teal-950/80 border-2 border-teal-600/60 shadow-xl relative overflow-hidden font-mono text-white">
            {/* PCB Trace Graphic Overlay */}
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Board Header */}
            <div className="flex items-center justify-between text-xs pb-3 border-b border-teal-500/30 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-md shadow-amber-400/50" />
                <span className="font-bold text-teal-200 tracking-wider">TRAFIX ARDUINO HARDWARE NODE #01</span>
              </div>
              <span className="text-[10px] text-teal-400 font-bold">PORT: /dev/ttyACM0</span>
            </div>

            {/* Microcontroller Chip Graphic */}
            <div className="my-4 p-3 rounded-xl bg-black/90 border border-zinc-700 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-600 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                  μC
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-100">ATMEGA328P-PU</div>
                  <div className="text-[9px] text-zinc-400">Embedded STMS Safety Interlock Firmware v2.4</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>ACTIVE COM LINK</span>
              </div>
            </div>

            {/* Live Illuminated GPIO Pinouts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 relative z-10">
              {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as Direction[]).map((dir) => {
                const isGreen = Boolean(hardwareState?.pinStates?.[`${dir}_GREEN`]?.value);
                const isYellow = Boolean(hardwareState?.pinStates?.[`${dir}_YELLOW`]?.value);
                const isRed = Boolean(hardwareState?.pinStates?.[`${dir}_RED`]?.value);

                return (
                  <div key={dir} className="p-2 rounded-lg bg-black/70 border border-teal-500/30 text-center space-y-1.5">
                    <div className="text-[10px] font-bold text-teal-300">{dir} SIGNALS</div>
                    <div className="flex items-center justify-center gap-2 py-1">
                      {/* Red LED */}
                      <div
                        className={`w-3.5 h-3.5 rounded-full border transition-all ${
                          isRed
                            ? 'bg-rose-500 border-rose-300 shadow-md shadow-rose-500 ring-2 ring-rose-400/50'
                            : 'bg-rose-950/40 border-rose-900 opacity-30'
                        }`}
                        title="Red Pin"
                      />
                      {/* Yellow LED */}
                      <div
                        className={`w-3.5 h-3.5 rounded-full border transition-all ${
                          isYellow
                            ? 'bg-amber-400 border-amber-200 shadow-md shadow-amber-400 ring-2 ring-amber-300/50'
                            : 'bg-amber-950/40 border-amber-900 opacity-30'
                        }`}
                        title="Yellow Pin"
                      />
                      {/* Green LED */}
                      <div
                        className={`w-3.5 h-3.5 rounded-full border transition-all ${
                          isGreen
                            ? 'bg-emerald-400 border-emerald-200 shadow-md shadow-emerald-400 ring-2 ring-emerald-300/50'
                            : 'bg-emerald-950/40 border-emerald-900 opacity-30'
                        }`}
                        title="Green Pin"
                      />
                    </div>
                    <div className="text-[9px] text-zinc-400">
                      {isGreen ? 'D_GRN: HIGH' : isYellow ? 'D_YEL: HIGH' : 'D_RED: HIGH'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive IR Tripwire Trigger Buttons */}
            <div className="mt-4 pt-3 border-t border-teal-500/30 relative z-10">
              <div className="text-[10px] font-bold text-teal-300 mb-2 flex items-center justify-between">
                <span>INTERACTIVE IR BEAM TRIPWIRE SENSORS (CLICK TO TEST)</span>
                <span className="text-zinc-400 text-[9px]">Analog A0-A3 Inputs</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as Direction[]).map((dir, i) => {
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
                          : 'bg-black/60 hover:bg-teal-900/40 text-teal-200 border-teal-500/30'
                      }`}
                    >
                      <div>A{i}: {dir}</div>
                      <div className="text-[9px] font-normal">{isTripped ? '⚡ BEAM TRIPPED' : 'CLEAR'}</div>
                    </button>
                  );
                })}
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
                <span>Live Serial Monitor (115200 Baud)</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-500 font-bold">RX/TX SYNCED</span>
            </div>

            {/* Serial Output Stream */}
            <div className="p-3 rounded-lg bg-black text-emerald-400 font-mono text-[11px] overflow-y-auto max-h-64 border border-zinc-800 space-y-1">
              <div>[00:00:01] &lt;-- {"{"}"device":"ARDUINO_UNO_R3","baud":115200,"status":"READY"{"}"}</div>
              <div>[00:00:02] --&gt; {"{"}"cmd":"POLL_SENSORS","pins":["A0","A1","A2","A3"]{"}"}</div>
              <div>[00:00:03] &lt;-- {"{"}"irStates":{"{"}"N":0,"S":1,"E":0,"W":0{"}"},"chk":"OK"{"}"}</div>
              <div>[00:00:04] --&gt; {"{"}"cmd":"SET_SIGNAL","N":"RED","S":"GREEN","E":"RED","W":"RED"{"}"}</div>
              <div>[00:00:05] &lt;-- {"{"}"ack":"SIGNAL_LATCHED","latSec":30,"tempC":38.2{"}"}</div>
              <div className="text-amber-400 animate-pulse">&gt; Telemetry streaming nominal (0 dropped packets)</div>
            </div>
          </div>

          {/* Quick Command Injector */}
          <div className="pt-2 border-t border-slate-200 dark:border-[#1f1f23] space-y-2">
            <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 uppercase font-bold">
              Dispatch Raw Serial Command
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
                Send LATCH_N_GRN
              </button>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  api.sendManualCommand('SOUTH', 'GREEN', 30);
                  onRefresh();
                }}
                className="flex-1 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 text-[10px] font-mono font-semibold transition cursor-pointer"
              >
                Send LATCH_S_GRN
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
