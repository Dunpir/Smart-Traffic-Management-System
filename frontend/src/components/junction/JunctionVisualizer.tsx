import React, { useState } from 'react';
import {
  Camera,
  Radio,
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

  const getDensityColor = (density: DensityLevel) => {
    switch (density) {
      case 'LOW':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'MEDIUM':
        return 'text-teal-700 bg-teal-50 border-teal-200';
      case 'HIGH':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'VERY HIGH':
        return 'text-rose-700 bg-rose-50 border-rose-200';
    }
  };

  const renderSignalHead = (direction: Direction, currentSignal: LightState) => {
    const isThisActive = activeDirection === direction;
    const isEmergencyApproach = activeEmergency?.direction === direction;

    return (
      <div
        className={`flex items-center gap-1.5 p-2 rounded-xl bg-slate-950 border transition-all ${isEmergencyApproach
            ? 'border-rose-500 shadow-md shadow-rose-500/30'
            : isThisActive
              ? 'border-teal-500 shadow-md shadow-teal-500/20'
              : 'border-slate-800'
          }`}
      >
        {/* Red Light */}
        <div
          className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${currentSignal === 'RED'
              ? 'bg-red-500 shadow-sm shadow-red-500 scale-110'
              : 'bg-red-950/40 opacity-30'
            }`}
          title="RED Signal"
        />

        {/* Yellow Light */}
        <div
          className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${currentSignal === 'YELLOW'
              ? 'bg-amber-400 shadow-sm shadow-amber-400 scale-110 animate-pulse'
              : 'bg-amber-950/40 opacity-30'
            }`}
          title="YELLOW Signal"
        />

        {/* Green Light */}
        <div
          className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${currentSignal === 'GREEN'
              ? 'bg-emerald-400 shadow-sm shadow-emerald-400 scale-110'
              : 'bg-emerald-950/40 opacity-30'
            }`}
          title="GREEN Signal"
        />
      </div>
    );
  };

  const renderRoadCard = (
    direction: Direction,
    icon: React.ReactNode
  ) => {
    const road = roads[direction];
    if (!road) return null;

    const isActive = activeDirection === direction;
    const isEmergency = activeEmergency?.direction === direction;
    const isHovered = hoveredRoad === direction;

    return (
      <div
        onClick={() => onSelectRoad && onSelectRoad(direction)}
        onMouseEnter={() => setHoveredRoad(direction)}
        onMouseLeave={() => setHoveredRoad(null)}
        className={`relative p-3.5 rounded-2xl transition-all cursor-pointer border ${isEmergency
            ? 'bg-rose-50 border-rose-400 shadow-md ring-2 ring-rose-400/40'
            : isActive
              ? 'bg-indigo-50/80 border-indigo-500 shadow-sm ring-1 ring-indigo-400/30'
              : 'bg-white hover:bg-slate-50 border-slate-200'
          } ${isHovered ? 'scale-[1.01]' : ''}`}
      >
        {/* Road Header Info */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded-lg bg-slate-100 text-slate-700">{icon}</span>
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-tight block">
                {direction} ROAD
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {road.roadId} • {road.speedLimit} km/h limit
              </span>
            </div>
          </div>

          {/* Real-Time Signal Head */}
          {renderSignalHead(direction, road.currentSignal)}
        </div>

        {/* Dynamic Metric Tiles */}
        <div className="grid grid-cols-2 gap-2 mt-2 font-sans text-xs">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Queue</span>
              <span className="text-sm font-extrabold text-slate-800">{road.vehicleCount} veh</span>
            </div>
            <Car className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Flow</span>
              <span className="text-xs font-bold text-slate-800">{road.flowRate}</span>
            </div>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
          </div>
        </div>

        {/* Density Badge */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] font-mono">
          <span className={`px-2 py-0.5 rounded-full font-bold border ${getDensityColor(road.density)}`}>
            {road.density}
          </span>
          <span className="text-slate-500 font-medium">
            {road.congestion}
          </span>
        </div>


        {/* Emergency Pre-emption Alert Tag */}
        {isEmergency && (
          <div className="mt-2 py-1 px-2 rounded-lg bg-rose-600 text-white font-bold text-[10px] uppercase flex items-center justify-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>EMERGENCY CORRIDOR ENGAGED</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Title Bar */}
      <div className="flex items-center justify-between mb-4 relative z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-ping" />
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            4-Way Junction Real-Time Visualization
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          {/* Quick PAB Request button */}
          {onRequestPedestrianCrossing && (
            <button
              onClick={onRequestPedestrianCrossing}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition shadow-2xs ${isPedestrianWalk
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>{isPedestrianWalk ? `WALK (${pedestrianState?.countdown}s)` : 'Request Crosswalk (PAB)'}</span>
            </button>
          )}

          <span className="text-slate-500 font-bold font-sans">Phase:</span>
          <span
            className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${isPedestrianWalk
                ? 'bg-emerald-100 text-emerald-800'
                : currentPhase === 'GREEN'
                  ? 'bg-emerald-100 text-emerald-800'
                  : currentPhase === 'YELLOW'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
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
            className={`relative w-44 h-44 rounded-3xl bg-slate-900 border-2 shadow-xl flex flex-col items-center justify-center p-3 shrink-0 my-2 md:my-0 transition-all ${isPedestrianWalk
                ? 'border-emerald-400 shadow-[0_0_20px_#10b981]'
                : 'border-slate-800'
              }`}
          >
            {/* Crosswalk Zebra Lines (Top) */}
            <div
              className={`absolute top-1.5 left-6 right-6 h-2 flex justify-between transition-all ${isPedestrianWalk ? 'opacity-100 animate-pulse' : 'opacity-30'
                }`}
            >
              <span className={`w-2 rounded-xs ${isPedestrianWalk ? 'bg-emerald-400' : 'bg-white'}`} />
              <span className={`w-2 rounded-xs ${isPedestrianWalk ? 'bg-emerald-400' : 'bg-white'}`} />
              <span className={`w-2 rounded-xs ${isPedestrianWalk ? 'bg-emerald-400' : 'bg-white'}`} />
              <span className={`w-2 rounded-xs ${isPedestrianWalk ? 'bg-emerald-400' : 'bg-white'}`} />
            </div>

            {/* Crosswalk Zebra Lines (Bottom) */}
            <div
              className={`absolute bottom-1.5 left-6 right-6 h-2 flex justify-between transition-all ${isPedestrianWalk ? 'opacity-100 animate-pulse' : 'opacity-30'
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
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border mb-1.5 transition-all ${isPedestrianWalk
                    ? 'bg-emerald-500/30 border-emerald-300 text-emerald-300 scale-110'
                    : activeEmergency
                      ? 'bg-rose-500/30 border-rose-400 text-rose-400 animate-pulse'
                      : currentPhase === 'GREEN'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
                        : currentPhase === 'YELLOW'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-400'
                          : 'bg-rose-500/20 border-rose-400 text-rose-400'
                  }`}
              >
                {isPedestrianWalk ? (
                  <Footprints className="w-7 h-7 animate-bounce text-emerald-300" />
                ) : activeEmergency ? (
                  <ShieldAlert className="w-7 h-7 animate-bounce" />
                ) : (
                  <Zap className="w-6 h-6 animate-pulse" />
                )}
              </div>

              <div className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                {isPedestrianWalk ? 'PEDESTRIAN WALK' : 'JUNCTION J001'}
              </div>
              <div className="text-xs font-mono font-extrabold text-teal-300">
                {isPedestrianWalk ? 'ALL RED HOLD' : activeDirection}
              </div>
              <div className="text-[11px] font-mono font-bold text-white mt-0.5">
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
