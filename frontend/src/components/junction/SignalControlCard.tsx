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
    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header with Mode Toggle Switch */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Signal Controller
            </h3>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-mono font-bold">
            <button
              onClick={() => handleToggleMode('AUTOMATIC')}
              disabled={loading || mode === 'AUTOMATIC'}
              className={`px-2.5 py-1 rounded-lg transition-all ${mode === 'AUTOMATIC'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              AUTO
            </button>
            <button
              onClick={() => handleToggleMode('MANUAL')}
              disabled={loading || mode === 'MANUAL'}
              className={`px-2.5 py-1 rounded-lg transition-all ${mode === 'MANUAL'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              MANUAL
            </button>
          </div>
        </div>

        {/* Current State Highlight Banner */}
        <div className="grid grid-cols-2 gap-2.5 mb-3.5">
          {/* Signal State */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Current Signal
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-3 h-3 rounded-full ${currentPhase === 'GREEN'
                  ? 'bg-emerald-500 shadow-xs'
                  : currentPhase === 'YELLOW'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-red-500'
                  }`}
              />
              <span
                className={`text-sm font-black font-mono tracking-wider ${currentPhase === 'GREEN'
                  ? 'text-emerald-700'
                  : currentPhase === 'YELLOW'
                    ? 'text-amber-700'
                    : 'text-rose-700'
                  }`}
              >
                {currentPhase}
              </span>
            </div>
          </div>

          {/* Active Road */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Active Road
            </span>
            <div className="text-sm font-bold text-slate-800 mt-1 truncate">
              {activeDirection} ROAD
            </div>
            <div className="text-[10px] text-slate-500">
              {activeRoad?.name || 'Approach'}
            </div>
          </div>
        </div>

        {/* Dynamic Timing Progress Bar */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 mb-3.5">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-500 flex items-center gap-1 font-sans">
              <Clock className="w-3.5 h-3.5 text-indigo-600" /> Duration:
            </span>
            <span className="font-extrabold text-slate-800 font-mono">
              {phaseTimeRemaining}s / {currentPhaseDuration}s
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${currentPhase === 'GREEN'
                ? 'bg-emerald-500'
                : currentPhase === 'YELLOW'
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
                }`}
              style={{ width: `${percentLeft}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span>Recommended Green:</span>
            <span className="text-slate-800 font-bold font-mono">
              {lastDecision.recommendedGreenSeconds}s
            </span>
          </div>
        </div>

        {/* Rule-Based Decision Reasoning */}
        <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 mb-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
            <Info className="w-3.5 h-3.5 text-indigo-600" />
            <span>Decision Rationale</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {lastDecision.reason}
          </p>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-indigo-100 font-mono">
            <span>Vehicles: <strong className="text-slate-800">{lastDecision.vehicleCount}</strong></span>
            <span>Density: <strong className="text-indigo-700">{lastDecision.density}</strong></span>
          </div>
        </div>
      </div>

      {/* Controller Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={handleToggleRunning}
          disabled={loading}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition ${isCycleRunning
            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
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
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET</span>
        </button>
      </div>
    </div>
  );
};
