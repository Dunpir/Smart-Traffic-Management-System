import React, { useState, useEffect } from 'react';
import { CorridorVisualizer } from '../components/corridor/CorridorVisualizer';
import {
  CorridorJunction,
  GreenWaveConfig,
  LightState,
} from '../types';
import {
  Navigation,
  Zap,
  ShieldAlert,
  TrendingDown,
} from 'lucide-react';

export const CorridorPage: React.FC = () => {
  const [config, setConfig] = useState<GreenWaveConfig>({
    enabled: true,
    targetSpeedKmh: 45,
    platoonSize: 28,
    corridorDirection: 'EAST_BOUND',
    activeEmergencyCorridor: false,
    waveProgressPercent: 35,
  });

  const [junctions, setJunctions] = useState<CorridorJunction[]>([
    {
      junctionId: 'J001',
      name: 'Central Avenue Hub',
      distanceMeters: 0,
      currentSignal: 'GREEN',
      phaseTimeRemaining: 24,
      phaseDuration: 45,
      vehicleCount: 34,
      offsetDelaySec: 0,
      queueLength: 6,
      speedLimitKmh: 50,
    },
    {
      junctionId: 'J002',
      name: 'Tech Park Gateway',
      distanceMeters: 450,
      currentSignal: 'YELLOW',
      phaseTimeRemaining: 4,
      phaseDuration: 40,
      vehicleCount: 22,
      offsetDelaySec: 36,
      queueLength: 4,
      speedLimitKmh: 50,
    },
    {
      junctionId: 'J003',
      name: 'Airport Expressway Arterial',
      distanceMeters: 1050,
      currentSignal: 'RED',
      phaseTimeRemaining: 18,
      phaseDuration: 50,
      vehicleCount: 19,
      offsetDelaySec: 84,
      queueLength: 5,
      speedLimitKmh: 60,
    },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setJunctions((prev) =>
        prev.map((j) => {
          let nextRemaining = j.phaseTimeRemaining - 1;
          let nextSignal: LightState = j.currentSignal;

          if (config.activeEmergencyCorridor) {
            return { ...j, currentSignal: 'GREEN', phaseTimeRemaining: 45 };
          }

          if (nextRemaining <= 0) {
            if (j.currentSignal === 'GREEN') {
              nextSignal = 'YELLOW';
              nextRemaining = 4;
            } else if (j.currentSignal === 'YELLOW') {
              nextSignal = 'RED';
              nextRemaining = 25;
            } else {
              nextSignal = 'GREEN';
              nextRemaining = j.phaseDuration;
            }
          }

          return {
            ...j,
            currentSignal: nextSignal,
            phaseTimeRemaining: nextRemaining,
          };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [config.activeEmergencyCorridor]);

  const handleToggleGreenWave = () => {
    setConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleAdjustSpeed = (speed: number) => {
    setConfig((prev) => ({ ...prev, targetSpeedKmh: speed }));
  };

  const handleTriggerEmergency = () => {
    setConfig((prev) => ({
      ...prev,
      activeEmergencyCorridor: !prev.activeEmergencyCorridor,
    }));
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
              Arterial Corridor Management &amp; "Green Wave" Synchronization
            </h1>
            <p className="text-xs text-slate-500">
              Coordinated multi-junction traffic signal timing to maintain continuous vehicle platooning
            </p>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[9px] uppercase font-bold">Corridor Length</span>
            <span className="text-indigo-700 font-bold">1,050 meters (3 Nodes)</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[9px] uppercase font-bold">Progression Efficiency</span>
            <span className="text-emerald-700 font-bold">92.4% (Zero-Stop)</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Visualizer */}
      <CorridorVisualizer
        junctions={junctions}
        config={config}
        onToggleGreenWave={handleToggleGreenWave}
        onTriggerEmergencyCorridor={handleTriggerEmergency}
        onAdjustSpeed={handleAdjustSpeed}
      />

      {/* Technical Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-indigo-700">
            <Zap className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Offset Calculation Law</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-mono">
            Signal green phase offset is computed using <code className="text-indigo-800 bg-indigo-50 px-1 py-0.5 rounded font-bold">Δt = D / v_prog</code> where <code className="text-indigo-800 font-bold">D</code> is arterial node separation (450m, 600m).
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-emerald-700">
            <TrendingDown className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Corridor Fuel &amp; Delay Gains</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-mono">
            Eliminating stop-and-go cycles across consecutive arterial signals yields an estimated <strong>34% reduction in travel time</strong>.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-rose-700">
            <ShieldAlert className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Sequential Emergency Flush</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-mono">
            Emergency pre-emption dispatches an ACID transaction wave across all 3 Neo4j records, forcing green corridors 30 seconds ahead.
          </p>
        </div>
      </div>
    </div>
  );
};
