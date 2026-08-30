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
import {
  JunctionLiveTelemetry,
  HardwareState,
  DatabaseStatus,
  SimulationConfig,
  HistoricalSnapshot,
  ReplayState,
} from '../types';
import { api } from '../services/api';
import { Camera, Layers, Box, ArrowUpRight } from 'lucide-react';
import { WeatherAqiWidget } from '../components/weather/WeatherAqiWidget';
import { ThreeIntersection3D } from '../components/junction/ThreeIntersection3D';
import { soundEffects } from '../utils/soundEffects';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();
  const userName = user?.name || user?.email?.split('@')[0] || 'Admin';

  const [snapshots, setSnapshots] = useState<HistoricalSnapshot[]>([]);
  const [replayState, setReplayState] = useState<ReplayState>({
    isReplaying: false,
    isPlaying: false,
    playbackSpeed: 1,
    currentIndex: 0,
    snapshots: [],
  });

  const [viewMode3D, setViewMode3D] = useState<boolean>(false);

  useEffect(() => {
    if (telemetry?.currentPhase) {
      soundEffects.playPhaseChange(telemetry.currentPhase);
    }
  }, [telemetry?.currentPhase]);

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
        <div className="bg-white dark:bg-[#0a0a0a] p-8 rounded-lg border border-slate-200 dark:border-[#1f1f23] text-center space-y-3 text-slate-900 dark:text-white shadow-xs">
          <div className="w-6 h-6 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-500 dark:text-zinc-400">Connecting to telemetry stream...</p>
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
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* 1. Top Section: Simplistic yet Bold Vercel-Style Usage & Projects Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (4 cols): Telemetry Usage & System Status */}
        <div className="lg:col-span-4 bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] rounded-lg p-4 flex flex-col justify-between transition text-slate-900 dark:text-white shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">System Telemetry</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-zinc-900 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800">
                Live
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Metric 1: Signal Cycles */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-zinc-400">Signal Cycles Executed</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">1,248 cycles</span>
                </div>
                <div className="w-full h-1 bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-900 dark:bg-white rounded-full" style={{ width: '42%' }} />
                </div>
              </div>

              {/* Metric 2: Vehicle Throughput */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-zinc-400">Vehicle Throughput Rate</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">950 veh/hr</span>
                </div>
                <div className="w-full h-1 bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-900 dark:bg-white rounded-full" style={{ width: '68%' }} />
                </div>
              </div>

              {/* Metric 3: Active Queue Density */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-zinc-400">Active Queue</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">{telemetry.totalVehicleCount} vehicles</span>
                </div>
                <div className="w-full h-1 bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-900 dark:bg-white rounded-full transition-all"
                    style={{ width: `${Math.min(100, (telemetry.totalVehicleCount / 120) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1f1f23] flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-500 font-mono">
            <span>Engine: <strong>BCNF Normalized</strong></span>
            <span>Avg Wait: <strong className="text-slate-900 dark:text-white">{telemetry.averageWaitTimeSec}s</strong></span>
          </div>
        </div>

        {/* Right Column (8 cols): Intersections List Cards */}
        <div className="lg:col-span-8 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Card 1: Connaught Place Central */}
            <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] rounded-lg p-4 flex flex-col justify-between transition group text-slate-900 dark:text-white shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900 group-hover:text-slate-700 dark:text-white dark:group-hover:text-zinc-300 transition">
                    connaught-place-central
                  </h4>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>

                <p className="text-xs text-slate-500 dark:text-zinc-500 font-mono mt-1">
                  cp-01.traffic.delhi.gov.in
                </p>

                <div className="mt-3.5 text-xs text-slate-700 dark:text-zinc-300">
                  <p className="font-medium">{displayActiveDirection} Road Green Phase</p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono mt-0.5">
                    {telemetry.totalVehicleCount} veh in queue · {displayCountdown}s remaining
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1f1f23] flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-500 font-mono">
                <span>{userName} / Trafix</span>
                <span>Active</span>
              </div>
            </div>

            {/* Card 2: Ring Road Arterial */}
            <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] rounded-lg p-4 flex flex-col justify-between transition group text-slate-900 dark:text-white shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900 group-hover:text-slate-700 dark:text-white dark:group-hover:text-zinc-300 transition">
                    ring-road-arterial
                  </h4>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>

                <p className="text-xs text-slate-500 dark:text-zinc-500 font-mono mt-1">
                  rr-04.traffic.delhi.gov.in
                </p>

                <div className="mt-3.5 text-xs text-slate-700 dark:text-zinc-300">
                  <p className="font-medium">Green Wave Corridor Wave-1</p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono mt-0.5">
                    Wave speed: 54 km/h · 4 Intersections Synchronized
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1f1f23] flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-500 font-mono">
                <span>{userName} / Trafix</span>
                <span>Corridor</span>
              </div>
            </div>
          </div>

          {/* Anomaly & Camera Feed Action Strip */}
          <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md border border-slate-200 dark:border-[#1f1f23]/80 rounded-lg p-3.5 flex items-center justify-between gap-3 text-slate-900 dark:text-white shadow-xs">
            <div>
              <h4 className="text-xs font-medium text-slate-900 dark:text-white">
                Optical ANPR Camera Stream
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Active vision monitoring on 4 approaches for red-light infractions and speed detection.
              </p>
            </div>

            <button
              onClick={onOpenVision}
              className="px-3 py-1.5 rounded bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition cursor-pointer shrink-0 flex items-center gap-1 shadow-xs"
            >
              <span>View Cameras</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Active Alert Banner */}
      {telemetry.activeEmergency && (
        <EmergencyAlertBanner
          emergency={telemetry.activeEmergency}
          onClear={onRefresh}
        />
      )}

      {/* 2. Bold KPI Metrics Row */}
      <KpiMetricsRow
        telemetry={{
          ...telemetry,
          totalVehicleCount: activeSnapshot ? activeSnapshot.vehicleCount : telemetry.totalVehicleCount,
          congestionIndex: activeSnapshot ? activeSnapshot.congestionIndex : telemetry.congestionIndex,
          averageWaitTimeSec: activeSnapshot ? activeSnapshot.averageWaitTimeSec : telemetry.averageWaitTimeSec,
        }}
        hardwareState={hardwareState}
      />

      {/* 3. Replay Timeline Scrubber */}
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

      {/* 4. Live Meteorological & AQI Sensor Widget */}
      <WeatherAqiWidget />

      {/* 5. Eco & Carbon Footprint Analysis Card */}
      <EcoFootprintCard ecoMetrics={ecoMetrics} />

      {/* 6. Visualizer Header Controls: 2D Blueprint vs 3D WebGL Studio */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
          {viewMode3D ? '3D WebGL Studio' : '2D Real-Time Blueprint'}
        </h3>

        <div className="flex items-center p-0.5 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono">
          <button
            onClick={() => {
              soundEffects.playClick();
              setViewMode3D(false);
            }}
            className={`px-3 py-1 rounded transition flex items-center gap-1.5 cursor-pointer ${
              !viewMode3D
                ? 'bg-slate-900 text-white font-semibold shadow-xs dark:bg-white dark:text-black'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
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
            className={`px-3 py-1 rounded transition flex items-center gap-1.5 cursor-pointer ${
              viewMode3D
                ? 'bg-slate-900 text-white font-semibold shadow-xs dark:bg-white dark:text-black'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Studio</span>
          </button>
        </div>
      </div>

      {/* 7. Main Grid: 4-Way Visualizer + Signal Control & Emergency Deck */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left 2 Cols: 4-Way Visualizer (2D or 3D) & Crosswalk */}
        <div className="xl:col-span-2 space-y-4">
          {viewMode3D ? (
            <ThreeIntersection3D
              activeDirection={displayActiveDirection}
              currentPhase={displayPhase}
              phaseTimeRemaining={displayCountdown}
              totalVehicles={telemetry.totalVehicleCount}
              hasEmergency={!!telemetry.activeEmergency}
              activeEmergency={telemetry.activeEmergency}
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
