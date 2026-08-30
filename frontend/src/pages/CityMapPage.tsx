import React, { useState, useEffect } from 'react';
import { Map, Navigation, ShieldAlert, Radio, Activity, RefreshCw, ChevronRight, Network } from 'lucide-react';
import { CityGridMapView } from '../components/citymap/CityGridMapView';
import { CityIntersectionNode, CityCorridorRoute } from '../types';
import { api } from '../services/api';
import { soundEffects } from '../utils/soundEffects';

export const CityMapPage: React.FC = () => {
  const [intersections, setIntersections] = useState<CityIntersectionNode[]>([]);
  const [routes, setRoutes] = useState<CityCorridorRoute[]>([]);
  const [cityData, setCityData] = useState<any>(null);

  const fetchCityData = async () => {
    try {
      const [iRes, rRes] = await Promise.all([
        api.getCityIntersections(),
        api.getCityCorridors(),
      ]);

      if (iRes?.success) {
        setCityData(iRes.data);
        setIntersections(iRes.data.intersections);
      }
      if (rRes?.success) {
        setRoutes(rRes.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCityData();
    const interval = setInterval(fetchCityData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleInjectEmergency = async (junctionId: string) => {
    try {
      soundEffects.playEmergencySiren();
      await api.triggerEmergency('WEST', 'AMBULANCE');
      fetchCityData();
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
            <Map className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Metropolitan Grid Topology
              </h1>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-[#141417] dark:text-zinc-400 dark:border-[#222226]">
                Delhi-NCR
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans mt-0.5">
              Interconnected metropolitan intersections across the Delhi-NCR grid with synchronized corridors.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            soundEffects.playClick();
            fetchCityData();
          }}
          className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Map</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
          <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Online Nodes</span>
            <Radio className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            {intersections.length} / 7
          </div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono mt-0.5">100% Mesh Health</div>
        </div>

        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
          <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Corridors</span>
            <Navigation className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-300" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            {routes.length} Active
          </div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono mt-0.5">Speed Sync: 54 km/h</div>
        </div>

        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
          <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Active Density</span>
            <Activity className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            {cityData?.aggregateStats?.totalVehiclesInCity || 286}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono mt-0.5">Vehicles Monitored</div>
        </div>

        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
          <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Graph Health</span>
            <Network className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            100%
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">Neo4j Spatial Ready</div>
        </div>
      </div>

      {/* Interactive Map Canvas Card */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
        <CityGridMapView
          intersections={intersections}
          routes={routes}
          onInjectEmergency={handleInjectEmergency}
        />
      </div>
    </div>
  );
};
