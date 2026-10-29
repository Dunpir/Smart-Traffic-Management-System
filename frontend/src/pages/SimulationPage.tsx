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
  Usb,
  AlertTriangle,
  ChevronDown,
  Sliders,
} from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';
import { webSerialService, HardwareSyncStatus } from '../services/webSerialService';
import { api } from '../services/api';
import { Direction, LightState } from '../types';

export const SimulationPage: React.FC = () => {
  const engineRef = useRef<TrafficSimulationEngine | null>(null);
  const [showPaperDetails, setShowPaperDetails] = useState<boolean>(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState<boolean>(false);
  const [isSafariNoticeVisible, setIsSafariNoticeVisible] = useState<boolean>(true);
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
  const [isHardwareConnected, setIsHardwareConnected] = useState<boolean>(webSerialService.getIsConnected());
  const [portName, setPortName] = useState<string>(webSerialService.getPortName() || 'ESP32 (115200 Baud)');
  const [syncStatus, setSyncStatus] = useState<HardwareSyncStatus>(webSerialService.getSyncStatus());
  const [syncError, setSyncError] = useState<string | null>(webSerialService.getSyncErrorMessage());
  const [isConnectingUsb, setIsConnectingUsb] = useState<boolean>(false);
  const isWebSerialSupported = webSerialService.isSupported();
  const lastSignalSyncRef = useRef<string>('');

  const handleConnectUsb = async () => {
    soundEffects.playClick();
    setIsConnectingUsb(true);
    const res = await webSerialService.connect(115200);
    setIsConnectingUsb(false);
    if (res.success) {
      setIsHardwareConnected(true);
      setPortName(webSerialService.getPortName() || 'ESP32 (115200 Baud)');
      webSerialService.setAuthoritativeSource('SIMULATION');
      webSerialService.releaseManualLock();

      // Immediately push active simulation signal state down to physical LEDs
      const curState = engine.getState();
      if (curState.signals) {
        webSerialService.syncTrafficState(
          {
            NORTH: { currentSignal: curState.signals.NORTH || 'RED' },
            EAST: { currentSignal: curState.signals.EAST || 'RED' },
            SOUTH: { currentSignal: curState.signals.SOUTH || 'RED' },
            WEST: { currentSignal: curState.signals.WEST || 'RED' },
          },
          (curState.activeDirection || 'NORTH') as Direction,
          curState.currentState || 'GREEN',
          Boolean(curState.activeEmergencyMessage),
          curState.pedestrianActive ? 'WALK' : 'IDLE',
          'SIMULATION'
        );
      }
    }
  };

  const handleDisconnectUsb = async () => {
    soundEffects.playClick();
    await webSerialService.disconnect();
    setIsHardwareConnected(false);
  };

  useEffect(() => {
    // Establish Simulation as the authoritative master over hardware
    webSerialService.setAuthoritativeSource('SIMULATION');
    webSerialService.releaseManualLock();

    // Subscribe to hardware synchronization state machine
    const unsubSync = webSerialService.subscribeSyncStatus((status, err) => {
      setSyncStatus(status);
      setSyncError(err || null);
    });

    // Listen to physical hardware triggers (HIL bidirectional link)
    const unsubTelemetry = webSerialService.subscribeTelemetry((data) => {
      if (data.type === 'EVENT') {
        if (data.event === 'IR_STATE' && data.active) {
          // Physical IR sensor tripped on breadboard: spawn a vehicle on that lane in 3D!
          const dir = (data.lane || 'NORTH') as any;
          engine.spawnSingleVehicle(dir, 'CAR');
        } else if (data.event === 'RF_EMERGENCY' || data.event === 'EMERGENCY') {
          // Physical RF remote tripped: spawn an emergency ambulance in 3D!
          const dir = (data.lane || 'EAST') as any;
          engine.spawnSingleVehicle(dir, 'AMBULANCE');
        }
      }
    });

    const unsubStatus = webSerialService.subscribeStatus((connected, port) => {
      setIsHardwareConnected(connected);
      if (port) setPortName(port);
    });

    engine.setOnStateChange((newState) => {
      setState(newState);

      // HARDWARE MIMIC: Physical ESP32 hardware mimics whatever is happening in simulation tab!
      if (newState.signals) {
        const activeDir = (newState.activeDirection || 'NORTH') as Direction;
        const phase = newState.currentState || 'GREEN';
        const hasEmergency = Boolean(newState.activeEmergencyMessage);
        const pedPhase = newState.pedestrianActive ? 'WALK' : 'IDLE';

        const sigKey = `${activeDir}_${phase}_${newState.signals.NORTH}_${newState.signals.EAST}_${newState.signals.SOUTH}_${newState.signals.WEST}_${hasEmergency}_${pedPhase}`;
        if (sigKey !== lastSignalSyncRef.current) {
          lastSignalSyncRef.current = sigKey;

          const roadSignals: Record<Direction, { currentSignal: LightState }> = {
            NORTH: { currentSignal: newState.signals.NORTH || 'RED' },
            EAST: { currentSignal: newState.signals.EAST || 'RED' },
            SOUTH: { currentSignal: newState.signals.SOUTH || 'RED' },
            WEST: { currentSignal: newState.signals.WEST || 'RED' },
          };

          // Actuate physical hardware via USB WebSerial in real time
          webSerialService.syncTrafficState(
            roadSignals,
            activeDir,
            phase,
            hasEmergency,
            pedPhase,
            'SIMULATION'
          );

          // Debounced sync with backend cloud for Wi-Fi clients & database
          const targetSig = phase === 'GREEN' ? 'GREEN' : phase === 'YELLOW' ? 'YELLOW' : 'RED';
          api.sendManualCommand(activeDir, targetSig, Math.round(newState.timeRemaining || 20)).catch(() => {});
        }
      }
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
      unsubSync();
      unsubTelemetry();
      unsubStatus();
      webSerialService.setAuthoritativeSource('DASHBOARD');
      engine.pause();
      window.removeEventListener('trafix:simulation:command', handleVoiceCommand);
    };
  }, [engine]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 text-slate-900 dark:text-white transition-colors">
      {/* Precision Digital Twin Command Bar */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/85 backdrop-blur-md p-3 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        {/* Left: Viewport Identifier */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center shrink-0 text-cyan-500">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Virtual Digital Twin
              </h1>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700 dark:bg-zinc-900 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">
                STMS v3.2 · ACTUATED
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono hidden sm:block">
              NEMA-TS2 Dual-Ring Actuated Signal Controller with Hardware-in-the-Loop (HIL)
            </p>
          </div>
        </div>

        {/* Right: Hardware Link Pill + Unified Engineering Tools Menu */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Compact Hardware Status Pill */}
          <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
            isHardwareConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-slate-100 dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
          }`}>
            <Usb className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span className="text-[11px] font-medium hidden sm:inline">
              {isHardwareConnected ? `ESP32 Linked (${portName})` : 'Hardware HIL'}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${isHardwareConnected ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'}`} />

            {syncStatus === 'SYNCHRONIZED' && (
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/80">
                SYNC
              </span>
            )}
            {syncStatus === 'CONNECTING' && (
              <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/80 animate-pulse">
                CONNECTING
              </span>
            )}

            {!isHardwareConnected ? (
              <button
                type="button"
                onClick={handleConnectUsb}
                disabled={isConnectingUsb}
                className="ml-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-semibold text-[10px] transition cursor-pointer shadow-xs"
                title={!isWebSerialSupported ? 'Apple Safari blocks Web Serial. Open Chrome or Edge to link physical ESP32.' : 'Connect ESP32 via USB Serial'}
              >
                {isConnectingUsb ? 'Connecting...' : 'Connect USB'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDisconnectUsb}
                className="ml-1 px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[10px] transition cursor-pointer"
              >
                Disconnect
              </button>
            )}
          </div>

          {/* Quick Benchmark Button */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setIsBenchmarkOpen(true);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
            title="Open Comparative Benchmark vs. Fixed Timers"
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Benchmark</span>
          </button>

          {/* Quick DOT Report Button */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setIsDotReportOpen(true);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
            title="Generate Department of Transportation (DOT) Audit Report"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">DOT Audit</span>
          </button>

          {/* Unified Engineering Tools Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setIsToolsDropdownOpen(!isToolsDropdownOpen);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Engineering Tools</span>
              <ChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
            </button>

            {isToolsDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-1.5 shadow-2xl z-30 font-mono text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsToolsDropdownOpen(false);
                    setIsMutcdOpen(true);
                  }}
                  className="w-full px-2.5 py-2 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center gap-2 text-slate-800 dark:text-zinc-200 cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                  <div>
                    <div className="font-semibold">MUTCD Clearance Workbench</div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-500 font-sans">ITE kinematic clearance equations</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsToolsDropdownOpen(false);
                    setIsVisionZeroOpen(true);
                  }}
                  className="w-full px-2.5 py-2 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center gap-2 text-slate-800 dark:text-zinc-200 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <div>
                    <div className="font-semibold">Vision Zero LPI Head Start</div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-500 font-sans">Leading pedestrian intervals</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsToolsDropdownOpen(false);
                    setIsTheoryOpen(true);
                  }}
                  className="w-full px-2.5 py-2 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center gap-2 text-slate-800 dark:text-zinc-200 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <div>
                    <div className="font-semibold">Webster Queueing Theory</div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-500 font-sans">Optimum cycle time & delay models</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsToolsDropdownOpen(false);
                    setShowPaperDetails(!showPaperDetails);
                  }}
                  className="w-full px-2.5 py-2 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center gap-2 text-slate-800 dark:text-zinc-200 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  <div>
                    <div className="font-semibold">Research Methodology</div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-500 font-sans">Mathematical paper formulation</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compact Safari WebSerial Advisory Strip (Dismissible) */}
      {!isWebSerialSupported && isSafariNoticeVisible && (
        <div className="px-3.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-mono flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong className="text-amber-300">Safari Notice:</strong> Apple Safari blocks Web Serial USB hardware link. Use <strong className="text-white underline">Google Chrome</strong> or <strong className="text-white underline">Microsoft Edge</strong> to connect physical ESP32 LEDs.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsSafariNoticeVisible(false)}
            className="text-amber-400 hover:text-white p-1 rounded transition cursor-pointer text-xs"
            title="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

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

