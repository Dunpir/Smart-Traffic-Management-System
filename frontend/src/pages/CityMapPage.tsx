import React, { useState, useEffect, useMemo } from 'react';
import {
  Map,
  Navigation,
  ShieldAlert,
  Radio,
  Activity,
  RefreshCw,
  ChevronRight,
  Network,
  Search,
  Filter,
  AlertTriangle,
  Zap,
  Gauge,
  CheckCircle,
  FileText,
  Sparkles,
} from 'lucide-react';
import { CityGridMapView } from '../components/citymap/CityGridMapView';
import { CityIntersectionNode, CityCorridorRoute, CityIncident, LightState, Direction } from '../types';
import { api } from '../services/api';
import { soundEffects } from '../utils/soundEffects';

export const CityMapPage: React.FC = () => {
  const [intersections, setIntersections] = useState<CityIntersectionNode[]>([]);
  const [routes, setRoutes] = useState<CityCorridorRoute[]>([]);
  const [activeIncidents, setActiveIncidents] = useState<CityIncident[]>([]);
  const [cityData, setCityData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [congestionFilter, setCongestionFilter] = useState<string>('ALL');
  const [incidentsOnly, setIncidentsOnly] = useState<boolean>(false);

  const fetchCityData = async () => {
    setIsLoading(true);
    try {
      const [iRes, rRes] = await Promise.all([
        api.getCityIntersections(),
        api.getCityCorridors(),
      ]);

      if (iRes?.success) {
        setCityData(iRes.data);
        setIntersections(iRes.data.intersections);
        if (iRes.data.incidents) {
          setActiveIncidents(iRes.data.incidents);
        }
      }
      if (rRes?.success) {
        setRoutes(rRes.data);
      }
    } catch (e) {
      console.error('Error fetching city grid data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCityData();
    const interval = setInterval(fetchCityData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Emergency injection handler
  const handleInjectEmergency = async (junctionId: string) => {
    try {
      soundEffects.playEmergencySiren();
      await api.triggerEmergency('WEST', 'AMBULANCE');
      // Also inject an active incident
      const newInc: CityIncident = {
        id: `INC-EM-${Date.now().toString().slice(-4)}`,
        type: 'AMBULANCE_DISPATCH',
        title: `Priority Emergency Vehicle Dispatched @ ${junctionId}`,
        junctionId,
        severity: 'HIGH',
        impactDelayMin: 0,
        reportedAt: new Date().toISOString(),
        description: 'Green wave preemption triggered for emergency transit corridor.',
        active: true,
      };
      setActiveIncidents((prev) => [newInc, ...prev]);
      fetchCityData();
    } catch (e) {
      console.error(e);
    }
  };

  // Junction override handler
  const handleOverrideJunction = async (data: {
    junctionId: string;
    signal?: LightState;
    direction?: Direction;
    cycleLength?: number;
  }) => {
    try {
      await api.overrideCityJunction(data);
      // Optimistically update local intersections
      setIntersections((prev) =>
        prev.map((n) =>
          n.id === data.junctionId
            ? {
                ...n,
                currentSignal: data.signal || n.currentSignal,
                activeDirection: data.direction || n.activeDirection,
                cycleLength: data.cycleLength || n.cycleLength,
              }
            : n
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Incident injection handler
  const handleInjectIncident = async (incidentData: any) => {
    try {
      const res = await api.injectCityIncident(incidentData);
      if (res?.success && res.data) {
        setActiveIncidents((prev) => [res.data, ...prev.filter((i) => i.id !== res.data.id)]);
      } else {
        // Fallback local addition
        const localInc: CityIncident = {
          id: `INC-LOC-${Date.now().toString().slice(-4)}`,
          ...incidentData,
          reportedAt: new Date().toISOString(),
          active: true,
        };
        setActiveIncidents((prev) => [localInc, ...prev]);
      }
      fetchCityData();
    } catch (e) {
      console.error(e);
    }
  };

  // Incident resolution handler
  const handleResolveIncident = async (incidentId: string) => {
    try {
      soundEffects.playSuccess();
      await api.resolveCityIncident(incidentId);
      setActiveIncidents((prev) => prev.filter((i) => i.id !== incidentId));
      fetchCityData();
    } catch (e) {
      console.error(e);
      setActiveIncidents((prev) => prev.filter((i) => i.id !== incidentId));
    }
  };

  // Filtered intersections based on search and filters
  const filteredIntersections = useMemo(() => {
    return intersections.filter((n) => {
      const matchesSearch =
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.locationName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCongestion =
        congestionFilter === 'ALL' || n.congestionLevel === congestionFilter;

      const matchesIncidents = !incidentsOnly || Boolean(n.activeIncident) || n.hasEmergency;

      return matchesSearch && matchesCongestion && matchesIncidents;
    });
  }, [intersections, searchQuery, congestionFilter, incidentsOnly]);

  const totalVehicles = useMemo(() => {
    return intersections.reduce((sum, n) => sum + (n.vehicleCount || 0), 0);
  }, [intersections]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 text-slate-900 dark:text-white transition-colors font-sans">
      {/* Header Banner */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-500/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 shadow-sm">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Metropolitan Grid Topology & Control Center
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-100 text-cyan-800 border border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800">
                DELHI-NCR MESH
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans mt-0.5">
              Real-time multi-junction telemetry, 60 FPS kinetic traffic flow, dynamic Dijkstra green waves, and tactical incident dispatch.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              soundEffects.playClick();
              fetchCityData();
            }}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Map Telemetry</span>
          </button>
        </div>
      </div>

      {/* Active Incidents Alert Ticker (if any incident is ongoing) */}
      {activeIncidents.length > 0 && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-600/40 flex items-center justify-between gap-3 font-mono text-xs animate-fade-in shadow-lg shadow-rose-950/30">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="p-1 rounded bg-rose-950 text-rose-400 border border-rose-600 animate-pulse shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div className="truncate">
              <span className="font-bold text-rose-300 uppercase mr-2">
                ACTIVE INCIDENT DETECTED ({activeIncidents.length}):
              </span>
              <span className="text-slate-300">{activeIncidents[0].title} — </span>
              <span className="text-slate-400 font-sans">{activeIncidents[0].description}</span>
            </div>
          </div>
          <button
            onClick={() => handleResolveIncident(activeIncidents[0].id)}
            className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 text-[11px] font-bold shrink-0 transition cursor-pointer"
          >
            Resolve Alert
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
          <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Online Nodes</span>
            <Radio className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            {intersections.length} / {intersections.length || 9} Online
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            100% Mesh Health • 0 Dropouts
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
          <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Corridors</span>
            <Navigation className="w-3.5 h-3.5 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            {routes.length || 5} Arterial Links
          </div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
            Speed Sync: <strong className="text-cyan-400 font-bold">56 km/h Target</strong>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
          <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Active Vehicle Density</span>
            <Activity className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            {totalVehicles || 342} Vehicles
          </div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
            Metropolitan Network Throughput
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
          <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Green Wave Efficiency</span>
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            94.8%
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            Zero-Stop Waveband Active
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search intersections by name, code (e.g. CP-01, CYB-03, AIIMS)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none text-xs font-sans"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Congestion:</span>
          </div>
          <select
            value={congestionFilter}
            onChange={(e) => setCongestionFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 text-xs focus:outline-none"
          >
            <option value="ALL">All Levels</option>
            <option value="LOW">Low Only</option>
            <option value="MEDIUM">Medium Only</option>
            <option value="HIGH">High Only</option>
            <option value="CRITICAL">Critical Only</option>
          </select>

          <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 cursor-pointer ml-2">
            <input
              type="checkbox"
              checked={incidentsOnly}
              onChange={(e) => setIncidentsOnly(e.target.checked)}
              className="accent-rose-500 rounded"
            />
            <span>Incidents Only</span>
          </label>
        </div>
      </div>

      {/* Main Interactive Map Canvas Card */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
        <CityGridMapView
          intersections={filteredIntersections.length > 0 ? filteredIntersections : intersections}
          routes={routes}
          activeIncidents={activeIncidents}
          onInjectEmergency={handleInjectEmergency}
          onOverrideJunction={handleOverrideJunction}
          onInjectIncident={handleInjectIncident}
          onResolveIncident={handleResolveIncident}
        />
      </div>
    </div>
  );
};
