import React, { useState, useEffect, useRef } from 'react';
import { TrafficSimulationEngine } from '../utils/simulationEngine';
import { TrafficSimulationView } from '../components/simulation/TrafficSimulationView';
import { ThreeIntersectionViewer } from '../components/simulation/ThreeIntersectionViewer';
import { TrafficControlPanel } from '../components/simulation/TrafficControlPanel';
import { ChaosModePanel } from '../components/simulation/ChaosModePanel';
import { SimulationHud } from '../components/simulation/SimulationHud';
import { SimulationBenchmarkModal } from '../components/simulation/SimulationBenchmarkModal';
import { SimulationTheoryModal } from '../components/simulation/SimulationTheoryModal';
import { MutcdTimingCalculatorModal } from '../components/junction/MutcdTimingCalculatorModal';
import { VisionZeroSafetyModal } from '../components/pedestrian/VisionZeroSafetyModal';
import { DotMunicipalReportModal } from '../components/reports/DotMunicipalReportModal';
import { HcmLevelOfServicePanel } from '../components/simulation/HcmLevelOfServicePanel';
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
  Box,
  BarChart3,
  Award,
  Zap,
  Calculator,
  ShieldCheck,
  Gauge,
  Printer,
  Maximize2,
} from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

export const SimulationPage: React.FC = () => {
  const engineRef = useRef<TrafficSimulationEngine | null>(null);
  const [showPaperDetails, setShowPaperDetails] = useState<boolean>(false);
  const [is3DView, setIs3DView] = useState<boolean>(() => {
    const saved = localStorage.getItem('trafix:sim:viewMode');
    return saved ? saved === '3d' : true;
  });
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState<boolean>(false);
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);
  const [isMutcdOpen, setIsMutcdOpen] = useState<boolean>(false);
  const [isVisionZeroOpen, setIsVisionZeroOpen] = useState<boolean>(false);
  const [isDotReportOpen, setIsDotReportOpen] = useState<boolean>(false);
  const [lpiSeconds, setLpiSeconds] = useState<number>(4);

  // Initialize engine singleton instance for component lifecycle
  if (!engineRef.current) {
    const eng = new TrafficSimulationEngine();
    eng.start();
    engineRef.current = eng;
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
    <div className="space-y-4 max-w-7xl mx-auto pb-10 text-slate-900 dark:text-white transition-colors">
      {/* Top Header */}
      <div className="bg-white/95 dark:bg-[#090d16]/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Autonomous Traffic Signal Simulation
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                STMS v3.2
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans mt-0.5">
              Adaptive density threshold allocation, Shortest Job First queue dispatching, and emergency vehicle pre-emption.
            </p>
          </div>
        </div>

        {/* Quick Engineering & Academic Action Links */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            onClick={() => {
              soundEffects.playClick();
              setIsMutcdOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition cursor-pointer font-bold shadow-xs"
            title="Open ITE & MUTCD kinematic clearance equation workbench"
          >
            <Calculator className="w-3.5 h-3.5 text-cyan-400" />
            <span>MUTCD Clearance</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setIsVisionZeroOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition cursor-pointer font-bold shadow-xs"
            title="Configure Vision Zero Leading Pedestrian Interval (LPI) head start"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Vision Zero LPI</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setIsDotReportOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 flex items-center gap-1.5 transition cursor-pointer font-bold shadow-xs"
            title="Generate and print official Department of Transportation (DOT) performance audit report"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>DOT Report</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setIsBenchmarkOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition cursor-pointer font-semibold shadow-xs"
            title="Open side-by-side comparative benchmark vs. Fixed Cycle timers"
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Benchmark vs Fixed</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setIsTheoryOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition cursor-pointer font-semibold shadow-xs"
            title="Open Webster Optimum Cycle and Greenshields queuing theory formulas"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Queue Theory</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setShowPaperDetails(!showPaperDetails);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white dark:border-slate-800 flex items-center gap-1.5 transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Methodology</span>
          </button>
        </div>
      </div>

      {/* Real-Time Smart City Traffic Command HUD */}
      <SimulationHud
        state={state}
        cumulativeCleared={state.cumulativeCleared}
        fuelSavedLiters={state.fuelSavedLiters}
        co2SavedKg={state.co2SavedKg}
      />

      {/* Emergency Active Alert Banner */}
      {state.activeEmergencyMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-600/80 text-red-700 dark:text-red-300 text-xs font-mono flex items-center justify-between gap-3 animate-pulse shadow-md">
          <div className="flex items-center gap-2 font-bold">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
            <span>{state.activeEmergencyMessage}</span>
          </div>
          <span className="px-2.5 py-1 rounded bg-red-600 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-sm">
            INSTANT PRE-EMPTION
          </span>
        </div>
      )}

      {/* Main Grid: Centered Simulation Canvas + Right Control Panel */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-5">
        {/* Centered Large 4-Way Canvas View */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[640px] space-y-2">
          {/* View Toggle Bar (2D Canvas vs 3D WebGL Twin) */}
          <div className="w-full flex items-center justify-between px-1 py-1 gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              {is3DView ? '3D WebGL Digital Twin Mode' : '2D Discrete State Simulation (60 FPS)'}
            </span>
            <div className="flex items-center gap-2">
              {/* Single Clean Black Full Screen Button */}
              <button
                onClick={() => {
                  soundEffects.playClick();
                  window.dispatchEvent(new CustomEvent('trafix:sim:toggle-fullscreen'));
                }}
                className="px-3 py-1.5 rounded-lg bg-black hover:bg-neutral-900 text-white border border-neutral-800 transition flex items-center gap-1.5 cursor-pointer text-xs font-mono font-medium shadow-sm"
                title="Full Screen Simulation (F)"
              >
                <Maximize2 className="w-3.5 h-3.5 text-neutral-300" />
                <span>Full Screen</span>
              </button>

              <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono">
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setIs3DView(false);
                    localStorage.setItem('trafix:sim:viewMode', '2d');
                  }}
                  className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                    !is3DView
                      ? 'bg-slate-900 text-white font-semibold dark:bg-white dark:text-black shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>2D Canvas</span>
                </button>
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setIs3DView(true);
                    localStorage.setItem('trafix:sim:viewMode', '3d');
                  }}
                  className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                    is3DView
                      ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/50 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>3D Twin</span>
                </button>
              </div>
            </div>
          </div>

          {is3DView ? (
            <ThreeIntersectionViewer
              engine={engine}
              state={state}
              onTriggerGreen={(dir) => engine.setManualDirection(dir)}
            />
          ) : (
            <TrafficSimulationView engine={engine} state={state} />
          )}
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

      {/* HCM 6th Edition Level of Service & V/C Operations Panel */}
      <HcmLevelOfServicePanel state={state} />

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
        <div className="p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 space-y-3 shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-cyan-500" />
              <span>STMS Adaptive Algorithm Engineering Specifications</span>
            </div>
            <button
              onClick={() => setShowPaperDetails(false)}
              className="text-xs font-mono text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer px-2 py-1 rounded bg-slate-100 dark:bg-slate-800"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-slate-800">
              <h4 className="font-semibold text-slate-900 dark:text-white uppercase mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                1. Density Threshold Matrix
              </h4>
              <p className="text-slate-600 dark:text-zinc-400 leading-relaxed font-mono text-[11px]">
                Allocates dynamic green signal duration based on computer vision vehicle counts:
                <br />• <strong>0 cars:</strong> 0s (Skipped automatically)
                <br />• <strong>1–10 cars:</strong> 20 seconds
                <br />• <strong>11–30 cars:</strong> 30 seconds
                <br />• <strong>&gt;30 cars:</strong> 60 seconds (Heavy congestion cap)
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-slate-800">
              <h4 className="font-semibold text-slate-900 dark:text-white uppercase mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                2. Shortest Job First (SJF)
              </h4>
              <p className="text-slate-600 dark:text-zinc-400 leading-relaxed font-mono text-[11px]">
                All 4 approaches are prioritized dynamically by queue depth. The approach with the highest vehicle accumulation receives green first, minimizing network-wide total waiting latency.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-slate-800">
              <h4 className="font-semibold text-slate-900 dark:text-white uppercase mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                3. Pre-Emptive Priority &amp; Pedestrian
              </h4>
              <p className="text-slate-600 dark:text-zinc-400 leading-relaxed font-mono text-[11px]">
                Emergency vehicles (Ambulance, Fire Brigade) interrupt current cycles within 2.5s via rapid yellow transition. Pedestrian calls actuate protected zebra crossing clearance phases.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Algorithm Benchmark Modal */}
      <SimulationBenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
        stmsWaitSec={state.averageWaitTimeSec}
      />

      {/* Queuing Theory & Webster Equation Calculator Modal */}
      <SimulationTheoryModal
        isOpen={isTheoryOpen}
        onClose={() => setIsTheoryOpen(false)}
      />

      {/* MUTCD & ITE Signal Clearance & Timing Modal */}
      <MutcdTimingCalculatorModal
        isOpen={isMutcdOpen}
        onClose={() => setIsMutcdOpen(false)}
        onApplyTimings={(timings) => {
          engine.setFixedCycleTime(Math.round(timings.yellowTime + timings.allRedTime + 30));
        }}
      />

      {/* Vision Zero Pedestrian Safety Modal (Leading Pedestrian Interval) */}
      <VisionZeroSafetyModal
        isOpen={isVisionZeroOpen}
        onClose={() => setIsVisionZeroOpen(false)}
        lpiSeconds={lpiSeconds}
        onSetLpi={(sec) => setLpiSeconds(sec)}
      />

      {/* Official DOT Municipal Incident & Performance Report Modal */}
      <DotMunicipalReportModal
        isOpen={isDotReportOpen}
        onClose={() => setIsDotReportOpen(false)}
        state={state}
      />
    </div>
  );
};

