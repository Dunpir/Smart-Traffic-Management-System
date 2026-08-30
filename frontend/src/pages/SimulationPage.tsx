import React, { useState, useEffect, useRef } from 'react';
import { TrafficSimulationEngine } from '../utils/simulationEngine';
import { TrafficSimulationView } from '../components/simulation/TrafficSimulationView';
import { TrafficControlPanel } from '../components/simulation/TrafficControlPanel';
import { ChaosModePanel } from '../components/simulation/ChaosModePanel';
import { SimulationTelemetryState } from '../types/simulation';
import {
  Activity,
  Radio,
  Cpu,
  Layers,
  ShieldAlert,
  Sparkles,
  Navigation,
  FileText,
  BookOpen,
  Camera,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

export const SimulationPage: React.FC = () => {
  const engineRef = useRef<TrafficSimulationEngine | null>(null);
  const [showPaperDetails, setShowPaperDetails] = useState<boolean>(false);

  // Initialize engine singleton instance for component lifecycle
  if (!engineRef.current) {
    engineRef.current = new TrafficSimulationEngine();
  }
  const engine = engineRef.current;

  const [state, setState] = useState<SimulationTelemetryState>(() => engine.getState());

  useEffect(() => {
    engine.setOnStateChange((newState) => {
      setState(newState);
    });

    const handleVoiceCommand = (e: Event) => {
      const customEv = e as CustomEvent<any>;
      const action = customEv.detail;
      if (!action) return;

      switch (action.type) {
        case 'SIMULATION_START':
          engine.start();
          break;
        case 'SIMULATION_PAUSE':
          engine.pause();
          break;
        case 'SIMULATION_RESET':
          engine.reset();
          break;
        case 'SIMULATION_SCENARIO':
          engine.setScenario(action.scenario);
          break;
        case 'SIMULATION_SPAWN':
          engine.spawnSingleVehicle(action.road, action.vehicleType);
          engine.start();
          break;
        case 'SIMULATION_SPEED':
          engine.setSimSpeed(action.speed);
          break;
      }
    };

    window.addEventListener('trafix:simulation:command', handleVoiceCommand);

    return () => {
      engine.pause();
      window.removeEventListener('trafix:simulation:command', handleVoiceCommand);
    };
  }, [engine]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8 text-slate-900 dark:text-white transition-colors">
      {/* Header Banner */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Traffic Management Simulation
              </h1>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-[#141417] dark:text-zinc-400 dark:border-[#222226]">
                STMS v3.2
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans mt-0.5">
              Adaptive density threshold allocation, Shortest Job First priority sorting &amp; emergency vehicle pre-emption.
            </p>
          </div>
        </div>

        {/* Paper Reference Button */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => {
              soundEffects.playClick();
              setShowPaperDetails(!showPaperDetails);
            }}
            className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 flex items-center gap-1.5 transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Research Notes</span>
          </button>

          <div className="px-2.5 py-1 rounded bg-slate-900 text-white dark:bg-white dark:text-black font-semibold text-xs shadow-xs">
            {state.mode === 'ADAPTIVE_STMS' ? 'ADAPTIVE ACTIVE' : state.mode}
          </div>
        </div>
      </div>

      {/* Emergency Active Alert Banner */}
      {state.activeEmergencyMessage && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300 text-xs font-mono flex items-center justify-between gap-3 animate-pulse shadow-xs">
          <div className="flex items-center gap-2 font-bold">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
            <span>{state.activeEmergencyMessage}</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px] uppercase">
            PRIORITY PRE-EMPTION
          </span>
        </div>
      )}

      {/* Main Grid: Centered Simulation Canvas + Right Control Panel */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4">
        {/* Centered Large 4-Way Canvas View */}
        <div className="flex-1 flex justify-center w-full max-w-[640px]">
          <TrafficSimulationView engine={engine} />
        </div>

        {/* Right Side STMS Traffic Control Panel */}
        <div className="w-full lg:w-96 flex justify-center">
          <TrafficControlPanel
            state={state}
            onSetMode={(mode) => engine.setMode(mode)}
            onSetScenario={(scen) => engine.setScenario(scen)}
            onSetManualDirection={(dir) => engine.setManualDirection(dir)}
            onSetCycleTime={(time) => engine.setFixedCycleTime(time)}
            onSetSpawnRate={(rate) => engine.setSpawnRate(rate)}
            onSetSimSpeed={(speed) => engine.setSimSpeed(speed)}
            onToggleCameraBboxes={() => engine.toggleCameraBboxes()}
            onSpawnSingle={(dir, type) => engine.spawnSingleVehicle(dir, type)}
            onStart={() => engine.start()}
            onPause={() => engine.pause()}
            onReset={() => engine.reset()}
          />
        </div>
      </div>

      {/* Chaos Mode & Stress-Test Disruption Sandbox */}
      <ChaosModePanel
        onTriggerEmergency={(dir) => engine.spawnSingleVehicle(dir, 'AMBULANCE')}
        onInjectSpike={(dir, count) => {
          for (let i = 0; i < Math.min(count, 15); i++) {
            engine.spawnSingleVehicle(dir as 'NORTH' | 'SOUTH' | 'EAST' | 'WEST', 'CAR');
          }
        }}
      />

      {/* Research Paper Methodology Drawer / Explainer */}
      {showPaperDetails && (
        <div className="p-4 sm:p-5 rounded-lg bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md border border-slate-200 dark:border-[#1f1f23]/80 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-[#1f1f23]">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
              <span>STMS Adaptive Algorithm Specifications</span>
            </div>
            <button
              onClick={() => setShowPaperDetails(false)}
              className="text-xs font-mono text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
            >
              [Close]
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23]">
              <h4 className="font-semibold text-slate-900 dark:text-white uppercase mb-1">1. Density Thresholds</h4>
              <p className="text-slate-600 dark:text-zinc-400 leading-relaxed font-mono text-[11px]">
                Allocates dynamic green signal duration:
                <br />• <strong>0 cars:</strong> 0s (Skipped)
                <br />• <strong>1–10 cars:</strong> 20 seconds
                <br />• <strong>11–30 cars:</strong> 30 seconds
                <br />• <strong>&gt;30 cars:</strong> 60 seconds
              </p>
            </div>

            <div className="p-3 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23]">
              <h4 className="font-semibold text-slate-900 dark:text-white uppercase mb-1">2. Shortest Job First</h4>
              <p className="text-slate-600 dark:text-zinc-400 leading-relaxed font-mono text-[11px]">
                All 4 approaches are sorted in descending order of vehicle queue. The most congested lane gets Green first.
              </p>
            </div>

            <div className="p-3 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23]">
              <h4 className="font-semibold text-slate-900 dark:text-white uppercase mb-1">3. Emergency Override</h4>
              <p className="text-slate-600 dark:text-zinc-400 leading-relaxed font-mono text-[11px]">
                Ambulances and Fire Trucks trigger instant phase pre-emption, clearing conflicting signals within 2.5s.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
