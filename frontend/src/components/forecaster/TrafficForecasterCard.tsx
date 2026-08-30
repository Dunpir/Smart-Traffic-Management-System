import React, { useState } from 'react';
import { TrendingUp, Cpu, Clock, ShieldCheck, BarChart2, Flame, Layers } from 'lucide-react';
import { ForecastHorizonPoint, ForecastModelMetrics, Direction } from '../../types';
import { soundEffects } from '../../utils/soundEffects';

interface TrafficForecasterCardProps {
  horizons: ForecastHorizonPoint[];
  metrics: ForecastModelMetrics | null;
}

export const TrafficForecasterCard: React.FC<TrafficForecasterCardProps> = ({
  horizons,
  metrics,
}) => {
  const [selectedHorizon, setSelectedHorizon] = useState<number>(15);

  const current = horizons.find((h) => h.horizonMinutes === selectedHorizon) || horizons[0];

  const getDensityColor = (density: string) => {
    switch (density) {
      case 'LOW':
        return 'text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/60';
      case 'MEDIUM':
        return 'text-slate-800 border-slate-200 bg-slate-100 dark:text-zinc-300 dark:border-zinc-700 dark:bg-zinc-900';
      case 'HIGH':
        return 'text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950/60';
      case 'VERY HIGH':
        return 'text-rose-700 border-rose-200 bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:bg-rose-950/60';
      default:
        return 'text-slate-800 border-slate-200 bg-slate-100 dark:text-zinc-300 dark:border-zinc-700 dark:bg-zinc-900';
    }
  };

  return (
    <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] space-y-3.5 text-slate-900 dark:text-white transition shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-[#1f1f23]">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
            Multi-Horizon Traffic Forecaster
          </h3>
        </div>

        {/* Horizon Tabs */}
        <div className="flex items-center gap-1 p-0.5 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono">
          {[15, 30, 60].map((m) => (
            <button
              key={m}
              onClick={() => {
                soundEffects.playClick();
                setSelectedHorizon(m);
              }}
              className={`px-2.5 py-0.5 rounded transition cursor-pointer ${
                selectedHorizon === m
                  ? 'bg-slate-900 text-white font-semibold dark:bg-white dark:text-black'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              +{m} Mins
            </button>
          ))}
        </div>
      </div>

      {/* Main Horizon Card Content */}
      {current && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase block">Prediction Window</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{current.timestamp}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase block">Predicted Total Queue</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{current.predictedVehicleCount} vehicles</span>
            </div>
          </div>

          {/* 4 Approach Predictions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
            {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as Direction[]).map((dir) => {
              const count = current.roads?.[dir] ?? 0;
              const density = count > 30 ? 'VERY HIGH' : count > 20 ? 'HIGH' : count > 10 ? 'MEDIUM' : 'LOW';
              return (
                <div
                  key={dir}
                  className="p-2.5 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 dark:text-white">{dir}</span>
                    <span className={`px-1 py-0.2 rounded border text-[9px] font-semibold ${getDensityColor(density)}`}>
                      {density}
                    </span>
                  </div>

                  <div className="space-y-0.5 text-[11px] text-slate-600 dark:text-zinc-400 mt-1">
                    <div>Queue: <strong className="text-slate-900 dark:text-white">{count} veh</strong></div>
                    <div>Est. Split: <strong className="text-slate-900 dark:text-white">{Math.min(60, Math.max(15, count * 2))}s</strong></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
