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
        return 'bg-rose-950 text-rose-300 border-rose-800 font-black animate-pulse';
      case 'ERROR':
        return 'bg-red-950 text-red-400 border-red-800 font-bold';
      case 'WARNING':
        return 'bg-amber-950 text-amber-300 border-amber-800 font-bold';
      case 'SUCCESS':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800 font-bold';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              System Audit &amp; Event Logs
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time immutable audit trail for hardware telemetries, database commits, and manual overrides.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-slate-200 outline-none font-mono"
            >
              <option value="ALL">All Event Types</option>
              <option value="HARDWARE">Hardware Layer</option>
              <option value="CONTROLLER">Traffic Engine</option>
              <option value="DATABASE">Neo4j Database</option>
              <option value="EMERGENCY">Emergency Priority</option>
              <option value="SIMULATION">Simulator Feed</option>
              <option value="MANUAL">Manual Overrides</option>
            </select>
          </div>

          <button
            onClick={exportLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT LOGS</span>
          </button>

          <button
            onClick={handleClear}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      {/* Log Terminal Screen */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-black/90">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE AUDIT STREAM ({logs.length} ENTRIES)</span>
          </div>
          <span>Auto-polling active</span>
        </div>

        <div className="space-y-1.5 max-h-[550px] overflow-y-auto font-mono text-xs pr-1">
          {logs.length === 0 ? (
            <div className="text-center text-slate-600 py-16">
              No audit logs recorded yet.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-900/60 border border-slate-900 hover:border-slate-800 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500 text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>

                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] border ${getLevelBadge(
                      log.level
                    )}`}
                  >
                    {log.level}
                  </span>

                  <span className="px-1.5 py-0.2 rounded bg-slate-900 text-cyan-300 text-[10px] border border-slate-800">
                    {log.eventType}
                  </span>

                  <span className="text-slate-200">{log.description}</span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 shrink-0">
                  <span>Src: {log.source}</span>
                  {log.roadId && <span>• {log.roadId}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
