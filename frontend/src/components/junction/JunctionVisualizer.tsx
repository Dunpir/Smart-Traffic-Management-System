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
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80';
      case 'MEDIUM':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/80';
      case 'HIGH':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/80';
      case 'VERY HIGH':
        return 'text-rose-400 bg-rose-950/60 border-rose-800/80';
    }
  };

  const renderSignalHead = (direction: Direction, currentSignal: LightState) => {
    const isThisActive = activeDirection === direction;
    const isEmergencyApproach = activeEmergency?.direction === direction;

    return (
      <div
        className={`flex items-center gap-1.5 p-1.5 rounded-lg bg-black border transition ${
          isEmergencyApproach
            ? 'border-red-500 shadow-md shadow-red-500/20'
            : isThisActive
            ? 'border-zinc-500 shadow-sm'
            : 'border-[#27272a]'
        }`}
      >
        {/* Red Light */}
        <div
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            currentSignal === 'RED'
              ? 'bg-red-500 shadow-sm shadow-red-500 scale-110'
              : 'bg-red-950/40 opacity-20'
          }`}
          title="RED Signal"
        />

        {/* Yellow Light */}
        <div
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            currentSignal === 'YELLOW'
              ? 'bg-amber-400 shadow-sm shadow-amber-400 scale-110 animate-pulse'
              : 'bg-amber-950/40 opacity-20'
          }`}
          title="YELLOW Signal"
        />

        {/* Green Light */}
        <div
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            currentSignal === 'GREEN'
              ? 'bg-emerald-400 shadow-sm shadow-emerald-400 scale-110'
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

    return (
      <div
        onClick={() => {
          soundEffects.playClick();
          onSelectRoad && onSelectRoad(direction);
        }}
        onMouseEnter={() => setHoveredRoad(direction)}
        onMouseLeave={() => setHoveredRoad(null)}
        className={`relative p-3.5 rounded-xl transition cursor-pointer border ${
          isEmergency
            ? 'bg-red-950/40 border-red-500 shadow-md ring-1 ring-red-500/50'
            : isActive
            ? 'bg-zinc-900/90 border-zinc-500 shadow-sm'
            : 'bg-[#0a0a0a] hover:bg-[#111111] border-[#27272a]'
        } ${isHovered ? 'scale-[1.01]' : ''}`}
      >
        {/* Road Header Info */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
              {icon}
            </span>
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wide block">
                {direction} ROAD
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {road.roadId} · {road.speedLimit} km/h
              </span>
            </div>
          </div>

          {/* Real-Time Signal Head */}
          {renderSignalHead(direction, road.currentSignal)}
        </div>

        {/* Dynamic Metric Tiles */}
        <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-xs">
          <div className="p-2 rounded-lg bg-black border border-[#27272a] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 block font-sans">Queue</span>
              <span className="text-sm font-bold text-white">{road.vehicleCount} veh</span>
            </div>
            <Car className="w-3.5 h-3.5 text-zinc-500" />
          </div>

          <div className="p-2 rounded-lg bg-black border border-[#27272a] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 block font-sans">Flow</span>
              <span className="text-xs font-semibold text-zinc-300">{road.flowRate}</span>
            </div>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
        </div>

        {/* Density Badge */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-900 text-[10px] font-mono">
          <span className={`px-2 py-0.5 rounded border font-semibold ${getDensityBadge(road.density)}`}>
            {road.density}
          </span>
          <span className="text-zinc-400">
            {road.congestion}
          </span>
        </div>

        {/* Emergency Pre-emption Alert Tag */}
        {isEmergency && (
          <div className="mt-2 py-1 px-2 rounded-md bg-red-600 text-white font-semibold text-[10px] uppercase flex items-center justify-center gap-1.5 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>EMERGENCY CORRIDOR ENGAGED</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative bg-[#0a0a0a] p-5 rounded-xl border border-[#27272a] hover:border-zinc-700 shadow-sm overflow-hidden text-white transition">
      {/* Title Bar */}
      <div className="flex items-center justify-between mb-4 relative z-10 flex-wrap gap-2 pb-3 border-b border-[#1f1f23]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
            4-Way Junction Real-Time Visualization
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          {/* Quick PAB Request button */}
          {onRequestPedestrianCrossing && (
            <button
              onClick={() => {
                soundEffects.playClick();
                onRequestPedestrianCrossing();
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                isPedestrianWalk
                  ? 'bg-emerald-500 text-black font-semibold'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>
                {isPedestrianWalk ? `WALK (${pedestrianState?.countdown}s)` : 'Request Crosswalk (PAB)'}
              </span>
            </button>
          )}

          <span className="text-zinc-500 font-mono">Phase:</span>
          <span
            className={`font-semibold px-2 py-0.5 rounded text-[11px] font-mono border ${
              isPedestrianWalk
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : currentPhase === 'GREEN'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : currentPhase === 'YELLOW'
                ? 'bg-amber-950 text-amber-300 border-amber-800'
                : 'bg-rose-950 text-rose-300 border-rose-800'
            }`}
          >
            {isPedestrianWalk ? 'PEDESTRIAN WALK' : `${currentPhase} (${activeDirection})`}
          </span>
        </div>
      </div>

      {/* 4-Way Crossroad Visual Layout */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center justify-center">
        {/* NORTH ROAD (Top) */}
        <div className="w-full max-w-xs mb-3">
          {renderRoadCard('NORTH', <ArrowDown className="w-4 h-4" />)}
        </div>

        {/* MIDDLE ROW: WEST ROAD | CENTRAL JUNCTION CORE | EAST ROAD */}
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-3 my-2">
          {/* WEST ROAD (Left) */}
          <div className="w-full md:w-1/3 max-w-xs">
            {renderRoadCard('WEST', <ArrowRight className="w-4 h-4" />)}
          </div>

          {/* CENTRAL JUNCTION INTERSECTION CORE (Center Hub) */}
          <div
            className={`relative w-44 h-44 rounded-xl bg-black border flex flex-col items-center justify-center p-3 shrink-0 my-2 md:my-0 transition-all ${
              isPedestrianWalk
                ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : activeEmergency
                ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                : 'border-[#27272a]'
            }`}
          >
            {/* Crosswalk Zebra Lines (Top) */}
            <div
              className={`absolute top-1.5 left-6 right-6 h-1.5 flex justify-between transition-all ${
                isPedestrianWalk ? 'opacity-100' : 'opacity-20'
              }`}
            >
              <span className={`w-2 rounded-xs ${isPedestrianWalk ? 'bg-emerald-400' : 'bg-white'}`} />
              <span className={`w-2 rounded-xs ${isPedestrianWalk ? 'bg-emerald-400' : 'bg-white'}`} />
              <span className={`w-2 rounded-xs ${isPedestrianWalk ? 'bg-emerald-400' : 'bg-white'}`} />
              <span className={`w-2 rounded-xs ${isPedestrianWalk ? 'bg-emerald-400' : 'bg-white'}`} />
            </div>

            {/* Crosswalk Zebra Lines (Bottom) */}
            <div
              className={`absolute bottom-1.5 left-6 right-6 h-1.5 flex justify-between transition-all ${
                isPedestrianWalk ? 'opacity-100' : 'opacity-20'
              }`}
            >
              <span className={`w-2 rounded-xs ${isPedestrianWalk ? 'bg-emerald-400' : 'bg-white'}`} />
              <span className={`w-2 rounded-xs ${isPedestrianWalk ? 'bg-emerald-400' : 'bg-white'}`} />
              <span className={`w-2 rounded-xs ${isPedestrianWalk ? 'bg-emerald-400' : 'bg-white'}`} />
              <span className={`w-2 rounded-xs ${isPedestrianWalk ? 'bg-emerald-400' : 'bg-white'}`} />
            </div>

            {/* Junction Center Pulse Core */}
            <div className="relative flex flex-col items-center text-center">
              <div
                className={`w-11 h-11 rounded-lg flex items-center justify-center border mb-1.5 transition-all ${
                  isPedestrianWalk
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-400 scale-105'
                    : activeEmergency
                    ? 'bg-red-950 border-red-500 text-red-400 animate-pulse'
                    : currentPhase === 'GREEN'
                    ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-400'
                    : currentPhase === 'YELLOW'
                    ? 'bg-amber-950/60 border-amber-600/60 text-amber-400'
                    : 'bg-red-950/60 border-red-600/60 text-red-400'
                }`}
              >
                {isPedestrianWalk ? (
                  <Footprints className="w-5 h-5 text-emerald-400" />
                ) : activeEmergency ? (
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                ) : (
                  <Zap className="w-5 h-5" />
                )}
              </div>

              <div className="text-[10px] font-mono text-zinc-500 uppercase">
                {isPedestrianWalk ? 'PEDESTRIAN' : 'JUNCTION J001'}
              </div>
              <div className="text-xs font-mono font-bold text-white">
                {isPedestrianWalk ? 'ALL RED HOLD' : activeDirection}
              </div>
              <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                {isPedestrianWalk ? `${pedestrianState?.countdown}s WALK TIME` : `${phaseCountdown}s REMAINING`}
              </div>
            </div>
          </div>

          {/* EAST ROAD (Right) */}
          <div className="w-full md:w-1/3 max-w-xs">
            {renderRoadCard('EAST', <ArrowLeft className="w-4 h-4" />)}
          </div>
        </div>

        {/* SOUTH ROAD (Bottom) */}
        <div className="w-full max-w-xs mt-3">
          {renderRoadCard('SOUTH', <ArrowUp className="w-4 h-4" />)}
        </div>
      </div>
    </div>
  );
};
