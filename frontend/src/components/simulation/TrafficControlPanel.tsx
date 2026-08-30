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
    <div className="w-full lg:w-96 bg-[#0f172a]/95 border border-slate-800/90 rounded-3xl p-5 shadow-2xl backdrop-blur-xl flex flex-col justify-between gap-4 text-slate-200">
      <div>
        {/* Title Bar with Research Paper Badge */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-white font-mono">
                STMS ADAPTIVE CONTROL
              </h2>
            </div>
            <span className="text-[9px] text-slate-400 font-mono">
              Based on NITRA CSE 2025 Research Paper
            </span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              isRunning ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-amber-950 text-amber-300 border border-amber-500/40'
            }`}
          >
            {isRunning ? 'RUNNING' : 'PAUSED'}
          </span>
        </div>

        {/* 1. Mode Selector */}
        <div className="mb-3">
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 font-mono">
            Control Mode
          </label>
          <div className="grid grid-cols-3 p-1 rounded-xl bg-[#070b14] border border-slate-800 text-[10px] font-mono font-bold">
            <button
              onClick={() => onSetMode('ADAPTIVE_STMS')}
              className={`py-1.5 rounded-lg transition-all text-center ${
                mode === 'ADAPTIVE_STMS'
                  ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Adaptive STMS
            </button>

            <button
              onClick={() => onSetMode('AUTO_FIXED')}
              className={`py-1.5 rounded-lg transition-all text-center ${
                mode === 'AUTO_FIXED'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fixed Auto
            </button>

            <button
              onClick={() => onSetMode('MANUAL')}
              className={`py-1.5 rounded-lg transition-all text-center ${
                mode === 'MANUAL'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Manual
            </button>
          </div>
        </div>

        {/* 2. Paper's 4 Preset Scenarios (Section III Page 3) */}
        <div className="mb-3.5">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-400 font-mono flex items-center gap-1">
              <FileText className="w-3 h-3 text-cyan-400" />
              <span>Research Paper Scenario Presets</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono font-bold">
            <button
              onClick={() => onSetScenario('VERY_BUSY')}
              className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                activeScenario === 'VERY_BUSY'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-md'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <span>🚦 Very Busy Roads</span>
              <span className="text-[9px] font-normal text-slate-400">Heavy jam on 4 roads</span>
            </button>

            <button
              onClick={() => onSetScenario('MANY_EMERGENCY')}
              className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                activeScenario === 'MANY_EMERGENCY'
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-md'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <span>🚑 Many Emergency</span>
              <span className="text-[9px] font-normal text-slate-400">Ambulance pre-emption</span>
            </button>

            <button
              onClick={() => onSetScenario('TWO_BUSY_ROADS')}
              className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                activeScenario === 'TWO_BUSY_ROADS'
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <span>🛣️ Two Busy Roads</span>
              <span className="text-[9px] font-normal text-slate-400">N/S heavy, E/W empty</span>
            </button>

            <button
              onClick={() => onSetScenario('EMPTY_ROADS')}
              className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                activeScenario === 'EMPTY_ROADS'
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <span>🈳 Empty Roads</span>
              <span className="text-[9px] font-normal text-slate-400">0s green skip test</span>
            </button>
          </div>
        </div>

        {/* 3. STMS Dynamic Threshold Allocation Table (Paper Fig -4 & Fig -6) */}
        <div className="mb-3 p-3 rounded-2xl bg-[#070b14] border border-slate-800 text-[11px] font-mono">
          <div className="flex items-center justify-between mb-2 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
            <span>Adaptive Threshold Allocation</span>
            <span className="text-cyan-400">Fig -4 / Fig -6 Matrix</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
            {(['NORTH', 'EAST', 'SOUTH', 'WEST'] as SimDirection[]).map((dir, idx) => {
              const alloc = signalAllocations[dir];
              const isGreen = alloc?.currentSignal === 'GREEN';
              const isYellow = alloc?.currentSignal === 'YELLOW';

              return (
                <div
                  key={dir}
                  onClick={() => onSetManualDirection(dir)}
                  className={`p-1.5 rounded-xl border cursor-pointer transition-all ${
                    isGreen
                      ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-md'
                      : isYellow
                      ? 'bg-amber-950/90 border-amber-500 text-amber-300 animate-pulse'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-[9px]">{`Sig ${idx + 1} (${dir[0]})`}</div>
                  <div className="text-white font-bold my-0.5">{alloc?.carCount || 0} cars</div>
                  <div
                    className={`font-bold text-[9px] px-1 py-0.5 rounded ${
                      alloc?.allottedGreenSec === 0
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-emerald-900/80 text-emerald-200'
                    }`}
                  >
                    {alloc?.allottedGreenSec === 0 ? 'Skip (0s)' : `${alloc?.allottedGreenSec}s`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Action Buttons (Start, Pause, Reset, 2x Speed) */}
        <div className="flex flex-col gap-2 mb-3 font-mono text-xs font-bold">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onStart}
              disabled={isRunning}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                isRunning
                  ? 'bg-[#00cc66]/30 text-slate-600 cursor-not-allowed border border-transparent'
                  : 'bg-[#00cc66] hover:bg-[#00b359] text-slate-950 shadow-md shadow-[#00cc66]/20'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start</span>
            </button>

            <button
              onClick={onPause}
              disabled={!isRunning}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                !isRunning
                  ? 'bg-[#f59e0b]/30 text-slate-600 cursor-not-allowed border border-transparent'
                  : 'bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 shadow-md shadow-[#f59e0b]/20'
              }`}
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onReset}
              className="col-span-2 py-1.5 rounded-xl bg-[#ef4444] hover:bg-[#dc2626] text-white transition-all shadow-md shadow-[#ef4444]/20 flex items-center justify-center gap-1.5 text-[11px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Sim</span>
            </button>

            <button
              onClick={() => onSetSimSpeed(simSpeed === 1 ? 2 : 1)}
              className="py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold border border-slate-700 transition-all text-center text-[11px]"
            >
              {simSpeed}x Speed
            </button>
          </div>
        </div>

        {/* 5. Virtual Camera Blob Bounding Boxes Toggle (Paper Fig -3) */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#070b14] border border-slate-800 text-[11px] font-mono mb-3">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Blob Detection Boxes</span>
          </div>
          <button
            onClick={onToggleCameraBboxes}
            className={`px-2.5 py-0.5 rounded-lg font-bold text-[10px] transition-all ${
              showCameraBboxes
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {showCameraBboxes ? 'ENABLED' : 'OFF'}
          </button>
        </div>

        {/* 6. Quick Vehicle Spawner */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/80 mb-2">
          <span>Inject Vehicle:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSpawnSingle('SOUTH', 'AMBULANCE')}
              className="px-2 py-1 rounded bg-rose-950 border border-rose-600 text-rose-300 hover:brightness-110 font-bold flex items-center gap-1"
            >
              <Siren className="w-3 h-3 text-rose-400" />
              <span>Ambulance</span>
            </button>
            <button
              onClick={() => onSpawnSingle('NORTH', 'BUS')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
            >
              + Bus
            </button>
            <button
              onClick={() => onSpawnSingle('WEST', 'CAR')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
            >
              + Car
            </button>
          </div>
        </div>
      </div>

      {/* 7. Live Telemetry Box */}
      <div className="p-3.5 rounded-2xl bg-[#070b14] border border-slate-800 text-xs font-mono space-y-1">
        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
          <span>Live Controller Metrics</span>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">Active Green:</span>
          <span className="text-[#00cc66] font-bold">{activeDirection}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">Phase State:</span>
          <span
            className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
              currentState === 'GREEN'
                ? 'text-[#00cc66] bg-emerald-950 border border-emerald-800'
                : currentState === 'YELLOW'
                ? 'text-[#ffd700] bg-amber-950 border border-amber-800 animate-pulse'
                : 'text-[#ff4d4d] bg-rose-950 border border-rose-800'
            }`}
          >
            {currentState} ({timeRemaining}s left)
          </span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
          <span className="text-slate-400">Vehicles on Road:</span>
          <span className="text-cyan-400 font-bold">{totalVehicles}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">Waiting in Queue:</span>
          <span className={`font-bold ${waitingVehicles > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
            {waitingVehicles}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">Traffic Density:</span>
          <span
            className={`font-bold ${
              flowDensity === 'HEAVY'
                ? 'text-rose-400'
                : flowDensity === 'NORMAL'
                ? 'text-emerald-400'
                : 'text-cyan-400'
            }`}
          >
            {flowDensity}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">Avg Wait Time:</span>
          <span className="text-slate-200 font-bold">{averageWaitTimeSec}s</span>
        </div>
      </div>
    </div>
  );
};
