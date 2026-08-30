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
    <div className="space-y-5 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider">
              Traffic Flow Analytics &amp; History
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated queue observations, signal phase allocations, and emergency pre-emption audit metrics.
          </p>
        </div>

        {/* Filter & Export Deck */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {onOpenAuditReport && (
            <button
              onClick={onOpenAuditReport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20 transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate PDF Audit Report</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <select
              value={selectedRoad}
              onChange={(e) => setSelectedRoad(e.target.value)}
              className="bg-transparent text-slate-800 outline-none"
            >
              <option value="ALL">All 4 Approaches</option>
              <option value="R001">North Road (R001)</option>
              <option value="R002">South Road (R002)</option>
              <option value="R003">East Road (R003)</option>
              <option value="R004">West Road (R004)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Smart City Eco & Carbon Footprint Card */}
      <EcoFootprintCard
        ecoMetrics={calculateEcoMetrics(
          roadStats.reduce((acc, r) => acc + (r.currentCount || 0), 0) || 28,
          26
        )}
      />

      {/* Road Volume Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {roadStats.map((road) => (
          <div
            key={road.roadId}
            className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-800 uppercase">{road.name}</span>
                <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-mono font-bold">
                  {road.roadId}
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mb-1">
                {road.currentCount} <span className="text-xs font-normal text-slate-400">live</span>
              </div>
              <div className="text-xs text-indigo-700 font-medium flex items-center justify-between">
                <span>Avg: {road.averageVehicles} veh</span>
                <span>Peak: {road.peakVehicles} veh</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
              <span>Status:</span>
              <span className="text-emerald-700 font-bold">{road.density}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Vehicle Count Over Time Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Vehicle Counts Over Time (Real-Time Timeseries Feed)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Last {timeseries.length} telemetry samples
          </span>
        </div>

        {/* Visual Bar Spectrum */}
        <div className="min-h-[160px] p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-end gap-1.5 overflow-x-auto">
          {timeseries.length === 0 ? (
            <div className="w-full text-center text-xs font-mono text-slate-400 py-10">
              Collecting vehicle stream observations...
            </div>
          ) : (
            timeseries.map((pt, i) => {
              const heightPercent = Math.min(100, Math.max(10, (pt.count / 50) * 100));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-[28px] group">
                  <span className="text-[9px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {pt.count}
                  </span>
                  <div
                    className={`w-full rounded-t transition-all ${
                      pt.density === 'VERY HIGH'
                        ? 'bg-rose-500'
                        : pt.density === 'HIGH'
                        ? 'bg-amber-400'
                        : pt.density === 'MEDIUM'
                        ? 'bg-indigo-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ height: `${heightPercent}%`, minHeight: '12px' }}
                    title={`${pt.roadId}: ${pt.count} vehicles (${pt.density}) at ${pt.timeLabel}`}
                  />
                  <span className="text-[8px] font-mono text-slate-400 truncate w-full text-center">
                    {pt.roadId}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Grid: Signal Timing Log & Emergency Event Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Signal Timing Allocations */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Signal Timing Phase History</span>
              </h3>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {timingHistory.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6 font-mono">
                  No signal transitions logged yet.
                </div>
              ) : (
                timingHistory.map((t) => (
                  <div
                    key={t.timingId}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-800 font-bold mb-1">
                      <span>{t.direction} ROAD ({t.signalId})</span>
                      <span className="text-emerald-700 font-bold">{t.greenDuration}s GREEN</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{t.reason}</p>
                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between font-mono">
                      <span>Mode: {t.mode}</span>
                      <span>{t.timeFormatted}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Emergency Response Latency & History */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Siren className="w-4 h-4 text-rose-600" />
                <span>Emergency Pre-emption History</span>
              </h3>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {emergencyHistory.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6 font-mono">
                  No emergency overrides triggered yet.
                </div>
              ) : (
                emergencyHistory.map((emg) => (
                  <div
                    key={emg.eventId}
                    className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs"
                  >
                    <div className="flex items-center justify-between text-rose-900 font-bold mb-1">
                      <span>🚨 {emg.vehicleType}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-rose-600 text-white">
                        {emg.direction} ROAD
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-800">{emg.actionTaken}</p>
                    <div className="text-[10px] text-rose-600 mt-1 flex justify-between font-mono">
                      <span>Sensor: {emg.sensorId}</span>
                      <span>{new Date(emg.detectedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
