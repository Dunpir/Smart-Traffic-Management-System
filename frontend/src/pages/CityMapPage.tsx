import React, { useState, useEffect } from 'react';
import { Map, Navigation, ShieldAlert, Radio, Activity, RefreshCw, ChevronRight, Network } from 'lucide-react';
import { CityGridMapView } from '../components/citymap/CityGridMapView';
import { CityIntersectionNode, CityCorridorRoute } from '../types';
import { api } from '../services/api';
import { Button } from '@/components/ui/button';

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
      await api.triggerEmergency('WEST', 'AMBULANCE');
      fetchCityData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="eyebrow-pill flex items-center gap-1.5 text-slate-700">
              <span>METROPOLITAN GRID TOPOLOGY</span>
              <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight bg-gradient-to-br from-slate-900 from-30% to-slate-600 bg-clip-text text-transparent mt-1">
            City Intersections Network Map
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Interconnected metropolitan intersections across the Delhi-NCR grid with synchronized corridors.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchCityData}
          className="rounded-2xl text-xs font-bold border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 gap-1.5 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
          <span>Sync Map</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Online Nodes</span>
            <Radio className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-sans">
            {intersections.length} / 7
          </div>
          <div className="text-[11px] text-slate-500 mt-1">100% Mesh Health</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Green Wave Corridors</span>
            <Navigation className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900 mt-1 font-sans">
            {routes.length} Active
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Speed Sync: 54 km/h</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Average Congestion</span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1 font-sans">
            {cityData ? cityData.networkCongestionAverage : '48.6%'}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-semibold">Free-Flow Transit</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Graph Backbone</span>
            <Network className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-1 font-sans">
            Neo4j Live
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Dijkstra Shortest Path</div>
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <CityGridMapView
        intersections={intersections}
        routes={routes}
        onInjectEmergency={handleInjectEmergency}
      />

      {/* Corridors Grid */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-teal-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Synchronized Metropolitan Arterial Routes
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {routes.map((r) => (
            <div key={r.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{r.name}</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold border border-teal-200">
                  {r.id}
                </span>
              </div>

              <div className="text-slate-600 flex items-center gap-1.5 text-xs font-mono">
                <span>{r.from}</span>
                <span>→</span>
                <span>{r.via.join(' → ') || 'Direct'}</span>
                <span>→</span>
                <span>{r.to}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px]">
                <span className="text-slate-500">Distance: {r.totalDistanceKm} km</span>
                <span className="text-emerald-700 font-bold">Avg {r.averageSpeedKmh} km/h</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
