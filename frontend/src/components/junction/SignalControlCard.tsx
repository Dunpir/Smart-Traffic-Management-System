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
    <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] rounded-lg p-4 flex flex-col justify-between h-full transition text-slate-900 dark:text-white shadow-xs">
      <div>
        {/* Header with Mode Toggle Switch */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-[#1f1f23]">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Signal Controller
            </h3>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-mono">
            <button
              onClick={() => handleToggleMode('AUTOMATIC')}
              disabled={loading || mode === 'AUTOMATIC'}
              className={`px-2 py-0.5 rounded transition ${
                mode === 'AUTOMATIC'
                  ? 'bg-slate-900 text-white font-semibold dark:bg-white dark:text-black'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              AUTO
            </button>
            <button
              onClick={() => handleToggleMode('MANUAL')}
              disabled={loading || mode === 'MANUAL'}
              className={`px-2 py-0.5 rounded transition ${
                mode === 'MANUAL'
                  ? 'bg-slate-900 text-white font-semibold dark:bg-white dark:text-black'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              MANUAL
            </button>
          </div>
        </div>

        {/* Current State Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Signal State */}
          <div className="p-2.5 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23]">
            <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase block">
              Current Signal
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  currentPhase === 'GREEN'
                    ? 'bg-emerald-500'
                    : currentPhase === 'YELLOW'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                {currentPhase}
              </span>
            </div>
          </div>

          {/* Active Road */}
          <div className="p-2.5 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23]">
            <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase block">
              Active Road
            </span>
            <div className="text-xs font-semibold text-slate-900 dark:text-white mt-1 truncate">
              {activeDirection} ROAD
            </div>
            <div className="text-[10px] text-slate-500 dark:text-zinc-500 truncate">
              {activeRoad?.name || 'Approach'}
            </div>
          </div>
        </div>

        {/* Dynamic Timing Progress Bar */}
        <div className="p-2.5 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] mb-3">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-600 dark:text-zinc-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500 dark:text-zinc-500" />
              <span>Phase Duration:</span>
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {phaseTimeRemaining}s / {currentPhaseDuration}s
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-slate-200 dark:bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 dark:bg-white transition-all duration-300 rounded-full"
              style={{ width: `${percentLeft}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-zinc-400 mt-1.5 font-mono">
            <span>Adaptive Time:</span>
            <span className="text-slate-900 dark:text-white font-medium">
              {lastDecision.recommendedGreenSeconds}s
            </span>
          </div>
        </div>

        {/* Rule-Based Decision Reasoning */}
        <div className="p-2.5 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] mb-3">
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 dark:text-zinc-400 uppercase mb-1">
            <Info className="w-3 h-3 text-slate-500" />
            <span>BCNF Optimization Rationale</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
            {lastDecision.reason}
          </p>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-500 pt-1.5 border-t border-slate-200 dark:border-zinc-900 font-mono">
            <span>Queue: <strong className="text-slate-900 dark:text-white">{lastDecision.vehicleCount} veh</strong></span>
            <span>Density: <strong className="text-slate-900 dark:text-white">{lastDecision.density}</strong></span>
          </div>
        </div>
      </div>

      {/* Controller Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-[#1f1f23]">
        <button
          onClick={handleToggleRunning}
          disabled={loading}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-semibold transition cursor-pointer ${
            isCycleRunning
              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-rose-400 dark:border-rose-900/50'
              : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black'
          }`}
        >
          {isCycleRunning ? (
            <>
              <Square className="w-3 h-3 fill-current" />
              <span>STOP CYCLE</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" />
              <span>START CYCLE</span>
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 font-semibold text-xs transition cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>RESET</span>
        </button>
      </div>
    </div>
  );
};
