import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Clock, ShieldCheck, Activity, Zap, ChevronRight } from 'lucide-react';
import { TrafficForecasterCard } from '../components/forecaster/TrafficForecasterCard';
import { RushHourTrendComparison } from '../components/forecaster/RushHourTrendComparison';
import { ProactiveTuningPanel } from '../components/forecaster/ProactiveTuningPanel';
import {
  ForecastHorizonPoint,
  ForecastModelMetrics,
  RushHourCurvePoint,
  ProactiveTuningPlan,
} from '../types';
import { api } from '../services/api';
import { soundEffects } from '../utils/soundEffects';

export const ForecasterPage: React.FC = () => {
  const [horizons, setHorizons] = useState<ForecastHorizonPoint[]>([]);
  const [metrics, setMetrics] = useState<ForecastModelMetrics | null>(null);
  const [curves, setCurves] = useState<RushHourCurvePoint[]>([]);
  const [proactivePlan, setProactivePlan] = useState<ProactiveTuningPlan | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchForecastData = async () => {
    setIsRefreshing(true);
    try {
      const [fRes, cRes, pRes] = await Promise.all([
        api.getForecastTimeseries(),
        api.getRushHourCurves(),
        api.getProactivePlan(),
      ]);

      if (fRes?.success) {
        setHorizons(fRes.data.horizons);
        setMetrics(fRes.data.modelMetrics);
      }
      if (cRes?.success) setCurves(cRes.data);
      if (pRes?.success) setProactivePlan(pRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchForecastData();
    const interval = setInterval(fetchForecastData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleApplyProactive = async () => {
    try {
      soundEffects.playClick();
      const res = await api.applyProactivePlan();
      if (res?.success) {
        setProactivePlan(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 text-slate-900 dark:text-white transition-colors">
      {/* Header Banner */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Traffic Demand &amp; Congestion Forecaster
              </h1>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-[#141417] dark:text-zinc-400 dark:border-[#222226]">
                ARIMA + Prophet
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans mt-0.5">
              Short-term volume forecasting at 15, 30, and 60-minute horizons with proactive green split tuning.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            soundEffects.playClick();
            fetchForecastData();
          }}
          disabled={isRefreshing}
          className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Forecast</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
          <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Model Accuracy</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            {metrics ? `${metrics.accuracyPercent}%` : '94.2%'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono mt-0.5">MAE: {metrics?.meanAbsoluteError || 2.4}</div>
        </div>

        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
          <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Peak Hour Window</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            18:30 - 20:00
          </div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono mt-0.5">Expected: 142 veh/cycle</div>
        </div>

        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
          <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Proactive Phase Gain</span>
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            +18.4%
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">Throughput Optimization</div>
        </div>

        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
          <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Model R² Score</span>
            <Activity className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-300" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            {metrics?.r2Score || 0.94}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono mt-0.5">30-Day Historical Training</div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Cols: Forecaster Horizons Card */}
        <div className="lg:col-span-7 space-y-4">
          <TrafficForecasterCard horizons={horizons} metrics={metrics} />
        </div>

        {/* Right 5 Cols: Proactive Tuning Panel */}
        <div className="lg:col-span-5 space-y-4">
          <ProactiveTuningPanel plan={proactivePlan} onApplyPlan={handleApplyProactive} />
        </div>
      </div>

      {/* Full-Width Rush Hour Trend Curves */}
      <RushHourTrendComparison curves={curves} />
    </div>
  );
};
