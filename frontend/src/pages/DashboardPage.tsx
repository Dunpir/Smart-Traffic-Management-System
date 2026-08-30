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
import { Camera, Navigation, Activity, Cpu, ChevronRight, Box, Layers, ShieldAlert, AlertTriangle, ExternalLink } from 'lucide-react';
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
        <div className="bg-[#0a0a0a] p-8 rounded-xl border border-[#27272a] text-center space-y-3 text-white">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-zinc-400">Connecting to Trafix telemetry stream...</p>
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
      {/* 1. Top Section: Vercel-Inspired Telemetry Usage & Active Intersections Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (4 cols): Telemetry Usage & Capacity */}
        <div className="lg:col-span-4 bg-[#0a0a0a] border border-[#222226] hover:border-zinc-700 rounded-xl p-4 flex flex-col justify-between transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400">Usage</span>
              <span className="text-[11px] font-mono text-zinc-500">Last 30 days</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-black font-mono">
                BCNF Pro
              </span>
            </div>

            <div className="space-y-3">
              {/* Edge Requests */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>Edge Requests (Cycles)</span>
                  </span>
                  <span className="text-white font-mono font-medium">65 / 1M</span>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: '4%' }} />
                </div>
              </div>

              {/* Fast Vehicle Throughput */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Vehicle Throughput</span>
                  </span>
                  <span className="text-white font-mono font-medium">
                    {(telemetry.totalVehicleCount * 7.8).toFixed(1)} veh / 10k
                  </span>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '22%' }} />
                </div>
              </div>

              {/* Active Queue Density */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Active Queue Density</span>
                  </span>
                  <span className="text-white font-mono font-medium">
                    {telemetry.totalVehicleCount} / 200 veh
                  </span>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (telemetry.totalVehicleCount / 200) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Private Graph Relational Cache */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>Neo4j Graph Rel Cache</span>
                  </span>
                  <span className="text-white font-mono font-medium">1.2 MB / 100 MB</span>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400 rounded-full" style={{ width: '3%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1f1f23] flex items-center justify-between text-[11px] text-zinc-500">
            <span>Adaptive Engine: <strong className="text-emerald-400 font-mono">BCNF Live</strong></span>
            <span>Avg Wait: <strong className="text-white font-mono">{telemetry.averageWaitTimeSec}s</strong></span>
          </div>
        </div>

        {/* Right Column (8 cols): Active Intersection Cards & Alerts */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Intersection 1: Connaught Place Central */}
            <div className="bg-[#0a0a0a] border border-[#222226] hover:border-zinc-600 rounded-xl p-4 flex flex-col justify-between transition group">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white group-hover:text-cyan-400 transition">
                    connaught-place-central
                  </h4>
                  <div className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                </div>

                <p className="text-xs text-zinc-500 font-mono mt-1 truncate">
                  connaught-place.traffic.gov.in
                </p>

                <div className="mt-4 space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-semibold">{displayActiveDirection} Green Phase</span>
                    <span className="font-mono text-zinc-500">({displayCountdown}s left)</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    Queue: <strong className="text-white">{telemetry.totalVehicleCount} veh</strong> · Congestion {telemetry.congestionIndex}%
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1f1f23] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span className="flex items-center gap-1 text-zinc-400">
                  <span>Dunpir/Smart-Traffic-Management-System</span>
                </span>
                <span>Live</span>
              </div>
            </div>

            {/* Intersection 2: Ring Road Arterial */}
            <div className="bg-[#0a0a0a] border border-[#222226] hover:border-zinc-600 rounded-xl p-4 flex flex-col justify-between transition group">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition">
                    ring-road-arterial
                  </h4>
                  <div className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                </div>

                <p className="text-xs text-zinc-500 font-mono mt-1 truncate">
                  ring-road.traffic.gov.in
                </p>

                <div className="mt-4 space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-semibold">Green Wave Corridor Wave-1</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    Wave speed: <strong className="text-emerald-400">54 km/h</strong> · AI Sync Active
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1f1f23] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span className="flex items-center gap-1 text-zinc-400">
                  <span>Dunpir/Smart-Traffic-Management-System</span>
                </span>
                <span>Corridor</span>
              </div>
            </div>
          </div>

          {/* Vercel Style Alerts / Anomaly Scanner Card */}
          <div className="bg-[#0a0a0a] border border-[#222226] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
                  Real-Time AI Anomaly &amp; Infraction Scanner
                </h4>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Active Optical Camera detection monitors all 4 approaches for red-light runners, speeding, and lane obstruction.
              </p>
            </div>

            <button
              onClick={onOpenVision}
              className="px-3.5 py-1.5 rounded-md bg-[#18181b] hover:bg-[#222226] text-zinc-200 hover:text-white border border-[#27272a] text-xs font-medium transition cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Camera Vision</span>
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

      {/* 2. KPI Metrics Row */}
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
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
            {viewMode3D ? '3D WebGL Studio View' : '2D Real-Time Blueprint Visualizer'}
          </h3>
        </div>

        <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono">
          <button
            onClick={() => {
              soundEffects.playClick();
              setViewMode3D(false);
            }}
            className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
              !viewMode3D
                ? 'bg-white text-black font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-white'
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
            className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
              viewMode3D
                ? 'bg-white text-black font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-white'
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
