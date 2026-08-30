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

  const getNodeColor = (group: string) => {
    switch (group) {
      case 'junction':
        return 'bg-cyan-500 text-cyan-950 border-cyan-300';
      case 'road':
        return 'bg-blue-600 text-white border-blue-400';
      case 'camera':
        return 'bg-red-600 text-white border-red-400';
      case 'irSensor':
        return 'bg-amber-500 text-amber-950 border-amber-300';
      case 'signal':
        return 'bg-emerald-500 text-emerald-950 border-emerald-300';
      case 'vehicleCount':
        return 'bg-slate-700 text-slate-200 border-slate-500';
      case 'signalTiming':
        return 'bg-teal-600 text-white border-teal-400';
      case 'emergency':
        return 'bg-rose-600 text-white border-rose-400 animate-pulse';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              Neo4j Graph Database Explorer
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Live graph schema, entities, total/disjoint specialization, and Cypher query transaction engine.
          </p>
        </div>

        {/* Database Live Status Badge */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
            dbStatus?.connected
              ? 'bg-emerald-950/70 border-emerald-600/70 text-emerald-300 shadow-lg shadow-emerald-950/50'
              : 'bg-rose-950/70 border-rose-600/70 text-rose-300 shadow-lg shadow-rose-950/50'
          }`}
        >
          {dbStatus?.connected ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>NEO4J CONNECTED ({dbStatus.latencyMs}ms)</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>DATABASE OFFLINE (FALLBACK ACTIVE)</span>
            </>
          )}
        </div>
      </div>

      {/* Database Entity Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs font-mono">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-slate-400 block text-[10px] uppercase">Junctions</span>
          <span className="text-lg font-extrabold text-cyan-400">{stats.junctions}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-slate-400 block text-[10px] uppercase">Roads</span>
          <span className="text-lg font-extrabold text-blue-400">{stats.roads}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-slate-400 block text-[10px] uppercase">Cameras</span>
          <span className="text-lg font-extrabold text-red-400">{stats.cameras}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-slate-400 block text-[10px] uppercase">IR Sensors</span>
          <span className="text-lg font-extrabold text-amber-400">{stats.irSensors}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-slate-400 block text-[10px] uppercase">Signals</span>
          <span className="text-lg font-extrabold text-emerald-400">{stats.signals}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-slate-400 block text-[10px] uppercase">Counts</span>
          <span className="text-lg font-extrabold text-slate-200">{stats.vehicleCounts}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-slate-400 block text-[10px] uppercase">Timings</span>
          <span className="text-lg font-extrabold text-teal-400">{stats.signalTimings}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-slate-400 block text-[10px] uppercase">Emergencies</span>
          <span className="text-lg font-extrabold text-rose-400">{stats.emergencyEvents}</span>
        </div>
      </div>

      {/* Interactive Force-Directed Graph Explorer */}
      <InteractiveGraphCanvas
        nodes={graphData.nodes}
        links={graphData.links}
        onSelectNode={setSelectedNode}
        selectedNode={selectedNode}
      />

      {/* Node Property Inspector Modal/Drawer */}
      {selectedNode && (
        <div className="glass-panel p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/40 text-xs font-mono animate-fadeIn shadow-xl">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold uppercase">
                :{selectedNode.label || selectedNode.group}
              </span>
              <span className="font-bold text-white text-sm">
                {selectedNode.name || selectedNode.id}
              </span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              ✕ Close Inspector
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">
                Neo4j Graph Properties:
              </span>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 overflow-x-auto text-[11px] leading-relaxed">
                {JSON.stringify(selectedNode.properties, null, 2)}
              </pre>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">
                Live Subgraph Cypher Query:
              </span>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 space-y-2">
                <code className="text-[11px] text-amber-300 block">
                  MATCH (n:{selectedNode.label || selectedNode.group} &#123;id: '{selectedNode.id}'&#125;)-[r]-(m) RETURN n, r, m
                </code>
                <button
                  onClick={() => {
                    setCypherQuery(`MATCH (n:${selectedNode.label || selectedNode.group})-[r]-(m) WHERE n.id = '${selectedNode.id}' OR id(n) = ${selectedNode.id} RETURN n, r, m LIMIT 25`);
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold"
                >
                  Load into Query Runner &darr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cypher Query Runner Deck */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
              Raw Cypher Query Runner &amp; Verification
            </h3>
          </div>
          <button
            onClick={handleRunCypher}
            disabled={isQuerying}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-md transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>EXECUTE CYPHER</span>
          </button>
        </div>

        {/* Preset Queries Dropdown */}
        <div className="mb-3">
          <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Preset Academic Evaluation Queries:
          </label>
          <select
            onChange={(e) => setCypherQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300"
          >
            {presetQueries.map((q, idx) => (
              <option key={idx} value={q.query}>
                {q.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cypher Editor Textarea */}
        <div className="mb-4">
          <textarea
            rows={3}
            value={cypherQuery}
            onChange={(e) => setCypherQuery(e.target.value)}
            placeholder="MATCH (n) RETURN n LIMIT 25"
            className="w-full p-3 rounded-xl bg-black/90 border border-slate-800 text-xs font-mono text-emerald-400 focus:border-cyan-500 focus:outline-none leading-relaxed"
          />
        </div>

        {/* Query Results Viewer */}
        {queryResult && (
          <div className="p-4 rounded-xl bg-black/90 border border-slate-800 text-xs font-mono">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
              <span>Execution Target: <strong className="text-white">{queryResult.executedOn || 'NEO4J'}</strong></span>
              <span>{queryResult.records?.length ?? 0} records returned</span>
            </div>
            <pre className="text-slate-200 overflow-x-auto max-h-48">
              {JSON.stringify(queryResult.records || queryResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Recent Database Events Stream */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
              Recent Database Events &amp; Transactions
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Live Write Stream</span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {recentEvents.length === 0 ? (
            <div className="text-xs font-mono text-slate-500 text-center py-6">
              Awaiting incoming database transactions...
            </div>
          ) : (
            recentEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-400 text-[10px]">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                  <div>
                    <div className="font-bold text-white">{evt.title}</div>
                    <div className="text-[11px] text-slate-400">{evt.detail}</div>
                  </div>
                </div>

                {evt.cypherSnippet && (
                  <span className="text-[10px] text-cyan-400/80 bg-slate-800/60 px-2 py-0.5 rounded truncate max-w-xs">
                    {evt.cypherSnippet}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
