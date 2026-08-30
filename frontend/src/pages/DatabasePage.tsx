import React, { useState, useEffect } from 'react';
import {
  Database,
  Play,
  RotateCcw,
  Layers,
  Network,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Terminal,
  Clock,
  Sparkles,
} from 'lucide-react';
import { DatabaseStatus } from '../types';
import { api } from '../services/api';
import { InteractiveGraphCanvas } from '../components/database/InteractiveGraphCanvas';
import { soundEffects } from '../utils/soundEffects';

interface DatabasePageProps {
  dbStatus: DatabaseStatus | null;
}

export const DatabasePage: React.FC<DatabasePageProps> = ({ dbStatus }) => {
  const [stats, setStats] = useState<any>({
    junctions: 1,
    roads: 4,
    sensors: 8,
    cameras: 4,
    irSensors: 4,
    signals: 4,
    vehicleCounts: 4,
    signalTimings: 1,
    emergencyEvents: 0,
  });

  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({
    nodes: [],
    links: [],
  });

  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  // Cypher Query Runner state
  const [cypherQuery, setCypherQuery] = useState<string>(
    'MATCH (j:Junction)-[:HAS_ROAD]->(r:Road)-[:HAS_CAMERA]->(c:Camera) RETURN j.name, r.direction, c.name, c.resolution'
  );
  const [queryResult, setQueryResult] = useState<any | null>(null);
  const [isQuerying, setIsQuerying] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, graphRes, eventsRes] = await Promise.all([
        api.getDatabaseStats(),
        api.getDatabaseGraph(),
        api.getDatabaseEvents(),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (graphRes.success) setGraphData({ nodes: graphRes.nodes, links: graphRes.links || [] });
      if (eventsRes.success) setRecentEvents(eventsRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunCypher = async () => {
    soundEffects.playClick();
    try {
      setIsQuerying(true);
      const res = await api.executeCypher(cypherQuery);
      setQueryResult(res);
    } catch (e: any) {
      setQueryResult({ success: false, error: e.message });
    } finally {
      setIsQuerying(false);
    }
  };

  const presetQueries = [
    {
      label: '1. Get Junction & 4 Connected Roads',
      query: 'MATCH (j:Junction)-[:HAS_ROAD]->(r:Road) RETURN j.name, r.roadId, r.direction, r.lanes',
    },
    {
      label: '2. Total & Disjoint Sensor Specialization',
      query: 'MATCH (s:Sensor) RETURN s.sensorId, s.name, s.type, labels(s) AS labels, s.status ORDER BY s.type',
    },
    {
      label: '3. Recent Vehicle Count Observations',
      query: 'MATCH (c:Camera)-[:RECORDED_COUNT]->(vc:VehicleCount) RETURN c.sensorId, vc.count, vc.densityLevel, vc.timestamp ORDER BY vc.timestamp DESC LIMIT 10',
    },
    {
      label: '4. Dynamic Signal Timing Allocations',
      query: 'MATCH (s:Signal)-[:HAS_TIMING]->(st:SignalTiming) RETURN s.direction, st.greenDuration, st.reason, st.appliedAt ORDER BY st.appliedAt DESC LIMIT 10',
    },
    {
      label: '5. Emergency Vehicle Priority Events',
      query: 'MATCH (s:Sensor)-[:DETECTED_EMERGENCY]->(e:EmergencyEvent)-[:AFFECTS_JUNCTION]->(j:Junction) RETURN e.eventId, e.vehicleType, e.priorityLevel, e.detectedAt, e.status',
    },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 text-slate-900 dark:text-white transition-colors">
      {/* Header Banner */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Neo4j Graph Database Explorer
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans mt-0.5">
              Live graph schema, entities, total/disjoint specialization, and Cypher query transaction engine.
            </p>
          </div>
        </div>

        {/* Database Live Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold border ${
            dbStatus?.connected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          {dbStatus?.connected ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>NEO4J CONNECTED ({dbStatus.latencyMs}ms)</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>DATABASE OFFLINE (FALLBACK)</span>
            </>
          )}
        </div>
      </div>

      {/* Database Entity Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono text-xs">
        <div className="p-2.5 rounded bg-white/90 dark:bg-[#0a0a0a]/75 border border-slate-200 dark:border-[#1f1f23] text-center shadow-xs">
          <span className="text-slate-500 dark:text-zinc-500 block text-[9px] uppercase">Junctions</span>
          <span className="text-base font-bold text-slate-900 dark:text-white">{stats.junctions}</span>
        </div>
        <div className="p-2.5 rounded bg-white/90 dark:bg-[#0a0a0a]/75 border border-slate-200 dark:border-[#1f1f23] text-center shadow-xs">
          <span className="text-slate-500 dark:text-zinc-500 block text-[9px] uppercase">Roads</span>
          <span className="text-base font-bold text-slate-900 dark:text-white">{stats.roads}</span>
        </div>
        <div className="p-2.5 rounded bg-white/90 dark:bg-[#0a0a0a]/75 border border-slate-200 dark:border-[#1f1f23] text-center shadow-xs">
          <span className="text-slate-500 dark:text-zinc-500 block text-[9px] uppercase">Cameras</span>
          <span className="text-base font-bold text-slate-900 dark:text-white">{stats.cameras}</span>
        </div>
        <div className="p-2.5 rounded bg-white/90 dark:bg-[#0a0a0a]/75 border border-slate-200 dark:border-[#1f1f23] text-center shadow-xs">
          <span className="text-slate-500 dark:text-zinc-500 block text-[9px] uppercase">IR Sensors</span>
          <span className="text-base font-bold text-slate-900 dark:text-white">{stats.irSensors}</span>
        </div>
        <div className="p-2.5 rounded bg-white/90 dark:bg-[#0a0a0a]/75 border border-slate-200 dark:border-[#1f1f23] text-center shadow-xs">
          <span className="text-slate-500 dark:text-zinc-500 block text-[9px] uppercase">Signals</span>
          <span className="text-base font-bold text-slate-900 dark:text-white">{stats.signals}</span>
        </div>
        <div className="p-2.5 rounded bg-white/90 dark:bg-[#0a0a0a]/75 border border-slate-200 dark:border-[#1f1f23] text-center shadow-xs">
          <span className="text-slate-500 dark:text-zinc-500 block text-[9px] uppercase">Counts</span>
          <span className="text-base font-bold text-slate-900 dark:text-white">{stats.vehicleCounts}</span>
        </div>
        <div className="p-2.5 rounded bg-white/90 dark:bg-[#0a0a0a]/75 border border-slate-200 dark:border-[#1f1f23] text-center shadow-xs">
          <span className="text-slate-500 dark:text-zinc-500 block text-[9px] uppercase">Timings</span>
          <span className="text-base font-bold text-slate-900 dark:text-white">{stats.signalTimings}</span>
        </div>
        <div className="p-2.5 rounded bg-white/90 dark:bg-[#0a0a0a]/75 border border-slate-200 dark:border-[#1f1f23] text-center shadow-xs">
          <span className="text-slate-500 dark:text-zinc-500 block text-[9px] uppercase">Emergency</span>
          <span className="text-base font-bold text-slate-900 dark:text-white">{stats.emergencyEvents}</span>
        </div>
      </div>

      {/* Interactive Graph Canvas Card */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
          Interactive Neo4j Spatial Graph
        </h3>
        <InteractiveGraphCanvas
          nodes={graphData.nodes}
          links={graphData.links}
          selectedNode={selectedNode}
          onSelectNode={(node) => setSelectedNode(node)}
        />
      </div>

      {/* Cypher Query Runner Card */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-[#1f1f23]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span>Cypher Transaction Console</span>
          </h3>
        </div>

        {/* Preset Query Chips */}
        <div className="flex flex-wrap gap-1.5 font-mono text-xs">
          {presetQueries.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                soundEffects.playClick();
                setCypherQuery(p.query);
              }}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 transition cursor-pointer text-[10px]"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Query Input */}
        <div className="relative">
          <textarea
            value={cypherQuery}
            onChange={(e) => setCypherQuery(e.target.value)}
            rows={3}
            className="w-full p-2.5 rounded bg-slate-50 dark:bg-black border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-emerald-400 font-mono text-xs focus:outline-none"
          />
        </div>

        <button
          onClick={handleRunCypher}
          disabled={isQuerying}
          className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Execute Cypher Query</span>
        </button>

        {queryResult && (
          <pre className="p-3 rounded bg-slate-950 text-slate-300 font-mono text-[11px] overflow-x-auto max-h-60 border border-slate-800">
            {JSON.stringify(queryResult, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
