import React, { useState, useEffect } from 'react';
import { JunctionVisualizer } from '../components/junction/JunctionVisualizer';
import { SignalControlCard } from '../components/junction/SignalControlCard';
import { EmergencyQuickPanel } from '../components/junction/EmergencyQuickPanel';
import { KpiMetricsRow } from '../components/junction/KpiMetricsRow';
import { EmergencyAlertBanner } from '../components/layout/EmergencyAlertBanner';
import { EcoFootprintCard } from '../components/eco/EcoFootprintCard';
import { TimelineReplayBar } from '../components/replay/TimelineReplayBar';
import { PedestrianCrosswalkCard } from '../components/pedestrian/PedestrianCrosswalkCard';
import { calculateEcoMetrics } from '../utils/ecoCalculator';
import { Button } from '@/components/ui/button';
import {
  JunctionLiveTelemetry,
  HardwareState,
  DatabaseStatus,
  SimulationConfig,
  HistoricalSnapshot,
  ReplayState,
} from '../types';
import { api } from '../services/api';
import { Camera, Navigation, Activity, Cpu, ChevronRight, Box, Layers } from 'lucide-react';
import { WeatherAqiWidget } from '../components/weather/WeatherAqiWidget';
import { ThreeIntersection3D } from '../components/junction/ThreeIntersection3D';
import { soundEffects } from '../utils/soundEffects';

interface DashboardPageProps {
  telemetry: JunctionLiveTelemetry | null;
  hardwareState: HardwareState | null;
  dbStatus: DatabaseStatus | null;
  simConfig: SimulationConfig | null;
  onRefresh: () => void;
  onOpenVision: () => void;
  onNavigateCorridor: () => void;
  onOpenAuditReport?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  telemetry,
  hardwareState,
  dbStatus,
  simConfig,
  onRefresh,
  onOpenVision,
  onNavigateCorridor,
  onOpenAuditReport,
}) => {
  // Replay State & Historical Snapshot Buffer
  const [snapshots, setSnapshots] = useState<HistoricalSnapshot[]>([]);
  const [replayState, setReplayState] = useState<ReplayState>({
    isReplaying: false,
    isPlaying: false,
    playbackSpeed: 1,
    currentIndex: 0,
    snapshots: [],
  });

  const [viewMode3D, setViewMode3D] = useState<boolean>(false);

  // Play phase change sound effect when phase changes
  useEffect(() => {
    if (telemetry?.currentPhase) {
      soundEffects.playPhaseChange(telemetry.currentPhase);
    }
  }, [telemetry?.currentPhase]);

  // Record live telemetry into historical buffer
  useEffect(() => {
    if (!telemetry || replayState.isReplaying) return;

    const now = new Date();
    const timeFormatted = now.toTimeString().split(' ')[0];

    const newSnapshot: HistoricalSnapshot = {
      id: `snap_${Date.now()}`,
      timestamp: now.toISOString(),
      timeFormatted,
      activeDirection: telemetry.activeDirection,
      currentPhase: telemetry.currentPhase,
      phaseCountdown: telemetry.phaseTimeRemaining,
      vehicleCount: telemetry.totalVehicleCount,
      congestionIndex: telemetry.congestionIndex,
      averageWaitTimeSec: telemetry.averageWaitTimeSec,
      co2RateKgPerHour: parseFloat(((telemetry.totalVehicleCount * 2.28 * 60) / 1000).toFixed(2)),
      isEmergency: Boolean(telemetry.activeEmergency),
      emergencyVehicle: telemetry.activeEmergency?.vehicleType,
      eventDescription: telemetry.activeEmergency
        ? `Emergency Pre-emption: ${telemetry.activeEmergency.vehicleType} on ${telemetry.activeEmergency.direction}`
        : `${telemetry.activeDirection} Green Phase (${telemetry.currentPhaseDuration}s)`,
      roads: {
        NORTH: { count: telemetry.roads.NORTH.vehicleCount, signal: telemetry.roads.NORTH.currentSignal, density: telemetry.roads.NORTH.density },
        SOUTH: { count: telemetry.roads.SOUTH.vehicleCount, signal: telemetry.roads.SOUTH.currentSignal, density: telemetry.roads.SOUTH.density },
        EAST: { count: telemetry.roads.EAST.vehicleCount, signal: telemetry.roads.EAST.currentSignal, density: telemetry.roads.EAST.density },
        WEST: { count: telemetry.roads.WEST.vehicleCount, signal: telemetry.roads.WEST.currentSignal, density: telemetry.roads.WEST.density },
      },
    };

    setSnapshots((prev) => {
      const updated = [...prev, newSnapshot];
      if (updated.length > 40) updated.shift();
      return updated;
    });
  }, [telemetry, replayState.isReplaying]);

  useEffect(() => {
    setReplayState((prev) => ({
      ...prev,
      snapshots,
      currentIndex: prev.isReplaying ? prev.currentIndex : Math.max(0, snapshots.length - 1),
    }));
  }, [snapshots]);

  if (!telemetry) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700">Connecting to Trafix telemetry server...</p>
        </div>
      </div>
    );
  }

  const activeSnapshot = replayState.isReplaying
    ? snapshots[replayState.currentIndex] || snapshots[snapshots.length - 1]
    : null;

  const displayRoads = activeSnapshot
    ? {
      NORTH: { ...telemetry.roads.NORTH, vehicleCount: activeSnapshot.roads.NORTH.count, currentSignal: activeSnapshot.roads.NORTH.signal, density: activeSnapshot.roads.NORTH.density },
      SOUTH: { ...telemetry.roads.SOUTH, vehicleCount: activeSnapshot.roads.SOUTH.count, currentSignal: activeSnapshot.roads.SOUTH.signal, density: activeSnapshot.roads.SOUTH.density },
      EAST: { ...telemetry.roads.EAST, vehicleCount: activeSnapshot.roads.EAST.count, currentSignal: activeSnapshot.roads.EAST.signal, density: activeSnapshot.roads.EAST.density },
      WEST: { ...telemetry.roads.WEST, vehicleCount: activeSnapshot.roads.WEST.count, currentSignal: activeSnapshot.roads.WEST.signal, density: activeSnapshot.roads.WEST.density },
    }
    : telemetry.roads;

  const displayActiveDirection = activeSnapshot ? activeSnapshot.activeDirection : telemetry.activeDirection;
  const displayPhase = activeSnapshot ? activeSnapshot.currentPhase : telemetry.currentPhase;
  const displayCountdown = activeSnapshot ? activeSnapshot.phaseCountdown : telemetry.phaseTimeRemaining;
  const displayActiveRoad = displayRoads[displayActiveDirection];

  const ecoMetrics = calculateEcoMetrics(
    telemetry.totalVehicleCount,
    telemetry.averageWaitTimeSec
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* 1. Top Eyebrow Status Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="eyebrow-pill flex items-center gap-1.5 text-slate-700">
            <span>LIVE TELEMETRY FEED</span>
            <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/90 shadow-2xs">
            <span className="text-slate-400 font-sans font-bold text-[10px]">CONTROLLER:</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
              ONLINE
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/90 shadow-2xs">
            <span className="text-slate-400 font-sans font-bold text-[10px]">SENSORS:</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px]">
              ACTIVE (4 CAM + 4 IR)
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/90 shadow-2xs">
            <span className="text-slate-400 font-sans font-bold text-[10px]">ENGINE:</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px]">
              NEO4J DYNAMIC
            </span>
          </div>
        </div>
      </div>

      {/* 2. Intersections Overview Deck */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-600">
            <Activity className="w-4 h-4" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Metropolitan Junctions Overview
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenVision}
              className="rounded-2xl text-xs font-bold border-slate-200 dark:border-white/10 hover:border-red-300 hover:bg-red-500/10 gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-red-500" />
              <span>Camera Vision</span>
            </Button>

            <Button
              size="sm"
              onClick={onNavigateCorridor}
              className="rounded-2xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md shadow-red-500/20 gap-1.5 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Green Wave Corridor</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Central Plaza J001 */}
          <div className="card-modern p-5 rounded-3xl border-l-4 border-l-emerald-500 flex items-center justify-between transition-all hover:shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Central Plaza (J001)</h4>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  ACTIVE
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Queue Density: <strong className="text-slate-800 dark:text-white font-bold">{telemetry.totalVehicleCount} vehicles</strong>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-400">CURRENT GREEN</div>
              <div className="text-sm font-black text-red-500 dark:text-red-400 mt-0.5 font-mono">
                {displayActiveDirection} ({displayCountdown}s)
              </div>
            </div>
          </div>

          {/* Card 2: AIIMS Flyover */}
          <div className="card-modern p-5 rounded-3xl border-l-4 border-l-red-500 flex items-center justify-between transition-all hover:shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">AIIMS Flyover (AIIMS-02)</h4>
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30 text-[10px] font-bold">
                  ONLINE
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Queue Density: <strong className="text-slate-800 dark:text-white font-bold">36 vehicles</strong>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-400">CORRIDOR SYNC</div>
              <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                54 km/h Wave
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Real-Time Traffic Network Telemetry Banner (Black & Red Cyber Matrix Theme) */}
      <div className="rounded-3xl bg-gradient-to-r from-red-950 via-[#7f1d1d] to-[#0a0a0f] text-white p-6 shadow-2xl border-2 border-red-500/40 relative overflow-hidden space-y-4">
        {/* Animated Background Shimmer Beam */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-r from-transparent via-white to-transparent animate-beam-shimmer" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-red-400/30 shadow-inner relative">
              <Cpu className="w-7 h-7 text-white" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 animate-radar-pulse" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-extrabold tracking-tight">
                  {displayActiveDirection} GREEN
                </span>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-white/20 border border-white/30 text-emerald-300">
                  {displayCountdown}s left
                </span>
              </div>
              <div className="text-xs text-red-200 mt-1 flex flex-wrap items-center gap-2 font-medium">
                <span>Total Active Queue: <strong className="text-white">{telemetry.totalVehicleCount} veh</strong></span>
                <span>•</span>
                <span>Avg Wait: <strong className="text-white">{telemetry.averageWaitTimeSec}s</strong></span>
                <span>•</span>
                <span>Congestion: <strong className="text-white">{telemetry.congestionIndex}%</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-1.5 rounded-full bg-red-950/80 backdrop-blur-md text-white text-xs font-bold border border-red-400/40 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ADAPTIVE GRAPH CYCLE</span>
            </div>
          </div>
        </div>

        {/* Approach Traffic Breakdown with Active Pulse Highlight */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/20 text-center text-xs relative z-10">
          {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as const).map((dir) => {
            const road = telemetry.roads[dir];
            const isActive = displayActiveDirection === dir;
            const roadLabels: Record<string, string> = {
              NORTH: 'North Road (R001)',
              SOUTH: 'South Road (R002)',
              EAST: 'East Road (R003)',
              WEST: 'West Road (R004)',
            };

            return (
              <div
                key={dir}
                className={`p-2.5 rounded-xl transition-all duration-300 backdrop-blur-xs ${isActive
                    ? 'bg-white/20 border-2 border-emerald-400 shadow-md shadow-emerald-900/30 scale-[1.03]'
                    : 'bg-black/30 border border-white/10 hover:bg-black/40'
                  }`}
              >
                <div className="flex items-center justify-center gap-1 text-red-200 text-[10px] font-bold">
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  <span>{roadLabels[dir]}</span>
                </div>
                <div className="font-extrabold text-white mt-0.5 font-mono">
                  {road.vehicleCount} veh • <span className={isActive ? 'text-emerald-300 font-bold' : ''}>{road.density}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Emergency Active Alert Banner */}
      {telemetry.activeEmergency && (
        <EmergencyAlertBanner
          emergency={telemetry.activeEmergency}
          onClear={onRefresh}
        />
      )}

      {/* Replay Timeline Scrubber */}
      <TimelineReplayBar
        replayState={replayState}
        onToggleReplayMode={(active) =>
          setReplayState((prev) => ({
            ...prev,
            isReplaying: active,
            isPlaying: false,
            currentIndex: Math.max(0, snapshots.length - 1),
          }))
        }
        onTogglePlay={() =>
          setReplayState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))
        }
        onSeek={(index) =>
          setReplayState((prev) => ({ ...prev, currentIndex: index, isPlaying: false }))
        }
        onChangeSpeed={(speed) =>
          setReplayState((prev) => ({ ...prev, playbackSpeed: speed }))
        }
        onStep={(direction) =>
          setReplayState((prev) => {
            const nextIdx =
              direction === 'prev'
                ? Math.max(0, prev.currentIndex - 1)
                : Math.min(prev.snapshots.length - 1, prev.currentIndex + 1);
            return { ...prev, currentIndex: nextIdx, isPlaying: false };
          })
        }
      />

      {/* 4 KPI Metrics Row */}
      <KpiMetricsRow
        telemetry={{
          ...telemetry,
          totalVehicleCount: activeSnapshot ? activeSnapshot.vehicleCount : telemetry.totalVehicleCount,
          congestionIndex: activeSnapshot ? activeSnapshot.congestionIndex : telemetry.congestionIndex,
          averageWaitTimeSec: activeSnapshot ? activeSnapshot.averageWaitTimeSec : telemetry.averageWaitTimeSec,
        }}
        hardwareState={hardwareState}
      />

      {/* Live Meteorological & AQI Sensor Widget */}
      <WeatherAqiWidget />

      {/* Eco & Carbon Footprint Card */}
      <EcoFootprintCard ecoMetrics={ecoMetrics} />

      {/* Visualizer Header Controls: 2D Blueprint vs 3D WebGL Studio */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
            {viewMode3D ? '3D WebGL Studio View' : '2D Real-Time Blueprint Visualizer'}
          </h3>
        </div>

        <div className="flex items-center p-1 rounded-2xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/15 text-xs font-bold shadow-xs">
          <button
            onClick={() => {
              soundEffects.playClick();
              setViewMode3D(false);
            }}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              !viewMode3D
                ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2D Blueprint</span>
          </button>
          <button
            onClick={() => {
              soundEffects.playClick();
              setViewMode3D(true);
            }}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              viewMode3D
                ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D WebGL Studio</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 4-Way Visualizer + Signal Control & Emergency Deck */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left 2 Cols: 4-Way Visualizer (2D or 3D) & Crosswalk */}
        <div className="xl:col-span-2 space-y-4">
          {viewMode3D ? (
            <ThreeIntersection3D
              activeDirection={displayActiveDirection}
              currentPhase={displayPhase}
              phaseTimeRemaining={displayCountdown}
              totalVehicles={telemetry.totalVehicleCount}
              hasEmergency={!!telemetry.activeEmergency}
            />
          ) : (
            <JunctionVisualizer
              roads={displayRoads}
              activeDirection={displayActiveDirection}
              currentPhase={displayPhase}
              phaseCountdown={displayCountdown}
              activeEmergency={telemetry.activeEmergency}
              pedestrianState={telemetry.pedestrianState}
              onRequestPedestrianCrossing={async () => {
                await api.requestPedestrianCrossing();
                onRefresh();
              }}
            />
          )}

          <PedestrianCrosswalkCard
            pedestrianState={telemetry.pedestrianState}
            onRequestCrossing={async (dir, accessible) => {
              await api.requestPedestrianCrossing(dir, accessible);
              onRefresh();
            }}
          />
        </div>

        {/* Right 1 Col: Control Cards Stack */}
        <div className="flex flex-col gap-4">
          <div className="flex-1">
            <SignalControlCard
              mode={telemetry.mode}
              activeDirection={displayActiveDirection}
              currentPhase={displayPhase}
              phaseTimeRemaining={displayCountdown}
              currentPhaseDuration={telemetry.currentPhaseDuration}
              lastDecision={telemetry.lastDecision}
              activeRoad={displayActiveRoad}
              isCycleRunning={true}
              onRefresh={onRefresh}
            />
          </div>

          <div className="flex-1">
            <EmergencyQuickPanel
              activeEmergency={telemetry.activeEmergency}
              onRefresh={onRefresh}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
