import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Filter,
  Clock,
  Siren,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { api } from '../services/api';
import { EcoFootprintCard } from '../components/eco/EcoFootprintCard';
import { calculateEcoMetrics } from '../utils/ecoCalculator';
import { soundEffects } from '../utils/soundEffects';

interface AnalyticsPageProps {
  onOpenAuditReport?: () => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onOpenAuditReport }) => {
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [roadStats, setRoadStats] = useState<any[]>([]);
  const [timingHistory, setTimingHistory] = useState<any[]>([]);
  const [emergencyHistory, setEmergencyHistory] = useState<any[]>([]);
  const [selectedRoad, setSelectedRoad] = useState<string>('ALL');

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 5000);
    return () => clearInterval(interval);
  }, [selectedRoad]);

  const fetchAnalytics = async () => {
    try {
      const roadId = selectedRoad === 'ALL' ? undefined : selectedRoad;
      const [tsRes, roadsRes, timingRes, emgRes] = await Promise.all([
        api.getTimeseries(roadId),
        api.getRoadComparison(),
        api.getSignalTimingHistory(),
        api.getEmergencyHistory(),
      ]);

      if (tsRes.success) setTimeseries(tsRes.data);
      if (roadsRes.success) setRoadStats(roadsRes.data);
      if (timingRes.success) setTimingHistory(timingRes.data);
      if (emgRes.success) setEmergencyHistory(emgRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const exportData = (format: 'JSON' | 'CSV') => {
    soundEffects.playClick();
    const dataToExport = {
      junction: 'J001',
      exportedAt: new Date().toISOString(),
      timeseries,
      roadStats,
      timingHistory,
      emergencyHistory,
    };

    if (format === 'JSON') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `traffic_analytics_${Date.now()}.json`;
      a.click();
    } else {
      const headers = 'Timestamp,RoadId,VehicleCount,Density,Congestion\n';
      const rows = timeseries
        .map((t) => `${t.timestamp},${t.roadId},${t.count},${t.density},${t.congestion}`)
        .join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `traffic_timeseries_${Date.now()}.csv`;
      a.click();
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 text-slate-900 dark:text-white transition-colors">
      {/* Header Banner */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Traffic Flow Analytics &amp; History
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans mt-0.5">
              Aggregated queue observations, signal phase allocations, and emergency pre-emption audit metrics.
            </p>
          </div>
        </div>

        {/* Filter & Export Deck */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {onOpenAuditReport && (
            <button
              onClick={() => {
                soundEffects.playClick();
                onOpenAuditReport();
              }}
              className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download Audit Report</span>
            </button>
          )}

          {/* Road Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <select
              value={selectedRoad}
              onChange={(e) => setSelectedRoad(e.target.value)}
              className="px-2 py-1 rounded bg-white dark:bg-[#141418] border border-slate-300 dark:border-zinc-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Approaches</option>
              <option value="NORTH">North Approach</option>
              <option value="SOUTH">South Approach</option>
              <option value="EAST">East Approach</option>
              <option value="WEST">West Approach</option>
            </select>
          </div>

          {/* Export CSV / JSON */}
          <button
            onClick={() => exportData('CSV')}
            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 flex items-center gap-1 transition cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => exportData('JSON')}
            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 flex items-center gap-1 transition cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* 4 Approach Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {roadStats.map((r) => (
          <div
            key={r.roadId}
            className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                {r.direction} APPROACH
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500">
                {r.roadId}
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                <span>Avg Queue:</span>
                <strong className="text-slate-900 dark:text-white">{r.avgCount} veh</strong>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                <span>Max Spike:</span>
                <strong className="text-slate-900 dark:text-white">{r.maxCount} veh</strong>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                <span>Peak Congestion:</span>
                <strong className="text-slate-900 dark:text-white">{r.avgCongestion}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2-Column Tables: Signal Timing Log & Emergency Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Signal Timing Allocation Log */}
        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200 dark:border-[#1f1f23]">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span>Signal Timing Execution Log</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500">
              {timingHistory.length} Cycles Logged
            </span>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 text-left">
                  <th className="pb-1.5">Time</th>
                  <th className="pb-1.5">Dir</th>
                  <th className="pb-1.5">Duration</th>
                  <th className="pb-1.5">Queue</th>
                  <th className="pb-1.5">Algorithm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                {timingHistory.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="py-1.5 text-slate-500 dark:text-zinc-400">{t.timestamp?.split('T')[1]?.slice(0, 8) || 'Live'}</td>
                    <td className="py-1.5 font-bold text-slate-900 dark:text-white">{t.direction}</td>
                    <td className="py-1.5 text-slate-700 dark:text-zinc-300">{t.duration}s</td>
                    <td className="py-1.5 text-slate-700 dark:text-zinc-300">{t.vehicleCount} veh</td>
                    <td className="py-1.5 text-slate-500 dark:text-zinc-400">{t.mode || 'ADAPTIVE'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Emergency Pre-emption History Log */}
        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200 dark:border-[#1f1f23]">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Siren className="w-3.5 h-3.5 text-red-500" />
              <span>Emergency Pre-emption History</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500">
              {emergencyHistory.length} Pre-emptions
            </span>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 text-left">
                  <th className="pb-1.5">Time</th>
                  <th className="pb-1.5">Vehicle</th>
                  <th className="pb-1.5">Approach</th>
                  <th className="pb-1.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                {emergencyHistory.map((e, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="py-1.5 text-slate-500 dark:text-zinc-400">{e.timestamp?.split('T')[1]?.slice(0, 8) || 'Live'}</td>
                    <td className="py-1.5 font-bold text-slate-900 dark:text-white">{e.vehicleType}</td>
                    <td className="py-1.5 text-slate-700 dark:text-zinc-300">{e.direction}</td>
                    <td className="py-1.5 text-emerald-600 dark:text-emerald-400 font-bold">{e.status || 'CLEARED'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
