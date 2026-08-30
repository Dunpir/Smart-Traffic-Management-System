import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { RushHourCurvePoint } from '../../types';
import { TrendingUp, CloudRain, Sun, Activity } from 'lucide-react';

interface RushHourTrendComparisonProps {
  curves: RushHourCurvePoint[];
}

export const RushHourTrendComparison: React.FC<RushHourTrendComparisonProps> = ({ curves }) => {
  const [showWeekday, setShowWeekday] = useState(true);
  const [showRain, setShowRain] = useState(true);
  const [showWeekend, setShowWeekend] = useState(true);
  const [showLive, setShowLive] = useState(true);

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
      {/* Header & Layer Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              24-Hour Rush-Hour Pattern Comparison &amp; AI Forecaster
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Simulated rush-hour diurnal curves: Weekdays vs Rainy Storm Days vs Weekend vs Live Actual.
          </p>
        </div>

        {/* Layer Checkboxes */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setShowWeekday(!showWeekday)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1.5 ${showWeekday
                ? 'bg-cyan-950/80 text-cyan-400 border-cyan-700'
                : 'bg-slate-900 text-slate-500 border-slate-800 opacity-60'
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Weekday</span>
          </button>

          <button
            onClick={() => setShowRain(!showRain)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1.5 ${showRain
                ? 'bg-rose-950/80 text-rose-400 border-rose-700'
                : 'bg-slate-900 text-slate-500 border-slate-800 opacity-60'
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Rain Storm (+40%)</span>
          </button>

          <button
            onClick={() => setShowWeekend(!showWeekend)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1.5 ${showWeekend
                ? 'bg-red-950/80 text-red-400 border-red-700'
                : 'bg-slate-900 text-slate-500 border-slate-800 opacity-60'
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span>Weekend</span>
          </button>

          <button
            onClick={() => setShowLive(!showLive)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1.5 ${showLive
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700'
                : 'bg-slate-900 text-slate-500 border-slate-800 opacity-60'
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Live Actual</span>
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={curves} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
            <XAxis
              dataKey="hour"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              label={{ value: 'Vehicles / Hr', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
            />
            {showWeekday && (
              <Line
                type="monotone"
                dataKey="weekday"
                name="Weekday Baseline"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={false}
              />
            )}
            {showRain && (
              <Line
                type="monotone"
                dataKey="rainStorm"
                name="Rainy Weather Surge"
                stroke="#f43f5e"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            )}
            {showWeekend && (
              <Line
                type="monotone"
                dataKey="weekend"
                name="Weekend Pattern"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
              />
            )}
            {showLive && (
              <Line
                type="monotone"
                dataKey="liveActual"
                name="Live Real-time Influx"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 3, fill: '#10b981' }}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
