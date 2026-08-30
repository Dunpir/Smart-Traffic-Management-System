import React from 'react';
import {
  SimDirection,
  SimVehicleType,
  SimulationMode,
  SimulationTelemetryState,
  SpawnRate,
  STMSScenario,
} from '../../types/simulation';
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Gauge,
  Activity,
  Layers,
  Sparkles,
  ShieldAlert,
  Flame,
  Clock,
  Camera,
  Car,
  Truck,
  Bus,
  Siren,
  Sliders,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';

interface TrafficControlPanelProps {
  state: SimulationTelemetryState;
  onSetMode: (mode: SimulationMode) => void;
  onSetScenario: (scenario: STMSScenario) => void;
  onSetManualDirection: (dir: SimDirection) => void;
  onSetCycleTime: (seconds: number) => void;
  onSetSpawnRate: (rate: SpawnRate) => void;
  onSetSimSpeed: (speed: number) => void;
  onToggleCameraBboxes: () => void;
  onSpawnSingle: (dir: SimDirection, type?: SimVehicleType) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export const TrafficControlPanel: React.FC<TrafficControlPanelProps> = ({
  state,
  onSetMode,
  onSetScenario,
  onSetManualDirection,
  onSetCycleTime,
  onSetSpawnRate,
  onSetSimSpeed,
  onToggleCameraBboxes,
  onSpawnSingle,
  onStart,
  onPause,
  onReset,
}) => {
  const {
    mode,
    activeScenario,
    activeDirection,
    currentState,
    timeRemaining,
    totalVehicles,
    waitingVehicles,
    flowDensity,
    averageWaitTimeSec,
    signalAllocations,
    activeEmergencyMessage,
    isRunning,
    simSpeed,
    cycleTime,
    spawnRate,
    showCameraBboxes,
  } = state;

  return (
    <div className="w-full lg:w-96 bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] rounded-lg p-4 flex flex-col justify-between gap-3 text-slate-900 dark:text-white shadow-xs transition-colors">
      <div>
        {/* Title Bar */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200 dark:border-[#1f1f23]">
          <div>
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                STMS Adaptive Control
              </h2>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono">
              Shortest Job First + Threshold Allocator
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              isRunning
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
            }`}
          >
            {isRunning ? 'RUNNING' : 'PAUSED'}
          </span>
        </div>

        {/* 1. Mode Selector */}
        <div className="mb-2.5">
          <label className="block text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase mb-1">
            Control Algorithm
          </label>
          <div className="grid grid-cols-3 p-0.5 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-mono font-medium">
            <button
              onClick={() => {
                soundEffects.playClick();
                onSetMode('ADAPTIVE_STMS');
              }}
              className={`py-1 rounded transition text-center cursor-pointer ${
                mode === 'ADAPTIVE_STMS'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs dark:bg-white dark:text-black'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Adaptive
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                onSetMode('AUTO_FIXED');
              }}
              className={`py-1 rounded transition text-center cursor-pointer ${
                mode === 'AUTO_FIXED'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs dark:bg-white dark:text-black'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Fixed Auto
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                onSetMode('MANUAL');
              }}
              className={`py-1 rounded transition text-center cursor-pointer ${
                mode === 'MANUAL'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs dark:bg-white dark:text-black'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Manual
            </button>
          </div>
        </div>

        {/* 2. Scenarios */}
        <div className="mb-2.5">
          <label className="block text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase mb-1">
            Scenario Presets
          </label>
          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
            <button
              onClick={() => {
                soundEffects.playClick();
                onSetScenario('VERY_BUSY');
              }}
              className={`p-2 rounded border text-left flex flex-col gap-0.5 transition cursor-pointer ${
                activeScenario === 'VERY_BUSY'
                  ? 'bg-slate-200 border-slate-400 text-slate-900 dark:bg-zinc-800 dark:border-zinc-500 dark:text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-black dark:border-[#1f1f23] dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <span className="font-bold">🚦 Rush Hour Grid</span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-500">Heavy on all roads</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                onSetScenario('MANY_EMERGENCY');
              }}
              className={`p-2 rounded border text-left flex flex-col gap-0.5 transition cursor-pointer ${
                activeScenario === 'MANY_EMERGENCY'
                  ? 'bg-slate-200 border-slate-400 text-slate-900 dark:bg-zinc-800 dark:border-zinc-500 dark:text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-black dark:border-[#1f1f23] dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <span className="font-bold">🚑 Emergency Wave</span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-500">Ambulance stream</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                onSetScenario('TWO_BUSY_ROADS');
              }}
              className={`p-2 rounded border text-left flex flex-col gap-0.5 transition cursor-pointer ${
                activeScenario === 'TWO_BUSY_ROADS'
                  ? 'bg-slate-200 border-slate-400 text-slate-900 dark:bg-zinc-800 dark:border-zinc-500 dark:text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-black dark:border-[#1f1f23] dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <span className="font-bold">🛣️ Dual Arterial</span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-500">N/S heavy flow</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                onSetScenario('EMPTY_ROADS');
              }}
              className={`p-2 rounded border text-left flex flex-col gap-0.5 transition cursor-pointer ${
                activeScenario === 'EMPTY_ROADS'
                  ? 'bg-slate-200 border-slate-400 text-slate-900 dark:bg-zinc-800 dark:border-zinc-500 dark:text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-black dark:border-[#1f1f23] dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <span className="font-bold">🈳 Light Off-Peak</span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-500">Sparse vehicle flow</span>
            </button>
          </div>
        </div>

        {/* 3. Live Signal Status Box */}
        <div className="p-2.5 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] mb-2.5">
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="text-slate-500 dark:text-zinc-400 uppercase">Live Phase</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {activeDirection} ROAD · {Math.max(1, Math.round(timeRemaining))}s
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 text-[11px] font-mono text-center pt-1 border-t border-slate-200 dark:border-zinc-900">
            {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as SimDirection[]).map((d) => {
              const alloc = signalAllocations[d];
              const isCurr = activeDirection === d;
              return (
                <div
                  key={d}
                  className={`p-1 rounded ${
                    isCurr
                      ? 'bg-emerald-50 text-emerald-800 font-bold dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-zinc-900 dark:text-zinc-400'
                  }`}
                >
                  <div className="text-[9px]">{d[0]}</div>
                  <div>{alloc?.carCount ?? 0}v</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Controls: Spawn Vehicle & Speed Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500 dark:text-zinc-400 uppercase">Sim Speed</span>
            <div className="flex gap-1">
              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => {
                    soundEffects.playClick();
                    onSetSimSpeed(spd);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                    simSpeed === spd
                      ? 'bg-slate-900 text-white font-bold dark:bg-white dark:text-black'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-zinc-900 dark:text-zinc-400'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Quick Spawn Buttons */}
          <div>
            <span className="block text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase mb-1">
              Spawn Vehicle On Approach
            </span>
            <div className="grid grid-cols-4 gap-1 font-mono text-[10px]">
              {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as SimDirection[]).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    soundEffects.playClick();
                    onSpawnSingle(d, 'CAR');
                  }}
                  className="py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 transition cursor-pointer text-center"
                >
                  +{d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Strip: Play, Pause, Reset */}
      <div className="pt-2 border-t border-slate-200 dark:border-[#1f1f23] grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            soundEffects.playClick();
            if (isRunning) onPause();
            else onStart();
          }}
          className={`py-2 px-3 rounded font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
            isRunning
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-white dark:border-zinc-700'
              : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black'
          }`}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isRunning ? 'PAUSE' : 'START SIMULATION'}</span>
        </button>

        <button
          onClick={() => {
            soundEffects.playClick();
            onReset();
          }}
          className="py-2 px-3 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET</span>
        </button>
      </div>
    </div>
  );
};
