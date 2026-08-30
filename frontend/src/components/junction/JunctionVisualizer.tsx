import React, { useState } from 'react';
import {
  Car,
  Flame,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Zap,
  Footprints,
  Radio,
  Siren,
  Sparkles,
} from 'lucide-react';
import {
  Direction,
  LightState,
  DensityLevel,
  RoadLiveStatus,
  EmergencyEvent,
  PedestrianCrosswalkState,
} from '../../types';
import { soundEffects } from '../../utils/soundEffects';

interface JunctionVisualizerProps {
  roads: Record<Direction, RoadLiveStatus>;
  activeDirection: Direction;
  currentPhase: 'GREEN' | 'YELLOW' | 'ALL_RED';
  phaseCountdown: number;
  activeEmergency: EmergencyEvent | null;
  pedestrianState?: PedestrianCrosswalkState | null;
  onSelectRoad?: (direction: Direction) => void;
  onRequestPedestrianCrossing?: () => void;
}

export const JunctionVisualizer: React.FC<JunctionVisualizerProps> = ({
  roads,
  activeDirection,
  currentPhase,
  phaseCountdown,
  activeEmergency,
  pedestrianState,
  onSelectRoad,
  onRequestPedestrianCrossing,
}) => {
  const [hoveredRoad, setHoveredRoad] = useState<Direction | null>(null);
  const isPedestrianWalk = pedestrianState?.phase === 'WALK';

  const getDensityBadge = (density: DensityLevel) => {
    switch (density) {
      case 'LOW':
        return 'text-slate-700 bg-slate-100 border-slate-200 dark:text-zinc-300 dark:bg-zinc-900 dark:border-zinc-800';
      case 'MEDIUM':
        return 'text-slate-800 bg-slate-100 border-slate-300 dark:text-zinc-200 dark:bg-zinc-900 dark:border-zinc-700';
      case 'HIGH':
        return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-zinc-900 dark:border-amber-900/50';
      case 'VERY HIGH':
        return 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-zinc-900 dark:border-rose-900/50';
    }
  };

  const renderSignalHead = (direction: Direction, currentSignal: LightState) => {
    const isThisActive = activeDirection === direction;
    const isEmergencyApproach = activeEmergency?.direction === direction;

    return (
      <div
        className={`flex items-center gap-1.5 p-1.5 rounded bg-slate-900 dark:bg-black border transition ${
          isEmergencyApproach
            ? 'border-red-500 shadow-xs ring-1 ring-red-500/50'
            : isThisActive
            ? 'border-slate-500 dark:border-zinc-500'
            : 'border-slate-700 dark:border-[#27272a]'
        }`}
      >
        {/* Red Light */}
        <div
          className={`w-3 h-3 rounded-full transition-all ${
            currentSignal === 'RED'
              ? 'bg-red-500 shadow-xs ring-2 ring-red-500/30'
              : 'bg-red-950/40 opacity-20'
          }`}
          title="RED Signal"
        />

        {/* Yellow Light */}
        <div
          className={`w-3 h-3 rounded-full transition-all ${
            currentSignal === 'YELLOW'
              ? 'bg-amber-400 shadow-xs animate-pulse ring-2 ring-amber-400/30'
              : 'bg-amber-950/40 opacity-20'
          }`}
          title="YELLOW Signal"
        />

        {/* Green Light */}
        <div
          className={`w-3 h-3 rounded-full transition-all ${
            currentSignal === 'GREEN'
              ? 'bg-emerald-400 shadow-xs ring-2 ring-emerald-400/30'
              : 'bg-emerald-950/40 opacity-20'
          }`}
          title="GREEN Signal"
        />
      </div>
    );
  };

  const renderRoadCard = (direction: Direction, icon: React.ReactNode) => {
    const road = roads[direction];
    if (!road) return null;

    const isActive = activeDirection === direction;
    const isEmergency = activeEmergency?.direction === direction;
    const isHovered = hoveredRoad === direction;
    const vType = activeEmergency?.vehicleType || 'AMBULANCE';

    return (
      <div
        onClick={() => {
          soundEffects.playClick();
          onSelectRoad && onSelectRoad(direction);
        }}
        onMouseEnter={() => setHoveredRoad(direction)}
        onMouseLeave={() => setHoveredRoad(null)}
        className={`relative p-3 rounded-lg transition cursor-pointer border ${
          isEmergency
            ? 'bg-red-50/90 border-red-500 dark:bg-red-950/40 dark:border-red-500 ring-2 ring-red-500/30'
            : isActive
            ? 'bg-slate-50 border-slate-400 dark:bg-[#141418] dark:border-zinc-500'
            : 'bg-white hover:bg-slate-50 border-slate-200 dark:bg-[#0a0a0a] dark:hover:bg-[#101014] dark:border-[#1f1f23]'
        } ${isHovered ? 'border-slate-400 dark:border-[#333338]' : ''} shadow-xs`}
      >
        {/* Road Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300">
              {icon}
            </span>
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-tight block">
                {direction} ROAD
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono">
                {road.roadId} · {road.speedLimit} km/h
              </span>
            </div>
          </div>

          {/* Real-Time Signal Head */}
          {renderSignalHead(direction, road.currentSignal)}
        </div>

        {/* Metric Row */}
        <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-xs">
          <div className="p-1.5 rounded bg-slate-50 border border-slate-200 dark:bg-black dark:border-[#1f1f23] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-500 block font-sans">Queue</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{road.vehicleCount} veh</span>
            </div>
            <Car className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
          </div>

          <div className="p-1.5 rounded bg-slate-50 border border-slate-200 dark:bg-black dark:border-[#1f1f23] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-500 block font-sans">Flow</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-300">{road.flowRate}</span>
            </div>
            <Flame className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
          </div>
        </div>

        {/* Density Badge */}
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-zinc-900 text-[10px] font-mono">
          <span className={`px-1.5 py-0.2 rounded border font-medium ${getDensityBadge(road.density)}`}>
            {road.density}
          </span>
          <span className="text-slate-500 dark:text-zinc-500">
            {road.congestion}
          </span>
        </div>

        {/* Dynamic Approaching Emergency / VIP Vehicle Live HUD */}
        {isEmergency && (
          <div className="mt-2.5 p-2 rounded-lg bg-red-950/90 dark:bg-red-950/70 border border-red-500 text-white space-y-1.5 shadow-md">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold">
              <div className="flex items-center gap-1.5">
                <Siren className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span className="text-amber-300 tracking-tight">
                  {vType === 'VIP'
                    ? '👑 VIP MOTORCADE'
                    : vType === 'AMBULANCE'
                    ? '🚑 AMBULANCE PRIORITY'
                    : vType === 'POLICE'
                    ? '🚔 POLICE ESCORT'
                    : '🚒 FIRE TENDER RESCUE'}
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-mono animate-pulse">
                APPROACHING
              </span>
            </div>

            {/* Simulated Live Vehicle Track Motion */}
            <div className="w-full h-2.5 bg-black/70 rounded-full overflow-hidden relative border border-white/20">
              <div className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-emerald-400 w-1/3 rounded-full animate-pulse transition-all duration-700" style={{ width: '75%' }} />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-300 pt-0.5">
              <span>Speed: <strong>68 km/h</strong></span>
              <span className="text-emerald-400 font-bold">GREEN CLEARANCE HELD</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] text-slate-900 dark:text-white transition shadow-xs">
      {/* Title Bar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-[#1f1f23] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white" />
          <h2 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
            4-Way Junction Blueprint View
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          {onRequestPedestrianCrossing && (
            <button
              onClick={() => {
                soundEffects.playClick();
                onRequestPedestrianCrossing();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                isPedestrianWalk
                  ? 'bg-slate-900 text-white font-semibold dark:bg-white dark:text-black'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-800'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>
                {isPedestrianWalk ? `WALK (${pedestrianState?.countdown}s)` : 'Pedestrian PAB'}
              </span>
            </button>
          )}

          <span className="text-slate-500 dark:text-zinc-500">Phase:</span>
          <span
            className={`font-semibold px-2 py-0.5 rounded text-[11px] font-mono border ${
              isPedestrianWalk
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-zinc-900 dark:text-emerald-400 dark:border-zinc-700'
                : currentPhase === 'GREEN'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-zinc-900 dark:text-emerald-400 dark:border-zinc-700'
                : currentPhase === 'YELLOW'
                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-zinc-900 dark:text-amber-400 dark:border-zinc-700'
                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-zinc-900 dark:text-rose-400 dark:border-zinc-700'
            }`}
          >
            {isPedestrianWalk ? 'PEDESTRIAN WALK' : `${currentPhase} (${activeDirection})`}
          </span>
        </div>
      </div>

      {/* 4-Way Crossroad Layout */}
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center">
        {/* NORTH ROAD */}
        <div className="w-full max-w-xs mb-2.5">
          {renderRoadCard('NORTH', <ArrowDown className="w-3.5 h-3.5" />)}
        </div>

        {/* MIDDLE ROW: WEST ROAD | CENTRAL JUNCTION CORE | EAST ROAD */}
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-2.5 my-1">
          {/* WEST ROAD */}
          <div className="w-full md:w-1/3 max-w-xs">
            {renderRoadCard('WEST', <ArrowRight className="w-3.5 h-3.5" />)}
          </div>

          {/* CENTRAL INTERSECTION CORE */}
          <div
            className={`relative w-44 h-44 rounded-lg bg-slate-900 dark:bg-black border flex flex-col items-center justify-center p-3 shrink-0 my-2 md:my-0 transition-all text-white ${
              isPedestrianWalk
                ? 'border-emerald-500'
                : activeEmergency
                ? 'border-red-500 shadow-lg ring-2 ring-red-500/50'
                : 'border-slate-800 dark:border-[#1f1f23]'
            } shadow-md`}
          >
            {/* Crosswalk Zebra Lines Top */}
            <div
              className={`absolute top-1.5 left-6 right-6 h-1 flex justify-between ${
                isPedestrianWalk ? 'opacity-100' : 'opacity-20'
              }`}
            >
              <span className="w-2 bg-white rounded-xs" />
              <span className="w-2 bg-white rounded-xs" />
              <span className="w-2 bg-white rounded-xs" />
              <span className="w-2 bg-white rounded-xs" />
            </div>

            {/* Crosswalk Zebra Lines Bottom */}
            <div
              className={`absolute bottom-1.5 left-6 right-6 h-1 flex justify-between ${
                isPedestrianWalk ? 'opacity-100' : 'opacity-20'
              }`}
            >
              <span className="w-2 bg-white rounded-xs" />
              <span className="w-2 bg-white rounded-xs" />
              <span className="w-2 bg-white rounded-xs" />
              <span className="w-2 bg-white rounded-xs" />
            </div>

            {/* Core Pulse */}
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border mb-1 transition ${
                  isPedestrianWalk
                    ? 'bg-zinc-900 border-emerald-500 text-emerald-400'
                    : activeEmergency
                    ? 'bg-red-950 border-red-500 text-red-400 animate-pulse'
                    : currentPhase === 'GREEN'
                    ? 'bg-zinc-900 border-zinc-700 text-emerald-400'
                    : currentPhase === 'YELLOW'
                    ? 'bg-zinc-900 border-zinc-700 text-amber-400'
                    : 'bg-zinc-900 border-zinc-700 text-rose-400'
                }`}
              >
                {isPedestrianWalk ? (
                  <Footprints className="w-4 h-4 text-emerald-400" />
                ) : activeEmergency ? (
                  <ShieldAlert className="w-5 h-5 text-red-400 animate-bounce" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
              </div>

              <div className="text-[10px] font-mono text-zinc-400 uppercase">
                {isPedestrianWalk ? 'PEDESTRIAN' : 'JUNCTION 01'}
              </div>
              <div className="text-xs font-mono font-bold text-white">
                {isPedestrianWalk ? 'ALL RED' : activeDirection}
              </div>
              <div className="text-[11px] font-mono text-zinc-300 mt-0.5">
                {isPedestrianWalk ? `${pedestrianState?.countdown}s WALK` : `${phaseCountdown}s REMAINING`}
              </div>

              {/* Active Vehicle Passing Indicator */}
              {activeEmergency && (
                <div className="mt-1 px-2 py-0.5 rounded bg-red-600 text-white text-[9px] font-mono font-bold animate-pulse">
                  {activeEmergency.vehicleType === 'VIP' ? '👑 VIP CONVOY' : `${activeEmergency.vehicleType}`} PASSING
                </div>
              )}
            </div>
          </div>

          {/* EAST ROAD */}
          <div className="w-full md:w-1/3 max-w-xs">
            {renderRoadCard('EAST', <ArrowLeft className="w-3.5 h-3.5" />)}
          </div>
        </div>

        {/* SOUTH ROAD */}
        <div className="w-full max-w-xs mt-2.5">
          {renderRoadCard('SOUTH', <ArrowUp className="w-3.5 h-3.5" />)}
        </div>
      </div>
    </div>
  );
};
