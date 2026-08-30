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
import { soundEffects } from '../../utils/soundEffects';

interface RushHourTrendComparisonProps {
  curves: RushHourCurvePoint[];
}

export const RushHourTrendComparison: React.FC<RushHourTrendComparisonProps> = ({ curves }) => {
  const [showWeekday, setShowWeekday] = useState(true);
  const [showRain, setShowRain] = useState(true);
  const [showWeekend, setShowWeekend] = useState(true);
  const [showLive, setShowLive] = useState(true);

  return (
    <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] space-y-3.5 text-slate-900 dark:text-white transition shadow-xs">
      {/* Header & Layer Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-200 dark:border-[#1f1f23]">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              24-Hour Rush-Hour Pattern Comparison
            </h3>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono mt-0.5">
            Simulated rush-hour diurnal curves: Weekdays vs Rainy Storm Days vs Weekend vs Live Actual.
          </p>
        </div>

        {/* Layer Checkboxes */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <button
            onClick={() => {
              soundEffects.playClick();
              setShowWeekday(!showWeekday);
            }}
            className={`px-2 py-0.5 rounded border text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
              showWeekday
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-black dark:border-white'
                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-800'
            }`}
          >
            <span>Weekday</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setShowRain(!showRain);
            }}
            className={`px-2 py-0.5 rounded border text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
              showRain
                ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700'
                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-800'
            }`}
          >
            <span>Rain (+40%)</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setShowWeekend(!showWeekend);
            }}
            className={`px-2 py-0.5 rounded border text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
              showWeekend
                ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700'
                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-800'
            }`}
          >
            <span>Weekend</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setShowLive(!showLive);
            }}
            className={`px-2 py-0.5 rounded border text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
              showLive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700'
                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-800'
            }`}
          >
            <span>Live Flow</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={curves} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
              }}
            />
            {showWeekday && <Line type="monotone" dataKey="weekday" stroke="#0f172a" strokeWidth={2} dot={false} name="Weekday Base" />}
            {showRain && <Line type="monotone" dataKey="rainStorm" stroke="#f43f5e" strokeWidth={2} dot={false} strokeDasharray="4 4" name="Rain Storm (+40%)" />}
            {showWeekend && <Line type="monotone" dataKey="weekend" stroke="#f59e0b" strokeWidth={2} dot={false} name="Weekend Flow" />}
            {showLive && <Line type="monotone" dataKey="liveActual" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} name="Live Observed" />}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
