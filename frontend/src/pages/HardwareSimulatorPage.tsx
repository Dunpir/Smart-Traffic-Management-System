import React, { useState, useEffect } from 'react';
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
  AlertTriangle,
  Lock,
  Volume2,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import {
  Direction,
  LightState,
  HardwareState,
  SimulationConfig,
  EmergencyVehicleType,
  JunctionLiveTelemetry,
} from '../types';
import { api } from '../services/api';
import { soundEffects } from '../utils/soundEffects';
import { webSerialService, SerialLogEntry } from '../services/webSerialService';
import { HilSerialBridgeModal } from '../components/hardware/HilSerialBridgeModal';

interface HardwareSimulatorPageProps {
  telemetry?: JunctionLiveTelemetry | null;
  hardwareState: HardwareState | null;
  simConfig: SimulationConfig | null;
  onRefresh: () => void;
}

export const HardwareSimulatorPage: React.FC<HardwareSimulatorPageProps> = ({
  telemetry,
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
  const [overrideDuration, setOverrideDuration] = useState<number>(30);
  const [buzzerPulsing, setBuzzerPulsing] = useState<boolean>(false);
  const [activeLow, setActiveLow] = useState<boolean>(webSerialService.getPolarity());
  const [activeSignalOverride, setActiveSignalOverride] = useState<Direction | null>(null);

  // Live WebSerial state & telemetry directly from physical ESP32
  const [isSerialConnected, setIsSerialConnected] = useState<boolean>(webSerialService.getIsConnected());
  const [portName, setPortName] = useState<string>(webSerialService.getPortName() || 'ESP32 (115200 Baud)');
  const [serialLogs, setSerialLogs] = useState<SerialLogEntry[]>(webSerialService.getLogs());
  const [liveHardwareSignals, setLiveHardwareSignals] = useState<Record<Direction, LightState> | null>(null);
  const [liveHardwareSensors, setLiveHardwareSensors] = useState<Record<Direction, boolean>>({
    NORTH: false,
    EAST: false,
    SOUTH: false,
    WEST: false,
  });
  const [liveHardwareMode, setLiveHardwareMode] = useState<string>('AUTO');

  const isSimRunning = simConfig?.isRunning ?? false;
  const isArduinoAttached = hardwareState?.connected || isSerialConnected;
  const isWebSerialSupported = webSerialService.isSupported();

  useEffect(() => {
    setIsSerialConnected(webSerialService.getIsConnected());
    setPortName(webSerialService.getPortName() || 'ESP32 (115200 Baud)');
    setSerialLogs(webSerialService.getLogs());

    const unsubStatus = webSerialService.subscribeStatus((connected, port) => {
      setIsSerialConnected(connected);
      if (port) setPortName(port);
    });

    const unsubLogs = webSerialService.subscribeLogs((entry) => {
      setSerialLogs((prev) => [entry, ...prev.slice(0, 59)]);
    });

    const unsubTelemetry = webSerialService.subscribeTelemetry((data) => {
      if (data.type === 'TELEMETRY') {
        if (data.mode) {
          setLiveHardwareMode(data.mode);
        }
        if (data.lanes) {
          const nextSignals: Partial<Record<Direction, LightState>> = {};
          const nextSensors: Partial<Record<Direction, boolean>> = {};
          (['NORTH', 'EAST', 'SOUTH', 'WEST'] as Direction[]).forEach((d) => {
            if (data.lanes[d]) {
              nextSignals[d] = data.lanes[d].sig as LightState;
              nextSensors[d] = Boolean(data.lanes[d].ir);
            }
          });
          setLiveHardwareSignals((prev) => ({ ...prev, ...(nextSignals as any) }));
          setLiveHardwareSensors((prev) => ({ ...prev, ...(nextSensors as any) }));
        }
      }
    });

    return () => {
      unsubStatus();
      unsubLogs();
      unsubTelemetry();
    };
  }, []);

  const handleConnectUsb = async () => {
    soundEffects.playClick();
    setLoading(true);
    const res = await webSerialService.connect(115200);
    setLoading(false);
    if (res.success) {
      setIsSerialConnected(true);
      setPortName(webSerialService.getPortName());
      onRefresh();
    }
  };

  const handleDisconnectUsb = async () => {
    soundEffects.playClick();
    setLoading(true);
    await webSerialService.disconnect();
    setLoading(false);
    setIsSerialConnected(false);
    onRefresh();
  };

  /**
   * STRICT SINGLE-GREEN ACTUATION:
   * Sets target direction to GREEN and forces all other 3 directions to RED
   */
  const handleForceGreen = async (direction: Direction) => {
    try {
      soundEffects.playClick();
      setLoading(true);
      setActiveSignalOverride(direction);

      // 1. Direct hardware actuation with manual lock (forces single-green and blocks auto-sync)
      await webSerialService.forceDirectionGreen(direction, overrideDuration);

      // 2. Command backend traffic engine & hardware service (Enforces single-green across Neo4j & WebSocket)
      await api.sendManualCommand(direction, 'GREEN', overrideDuration).catch(() => {});
    } catch (e) {
      console.error('Error applying manual green override:', e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ALL-RED SAFETY LOCK:
   * Immediately sets all 4 directions to RED
   */
  const handleAllRed = async () => {
    try {
      soundEffects.playClick();
      setLoading(true);
      setActiveSignalOverride(null);
      await webSerialService.testAllRed(overrideDuration);
      await api.sendManualCommand('NORTH', 'RED', overrideDuration).catch(() => {});
    } catch (e) {
      console.error('Error locking all red:', e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * RESUME AUTOMATIC CYCLE
   */
  const handleResumeAuto = async () => {
    try {
      soundEffects.playClick();
      setLoading(true);
      setActiveSignalOverride(null);
      webSerialService.resumeAutomatic();
      await api.setMode('AUTOMATIC').catch(() => {});
      await api.startCycle().catch(() => {});
      onRefresh();
    } catch (e) {
      console.error('Error resuming automatic cycle:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePolarity = async () => {
    soundEffects.playClick();
    const next = !activeLow;
    setActiveLow(next);
    await webSerialService.setPolarity(next);
  };

  /**
   * TEST PHYSICAL BUZZER (GPIO 15)
   */
  const handlePulseBuzzer = async () => {
    soundEffects.playClick();
    setBuzzerPulsing(true);
    await webSerialService.testBuzzer(true);
    setTimeout(async () => {
      await webSerialService.testBuzzer(false);
      setBuzzerPulsing(false);
    }, 800);
  };

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

  // Helper to determine current signal of an approach
  const getSignalFor = (dir: Direction): LightState => {
    if (activeSignalOverride) {
      return dir === activeSignalOverride ? 'GREEN' : 'RED';
    }
    if (isSerialConnected && liveHardwareSignals?.[dir]) {
      return liveHardwareSignals[dir];
    }
    if (hardwareState?.actualHardwareSignalState?.[dir]) {
      return hardwareState.actualHardwareSignalState[dir];
    }
    if (telemetry?.roads?.[dir]?.currentSignal) {
      return telemetry.roads[dir].currentSignal;
    }
    return dir === 'NORTH' ? 'GREEN' : 'RED';
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 text-slate-900 dark:text-white transition-colors">
      {/* 1. Header Banner */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-950/40">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Central Hardware Control Station
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono font-bold">
                SOLE CONTROL AREA
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans mt-0.5">
              The exclusive control center for physical ESP32/Arduino actuators. Strict safety interlock: strictly <strong>one green approach</strong> permitted at any time.
            </p>
          </div>
        </div>

        {/* Hardware USB Actions */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {!isSerialConnected ? (
            <button
              onClick={handleConnectUsb}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded font-bold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/60 transition cursor-pointer shadow-md shadow-cyan-950/50"
            >
              <Usb className="w-4 h-4 text-cyan-400" />
              <span>CONNECT USB (115200 BAUD)</span>
            </button>
          ) : (
            <button
              onClick={handleDisconnectUsb}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded font-bold bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-600/50 transition cursor-pointer"
            >
              <Usb className="w-4 h-4 text-rose-400" />
              <span>DISCONNECT USB</span>
            </button>
          )}

          <button
            onClick={() => {
              soundEffects.playClick();
              setIsHilModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 transition cursor-pointer font-semibold"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
            <span>FIRMWARE &amp; SETUP GUIDE</span>
          </button>
        </div>
      </div>

      {/* Safari / WebSerial Warning if opened in Safari */}
      {!isWebSerialSupported && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans shadow-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-bold text-white">Safari Browser Detected:</span>{' '}
              Apple Safari blocks web pages from accessing physical USB ports. To link your physical ESP32 via USB cable, please open this website in{' '}
              <strong className="text-white underline">Google Chrome</strong>, <strong className="text-white underline">Microsoft Edge</strong>, or <strong className="text-white underline">Brave</strong>.
            </div>
          </div>
        </div>
      )}

      {/* 2. MASTER HARDWARE SIGNAL ACTUATOR DECK (THE ONE EXCLUSIVE CONTROL AREA) */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border-2 border-cyan-500/40 hover:border-cyan-500/60 shadow-lg shadow-cyan-950/20 space-y-4">
        {/* Deck Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#1f1f23]">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-500" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Interlocked Hardware Actuator Matrix
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
              STRICT SINGLE-GREEN GUARANTEE
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            {/* Polarity selector */}
            <button
              onClick={handleTogglePolarity}
              title="Toggle output voltage polarity: Active HIGH for standard LEDs, Active LOW for Relay Modules"
              className="px-2 py-0.5 rounded font-mono text-[10px] font-bold border transition flex items-center gap-1 cursor-pointer bg-slate-100 dark:bg-black text-cyan-600 dark:text-cyan-400 border-cyan-500/40 hover:border-cyan-400"
            >
              <span>LED:</span>
              <strong className="text-amber-500 dark:text-amber-300">
                {activeLow ? 'LOW (Relay)' : 'HIGH (Direct LED)'}
              </strong>
            </button>

            {/* Mode Indicator */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-zinc-400">Mode:</span>
              <span className={`px-2 py-0.5 rounded font-bold border ${
                isSerialConnected && liveHardwareMode === 'MANUAL'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/40'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
              }`}>
                {isSerialConnected ? `ESP32 ${liveHardwareMode}` : (telemetry?.mode || 'AUTOMATIC')}
              </span>
            </div>

            {/* Override duration selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-zinc-400">Duration:</span>
              <input
                type="number"
                min="5"
                max="120"
                value={overrideDuration}
                onChange={(e) => setOverrideDuration(Number(e.target.value))}
                className="w-16 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-black border border-slate-300 dark:border-zinc-700 text-xs font-mono text-center font-bold"
              />
              <span className="text-slate-500 dark:text-zinc-400">sec</span>
            </div>
          </div>
        </div>

        {/* 4 Approach Actuator Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { dir: 'NORTH' as Direction, name: 'North Boulevard', redPin: 'D2', yelPin: 'D4', grnPin: 'D5', irPin: 'GPIO 32' },
            { dir: 'EAST' as Direction,  name: 'East Highway',    redPin: 'D18', yelPin: 'D19', grnPin: 'D21', irPin: 'GPIO 33' },
            { dir: 'SOUTH' as Direction, name: 'South Avenue',    redPin: 'D22', yelPin: 'D23', grnPin: 'D13', irPin: 'GPIO 34' },
            { dir: 'WEST' as Direction,  name: 'West Expressway', redPin: 'D12', yelPin: 'D14', grnPin: 'D27', irPin: 'GPIO 35' },
          ].map(({ dir, name, redPin, yelPin, grnPin, irPin }) => {
            const currentSig = getSignalFor(dir);
            const isGreen = currentSig === 'GREEN';
            const isYellow = currentSig === 'YELLOW';
            const isRed = currentSig === 'RED';

            return (
              <div
                key={dir}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isGreen
                    ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                    : isYellow
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-slate-50/80 dark:bg-black/80 border-slate-200 dark:border-[#1f1f23]'
                }`}
              >
                <div>
                  {/* Top: Approach Name & Live Indicator */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-bold font-mono text-slate-900 dark:text-white block">
                        {dir} ROAD
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate">
                        {name}
                      </span>
                    </div>

                    {/* Signal Status Badge */}
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          isGreen
                            ? 'bg-emerald-400 animate-ping shadow-md shadow-emerald-400'
                            : isYellow
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-rose-500'
                        }`}
                      />
                      <span
                        className={
                          isGreen
                            ? 'text-emerald-400'
                            : isYellow
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }
                      >
                        {currentSig}
                      </span>
                    </div>
                  </div>

                  {/* Hardware GPIO Pin Reference */}
                  <div className="p-2 rounded bg-black/60 border border-zinc-800 text-[10px] font-mono text-zinc-400 space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span>Red: <strong className={isRed ? 'text-rose-400 font-bold' : 'text-zinc-500'}>{redPin}</strong></span>
                      <span>Yel: <strong className={isYellow ? 'text-amber-400 font-bold' : 'text-zinc-500'}>{yelPin}</strong></span>
                      <span>Grn: <strong className={isGreen ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>{grnPin}</strong></span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-zinc-800/80">
                      <span>IR ({irPin}):</span>
                      <strong className={liveHardwareSensors[dir] ? 'text-amber-400 font-bold animate-pulse' : 'text-zinc-500'}>
                        {liveHardwareSensors[dir] ? 'VEHICLE PRESENT' : 'CLEAR'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Single-Green Force Action Button */}
                <button
                  onClick={() => handleForceGreen(dir)}
                  disabled={loading || isGreen}
                  className={`w-full py-2 px-3 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    isGreen
                      ? 'bg-emerald-600 text-white cursor-default shadow-md shadow-emerald-600/40'
                      : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black shadow-xs'
                  }`}
                >
                  {isGreen ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>ACTIVE GREEN</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>FORCE GREEN</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Master Safety Actuator Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono border-t border-slate-200 dark:border-[#1f1f23]">
          <div className="flex flex-wrap items-center gap-2">
            {/* All-Red Kill Switch */}
            <button
              onClick={handleAllRed}
              disabled={loading}
              className="px-3.5 py-2 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-600/50 font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>ALL-RED SAFETY FREEZE</span>
            </button>

            {/* Buzzer Siren Trigger */}
            <button
              onClick={handlePulseBuzzer}
              disabled={buzzerPulsing}
              className={`px-3.5 py-2 rounded-lg border font-bold transition cursor-pointer flex items-center gap-1.5 ${
                buzzerPulsing
                  ? 'bg-amber-500 text-black border-amber-300 animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-800'
              }`}
            >
              <Volume2 className="w-4 h-4 text-amber-500" />
              <span>{buzzerPulsing ? 'PULSING SIREN...' : 'TEST SIREN BUZZER (GPIO 15)'}</span>
            </button>
          </div>

          {/* Resume Auto Cycle */}
          <button
            onClick={handleResumeAuto}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>RESUME AUTOMATIC BCNF CYCLE</span>
          </button>
        </div>
      </div>

      {/* 3. Interactive Virtual PCB Board Graphic & Live Serial Monitor Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Columns: Virtual ESP32 Matrix & Pin States */}
        <div className="lg:col-span-7 bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-[#1f1f23]">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-500" />
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                ESP32 DevKit-V1 Hardware Pin Matrix
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
              240 MHz Xtensa LX6 • 3.3V Logic • 115200 Baud
            </span>
          </div>

          {/* Virtual PCB Board Graphic */}
          <div className="p-4 rounded-2xl bg-slate-950 border-2 border-cyan-600/40 shadow-xl relative overflow-hidden font-mono text-white">
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Board Header */}
            <div className="flex items-center justify-between text-xs pb-3 border-b border-cyan-500/30 relative z-10">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isSerialConnected ? 'bg-emerald-400 animate-pulse shadow-md shadow-emerald-400/50' : 'bg-rose-500'}`} />
                <span className="font-bold text-cyan-200 tracking-wider">TRAFIX ESP32-WROOM-32 NODE #01</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-bold truncate max-w-[200px]">
                {portName}
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
                <span>{isSerialConnected ? 'ESP32 HARDWARE LINKED' : 'READY TO CONNECT'}</span>
              </div>
            </div>

            {/* Live Illuminated GPIO Pinouts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 relative z-10">
              {[
                { dir: 'NORTH' as Direction, red: 'D2', yel: 'D4', grn: 'D5', irPin: 'GPIO 32' },
                { dir: 'EAST' as Direction,  red: 'D18', yel: 'D19', grn: 'D21', irPin: 'GPIO 33' },
                { dir: 'SOUTH' as Direction, red: 'D22', yel: 'D23', grn: 'D13', irPin: 'GPIO 34' },
                { dir: 'WEST' as Direction,  red: 'D12', yel: 'D14', grn: 'D27', irPin: 'GPIO 35' },
              ].map(({ dir, red, yel, grn, irPin }) => {
                const currentSig = getSignalFor(dir);
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
                  hardwareState?.buzzerActive || buzzerPulsing
                    ? 'bg-amber-400 text-black animate-ping'
                    : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {hardwareState?.buzzerActive || buzzerPulsing ? '🔊 SIREN ACTIVE' : 'SILENT'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Live Real-Time WebSerial Terminal Stream */}
        <div className="lg:col-span-5 bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-200 dark:border-[#1f1f23]">
              <div className="flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                  Live WebSerial Terminal (115200 Baud)
                </h3>
              </div>
              <button
                onClick={() => webSerialService.clearLogs()}
                className="flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>

            {/* Real Serial Stream */}
            <div className="p-3 rounded-lg bg-black text-cyan-300 font-mono text-[11px] overflow-y-auto max-h-72 border border-zinc-800 space-y-1">
              {serialLogs.length === 0 ? (
                <div className="text-zinc-500 py-8 text-center text-xs">
                  {isSerialConnected ? 'Waiting for incoming telemetry packets...' : 'Plug in ESP32 via USB and click "CONNECT USB"'}
                </div>
              ) : (
                serialLogs.map((log) => (
                  <div key={log.id} className="leading-tight">
                    <span className="text-zinc-500">[{log.timestamp}] </span>
                    <span
                      className={`font-bold ${
                        log.direction === 'TX'
                          ? 'text-emerald-400'
                          : log.direction === 'RX'
                          ? 'text-cyan-300'
                          : 'text-amber-400'
                      }`}
                    >
                      {log.direction}:{' '}
                    </span>
                    <span className="text-zinc-200 break-all">{log.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Diagnostics / Chaos Controls */}
          <div className="pt-2 border-t border-slate-200 dark:border-[#1f1f23] space-y-2 font-mono text-xs">
            <div className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold flex items-center justify-between">
              <span>Sensor Ingestion Diagnostics</span>
              <span className="text-emerald-400">STATUS: {isSerialConnected ? 'ONLINE' : 'STANDBY'}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleTriggerSpike}
                disabled={loading}
                className="flex-1 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-[10px] font-semibold transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Flame className="w-3 h-3 text-amber-500" />
                <span>INJECT WEST SPIKE (38)</span>
              </button>
              <button
                onClick={handleTriggerEmergency}
                disabled={loading}
                className="flex-1 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-[10px] font-semibold transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Siren className="w-3 h-3 text-rose-500" />
                <span>INJECT AMBULANCE</span>
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
