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
import { Button } from '@/components/ui/button';

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
      const res = await api.applyProactivePlan();
      if (res?.success) {
        setProactivePlan(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="eyebrow-pill flex items-center gap-1.5 text-slate-700">
              <span>TIME-SERIES FORECASTING ENGINE</span>
              <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight bg-gradient-to-br from-slate-900 from-30% to-slate-600 bg-clip-text text-transparent mt-1">
            Traffic Demand &amp; Congestion Forecaster
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Short-term volume forecasting at 15, 30, and 60-minute horizons with proactive green split tuning.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchForecastData}
          disabled={isRefreshing}
          className="rounded-2xl text-xs font-bold border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 gap-1.5 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Forecast</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Model Accuracy</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-sans">
            {metrics ? `${metrics.accuracyPercent}%` : '94.2%'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Auto-Regressive Ensemble</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Next Surge Horizon</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1 font-sans">
            +20 Mins
          </div>
          <div className="text-[11px] text-slate-500 mt-1">North Boulevard (+78%)</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Mean Absolute Error</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900 mt-1 font-sans">
            {metrics ? metrics.meanAbsoluteError : 1.84} <span className="text-xs text-slate-500 font-normal">veh</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Variance Bound &lt; 3%</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Grid Bottleneck Risk</span>
            <Zap className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-sans">
            LOW (MITIGATED)
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-semibold">Proactive Timing Ready</div>
        </div>
      </div>

      {/* Proactive Tuning Panel */}
      <ProactiveTuningPanel plan={proactivePlan} onApplyPlan={handleApplyProactive} />

      {/* Multi-Horizon Cards */}
      <TrafficForecasterCard horizons={horizons} metrics={metrics} />

      {/* 24-Hour Diurnal Trendlines */}
      <RushHourTrendComparison curves={curves} />
    </div>
  );
};
