import React, { useState } from 'react';
import {
  Sliders,
  Play,
  Square,
  RotateCcw,
  Info,
  Clock,
} from 'lucide-react';
import {
  Direction,
  LightState,
  ControlMode,
  TrafficDecision,
  RoadLiveStatus,
} from '../../types';
import { api } from '../../services/api';
import { soundEffects } from '../../utils/soundEffects';

interface SignalControlCardProps {
  mode: ControlMode;
  activeDirection: Direction;
  currentPhase: 'GREEN' | 'YELLOW' | 'ALL_RED';
  phaseTimeRemaining: number;
  currentPhaseDuration: number;
  lastDecision: TrafficDecision;
  activeRoad: RoadLiveStatus;
  isCycleRunning: boolean;
  onRefresh: () => void;
}

export const SignalControlCard: React.FC<SignalControlCardProps> = ({
  mode,
  activeDirection,
  currentPhase,
  phaseTimeRemaining,
  currentPhaseDuration,
  lastDecision,
  activeRoad,
  isCycleRunning,
  onRefresh,
}) => {
  const [loading, setLoading] = useState<boolean>(false);

  const handleToggleMode = async (newMode: 'AUTOMATIC' | 'MANUAL') => {
    try {
      soundEffects.playClick();
      setLoading(true);
      await api.setMode(newMode);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRunning = async () => {
    try {
      soundEffects.playClick();
      setLoading(true);
      if (isCycleRunning) {
        await api.stopCycle();
      } else {
        await api.startCycle();
      }
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      soundEffects.playClick();
      setLoading(true);
      await api.resetJunction();
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const percentLeft = Math.min(
    100,
    Math.max(0, Math.round((phaseTimeRemaining / (currentPhaseDuration || 1)) * 100))
  );

  return (
    <div className="bg-[#0a0a0a] border border-[#27272a] hover:border-zinc-700 rounded-xl p-5 flex flex-col justify-between h-full transition text-white">
      <div>
        {/* Header with Mode Toggle Switch */}
        <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-[#1f1f23]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Signal Controller
            </h3>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono font-medium">
            <button
              onClick={() => handleToggleMode('AUTOMATIC')}
              disabled={loading || mode === 'AUTOMATIC'}
              className={`px-2.5 py-1 rounded-md transition ${
                mode === 'AUTOMATIC'
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              AUTO
            </button>
            <button
              onClick={() => handleToggleMode('MANUAL')}
              disabled={loading || mode === 'MANUAL'}
              className={`px-2.5 py-1 rounded-md transition ${
                mode === 'MANUAL'
                  ? 'bg-amber-400 text-black font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              MANUAL
            </button>
          </div>
        </div>

        {/* Current State Highlight Banner */}
        <div className="grid grid-cols-2 gap-2.5 mb-3.5">
          {/* Signal State */}
          <div className="p-3 rounded-lg bg-zinc-950 border border-[#27272a]">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
              Current Signal
            </span>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  currentPhase === 'GREEN'
                    ? 'bg-emerald-400 animate-pulse'
                    : currentPhase === 'YELLOW'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span
                className={`text-sm font-bold font-mono tracking-wide ${
                  currentPhase === 'GREEN'
                    ? 'text-emerald-400'
                    : currentPhase === 'YELLOW'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {currentPhase}
              </span>
            </div>
          </div>

          {/* Active Road */}
          <div className="p-3 rounded-lg bg-zinc-950 border border-[#27272a]">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
              Active Road
            </span>
            <div className="text-sm font-semibold text-white mt-1.5 truncate">
              {activeDirection} ROAD
            </div>
            <div className="text-[11px] text-zinc-400 truncate">
              {activeRoad?.name || 'Approach'}
            </div>
          </div>
        </div>

        {/* Dynamic Timing Progress Bar */}
        <div className="p-3 rounded-lg bg-zinc-950 border border-[#27272a] mb-3.5">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Phase Time:</span>
            </span>
            <span className="font-bold text-white">
              {phaseTimeRemaining}s / {currentPhaseDuration}s
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                currentPhase === 'GREEN'
                  ? 'bg-emerald-400'
                  : currentPhase === 'YELLOW'
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${percentLeft}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 font-mono">
            <span>Adaptive Duration:</span>
            <span className="text-white font-semibold">
              {lastDecision.recommendedGreenSeconds}s
            </span>
          </div>
        </div>

        {/* Rule-Based Decision Reasoning */}
        <div className="p-3 rounded-lg bg-zinc-950 border border-[#27272a] mb-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
            <Info className="w-3.5 h-3.5 text-zinc-500" />
            <span>BCNF Optimization Rationale</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {lastDecision.reason}
          </p>
          <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400 pt-1.5 border-t border-zinc-900 font-mono">
            <span>Queue: <strong className="text-white">{lastDecision.vehicleCount} veh</strong></span>
            <span>Density: <strong className="text-emerald-400">{lastDecision.density}</strong></span>
          </div>
        </div>
      </div>

      {/* Controller Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1f1f23]">
        <button
          onClick={handleToggleRunning}
          disabled={loading}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold transition cursor-pointer ${
            isCycleRunning
              ? 'bg-red-950/80 hover:bg-red-900/90 text-red-300 border border-red-800/80'
              : 'bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-800/80'
          }`}
        >
          {isCycleRunning ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>STOP CYCLE</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>START CYCLE</span>
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 font-semibold text-xs transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET</span>
        </button>
      </div>
    </div>
  );
};
