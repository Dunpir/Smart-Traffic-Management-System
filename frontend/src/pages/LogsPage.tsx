import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Trash2,
  Download,
  Filter,
  RefreshCw,
  Cpu,
  Database,
  Sliders,
  Siren,
  ShieldCheck,
} from 'lucide-react';
import { SystemLog } from '../types';
import { api } from '../services/api';
import { soundEffects } from '../utils/soundEffects';

export const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [filterType]);

  const fetchLogs = async () => {
    try {
      const res = await api.getLogs(150, filterType === 'ALL' ? undefined : filterType);
      if (res.success) {
        setLogs(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClear = async () => {
    try {
      soundEffects.playClick();
      setLoading(true);
      await api.clearLogs();
      setLogs([]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = () => {
    soundEffects.playClick();
    const textContent = logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.level}] [${l.eventType}] [${l.source}] Junction: ${l.junctionId} Road: ${
            l.roadId || 'N/A'
          } - ${l.description}`
      )
      .join('\n');

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_audit_logs_${Date.now()}.log`;
    a.click();
  };

  const getLevelBadge = (level: SystemLog['level']) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800 font-bold';
      case 'ERROR':
        return 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-800 font-bold';
      case 'WARNING':
        return 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 font-bold';
      case 'SUCCESS':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800';
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 text-slate-900 dark:text-white transition-colors">
      {/* Header Banner */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              System Audit &amp; Event Logs
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans mt-0.5">
              Real-time immutable audit trail for hardware telemetries, database commits, and manual overrides.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Filter Type */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2 py-1 rounded bg-white dark:bg-[#141418] border border-slate-300 dark:border-zinc-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Event Types</option>
              <option value="SENSOR_READ">Sensor Reads</option>
              <option value="SIGNAL_CHANGE">Signal Changes</option>
              <option value="EMERGENCY_OVERRIDE">Emergency Overrides</option>
              <option value="MANUAL_OVERRIDE">Manual Commands</option>
            </select>
          </div>

          <button
            onClick={exportLogs}
            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 flex items-center gap-1 transition cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Export</span>
          </button>

          <button
            onClick={handleClear}
            disabled={loading}
            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 flex items-center gap-1 transition cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Logs Table Card */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 text-left">
                <th className="pb-2">Timestamp</th>
                <th className="pb-2">Level</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Source</th>
                <th className="pb-2">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="py-2 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                    {l.timestamp?.split('T')[1]?.slice(0, 8) || 'Live'}
                  </td>
                  <td className="py-2">
                    <span className={`px-1.5 py-0.2 rounded border text-[9px] ${getLevelBadge(l.level)}`}>
                      {l.level}
                    </span>
                  </td>
                  <td className="py-2 font-bold text-slate-900 dark:text-white">{l.eventType}</td>
                  <td className="py-2 text-slate-500 dark:text-zinc-400">{l.source}</td>
                  <td className="py-2 text-slate-700 dark:text-zinc-300">{l.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
