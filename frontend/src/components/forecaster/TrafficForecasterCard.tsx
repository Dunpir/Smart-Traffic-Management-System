import React, { useState } from 'react';
import { TrendingUp, Cpu, Clock, ShieldCheck, BarChart2, Flame, Layers } from 'lucide-react';
import { ForecastHorizonPoint, ForecastModelMetrics, Direction } from '../../types';

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
        return 'text-emerald-400 border-emerald-800 bg-emerald-950/60';
      case 'MEDIUM':
        return 'text-cyan-400 border-cyan-800 bg-cyan-950/60';
      case 'HIGH':
        return 'text-amber-400 border-amber-800 bg-amber-950/60';
      case 'VERY HIGH':
        return 'text-rose-400 border-rose-800 bg-rose-950/60 animate-pulse';
      default:
        return 'text-cyan-400 border-cyan-800 bg-cyan-950/60';
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>AI Predictive Multi-Horizon Traffic Forecaster</span>
          </h3>
        </div>

        {/* Horizon Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          {[15, 30, 60].map((m) => (
            <button
              key={m}
              onClick={() => setSelectedHorizon(m)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${selectedHorizon === m
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              +{m} Mins
            </button>
          ))}
        </div>
      </div>

      {/* Main Forecast Card */}
      {current && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Predicted Volume */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Predicted Volume (+{selectedHorizon}m)</span>
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono flex items-baseline gap-2">
              <span>{current.predictedVehicleCount}</span>
              <span className="text-xs text-slate-400 font-normal">vehicles</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              95% Confidence: [{current.lowerConfidence} - {current.upperConfidence} veh]
            </div>
          </div>

          {/* Predicted Congestion Index */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Congestion Level</span>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-cyan-400 font-mono">
              {current.predictedCongestion}%
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${current.predictedCongestion}%` }}
              />
            </div>
          </div>

          {/* Density Classification */}
          <div className={`p-4 rounded-xl border ${getDensityColor(current.predictedDensity)} space-y-1`}>
            <div className="text-[10px] font-mono uppercase tracking-wider flex items-center justify-between opacity-80">
              <span>Predicted Density</span>
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight mt-1">
              {current.predictedDensity}
            </div>
            <div className="text-[10px] font-mono opacity-80">
              Forecast Target: {new Date(current.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      )}

      {/* Approach Breakdown */}
      {current && (
        <div className="space-y-2">
          <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
            Predicted Approach Queue Influx (+{selectedHorizon} Minutes Ahead):
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as Direction[]).map((dir) => (
              <div key={dir} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold">{dir} ROAD</div>
                  <div className="text-lg font-extrabold text-white mt-0.5">{current.roads[dir]} veh</div>
                </div>
                <div className="text-[11px] text-cyan-400 font-bold">
                  {Math.round((current.roads[dir] / current.predictedVehicleCount) * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model Metadata Footer */}
      {metrics && (
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Model: <strong className="text-slate-200">{metrics.modelName}</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <span>Accuracy: <strong className="text-emerald-400">{metrics.accuracyPercent}%</strong></span>
            <span>MAE: <strong className="text-cyan-400">{metrics.meanAbsoluteError}</strong></span>
            <span>R² Score: <strong className="text-amber-400">{metrics.r2Score}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
