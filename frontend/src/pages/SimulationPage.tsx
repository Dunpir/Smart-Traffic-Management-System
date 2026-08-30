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
    <div className="space-y-5 max-w-7xl mx-auto pb-8 animate-fadeIn">
      {/* Header Banner with Research Paper Citation */}
      <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-[#081320] via-[#0a1b2d] to-[#070b14] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-950/80">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                Smart Traffic Management System (STMS) Simulation
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                NITRA CSE 2025 IJSET
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Adaptive density threshold allocation, Shortest Job First priority sorting &amp; emergency vehicle pre-emption
            </p>
          </div>
        </div>

        {/* Paper Reference Button */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <button
            onClick={() => setShowPaperDetails(!showPaperDetails)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Research Methodology</span>
          </button>

          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-emerald-400 font-bold">
            {state.mode === 'ADAPTIVE_STMS' ? 'ADAPTIVE ACTIVE' : state.mode}
          </div>
        </div>
      </div>

      {/* Emergency Active Alert Banner (Paper Page 4) */}
      {state.activeEmergencyMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-500 text-rose-200 text-xs font-mono flex items-center justify-between gap-3 animate-pulse shadow-xl shadow-rose-950/80">
          <div className="flex items-center gap-2.5 font-bold">
            <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 animate-bounce" />
            <span>{state.activeEmergencyMessage}</span>
          </div>
          <span className="px-3 py-1 rounded-xl bg-rose-900 text-white font-bold text-[10px] uppercase">
            PRIORITY PRE-EMPTION
          </span>
        </div>
      )}

      {/* Main Grid: Centered Simulation Canvas + Right Control Panel */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
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
        <div className="p-6 rounded-3xl glass-panel border border-cyan-500/30 bg-slate-900/90 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-cyan-400 font-bold font-mono text-sm uppercase">
              <BookOpen className="w-5 h-5" />
              <span>STMS Research Paper Implementation Specifications</span>
            </div>
            <button
              onClick={() => setShowPaperDetails(false)}
              className="text-xs font-mono text-slate-400 hover:text-white"
            >
              [Close]
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <h4 className="font-bold text-cyan-300 uppercase mb-1.5">1. Density Thresholds (Fig -4)</h4>
              <p className="text-slate-300 leading-relaxed">
                Allocates dynamic green signal duration based on detected vehicle count:
                <br />• <strong>0 cars:</strong> 0s (Skipped immediately)
                <br />• <strong>1–10 cars:</strong> 20 seconds
                <br />• <strong>11–30 cars:</strong> 30 seconds
                <br />• <strong>&gt;30 cars:</strong> 60 seconds
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <h4 className="font-bold text-emerald-300 uppercase mb-1.5">2. Shortest Job First / Most Jammed</h4>
              <p className="text-slate-300 leading-relaxed">
                All 4 approaches (Cam 1–4) are sorted in descending order of vehicle count. The most congested lane gets Green first, and vehicles that cross the stop line are marked as <em>"crossed"</em> and removed from green-time calculation.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <h4 className="font-bold text-rose-300 uppercase mb-1.5">3. Emergency Vehicle Priority</h4>
              <p className="text-slate-300 leading-relaxed">
                Ambulances and Fire Trucks are detected with optical blob priority, instantly overriding conflicting signals to force green clearance and reduce emergency response times.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
