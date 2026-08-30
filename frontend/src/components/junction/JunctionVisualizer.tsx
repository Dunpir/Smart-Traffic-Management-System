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
        return 'text-zinc-300 bg-zinc-900 border-zinc-800';
      case 'MEDIUM':
        return 'text-zinc-200 bg-zinc-900 border-zinc-700';
      case 'HIGH':
        return 'text-amber-400 bg-zinc-900 border-amber-900/50';
      case 'VERY HIGH':
        return 'text-rose-400 bg-zinc-900 border-rose-900/50';
    }
  };

  const renderSignalHead = (direction: Direction, currentSignal: LightState) => {
    const isThisActive = activeDirection === direction;
    const isEmergencyApproach = activeEmergency?.direction === direction;

    return (
      <div
        className={`flex items-center gap-1.5 p-1.5 rounded bg-black border transition ${
          isEmergencyApproach
            ? 'border-red-500 shadow-xs'
            : isThisActive
            ? 'border-zinc-500'
            : 'border-[#27272a]'
        }`}
      >
        {/* Red Light */}
        <div
          className={`w-3 h-3 rounded-full transition-all ${
            currentSignal === 'RED'
              ? 'bg-red-500 shadow-xs'
              : 'bg-red-950/40 opacity-20'
          }`}
          title="RED Signal"
        />

        {/* Yellow Light */}
        <div
          className={`w-3 h-3 rounded-full transition-all ${
            currentSignal === 'YELLOW'
              ? 'bg-amber-400 shadow-xs animate-pulse'
              : 'bg-amber-950/40 opacity-20'
          }`}
          title="YELLOW Signal"
        />

        {/* Green Light */}
        <div
          className={`w-3 h-3 rounded-full transition-all ${
            currentSignal === 'GREEN'
              ? 'bg-emerald-400 shadow-xs'
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
        className={`relative p-3 rounded-lg transition cursor-pointer border ${
          isEmergency
            ? 'bg-red-950/30 border-red-500'
            : isActive
            ? 'bg-[#141418] border-zinc-500'
            : 'bg-[#0a0a0a] hover:bg-[#101014] border-[#1f1f23]'
        } ${isHovered ? 'border-[#333338]' : ''}`}
      >
        {/* Road Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
              {icon}
            </span>
            <div>
              <span className="text-xs font-semibold text-white uppercase tracking-tight block">
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

        {/* Metric Row */}
        <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-xs">
          <div className="p-1.5 rounded bg-black border border-[#1f1f23] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 block font-sans">Queue</span>
              <span className="text-sm font-bold text-white">{road.vehicleCount} veh</span>
            </div>
            <Car className="w-3.5 h-3.5 text-zinc-500" />
          </div>

          <div className="p-1.5 rounded bg-black border border-[#1f1f23] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 block font-sans">Flow</span>
              <span className="text-xs font-semibold text-zinc-300">{road.flowRate}</span>
            </div>
            <Flame className="w-3.5 h-3.5 text-zinc-500" />
          </div>
        </div>

        {/* Density Badge */}
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-900 text-[10px] font-mono">
          <span className={`px-1.5 py-0.2 rounded border font-medium ${getDensityBadge(road.density)}`}>
            {road.density}
          </span>
          <span className="text-zinc-500">
            {road.congestion}
          </span>
        </div>

        {/* Emergency Alert Tag */}
        {isEmergency && (
          <div className="mt-2 py-1 px-2 rounded bg-red-600 text-white font-semibold text-[10px] uppercase flex items-center justify-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>EMERGENCY PRE-EMPTION ENGAGED</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative bg-[#0a0a0a] p-4 sm:p-5 rounded-lg border border-[#1f1f23] hover:border-[#333338] text-white transition">
      {/* Title Bar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1f1f23] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white" />
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
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
                  ? 'bg-white text-black font-semibold'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>
                {isPedestrianWalk ? `WALK (${pedestrianState?.countdown}s)` : 'Pedestrian PAB'}
              </span>
            </button>
          )}

          <span className="text-zinc-500">Phase:</span>
          <span
            className={`font-semibold px-2 py-0.5 rounded text-[11px] font-mono border ${
              isPedestrianWalk
                ? 'bg-zinc-900 text-emerald-400 border-zinc-700'
                : currentPhase === 'GREEN'
                ? 'bg-zinc-900 text-emerald-400 border-zinc-700'
                : currentPhase === 'YELLOW'
                ? 'bg-zinc-900 text-amber-400 border-zinc-700'
                : 'bg-zinc-900 text-rose-400 border-zinc-700'
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
            className={`relative w-40 h-40 rounded-lg bg-black border flex flex-col items-center justify-center p-3 shrink-0 my-2 md:my-0 transition-all ${
              isPedestrianWalk
                ? 'border-emerald-500'
                : activeEmergency
                ? 'border-red-500'
                : 'border-[#1f1f23]'
            }`}
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
                className={`w-9 h-9 rounded flex items-center justify-center border mb-1 transition ${
                  isPedestrianWalk
                    ? 'bg-zinc-900 border-emerald-500 text-emerald-400'
                    : activeEmergency
                    ? 'bg-red-950 border-red-500 text-red-400'
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
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
              </div>

              <div className="text-[10px] font-mono text-zinc-500 uppercase">
                {isPedestrianWalk ? 'PEDESTRIAN' : 'JUNCTION 01'}
              </div>
              <div className="text-xs font-mono font-bold text-white">
                {isPedestrianWalk ? 'ALL RED' : activeDirection}
              </div>
              <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                {isPedestrianWalk ? `${pedestrianState?.countdown}s WALK` : `${phaseCountdown}s REMAINING`}
              </div>
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
