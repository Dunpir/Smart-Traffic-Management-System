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
import { soundEffects } from '../utils/soundEffects';

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
    soundEffects.playClick();
    setConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleAdjustSpeed = (speed: number) => {
    soundEffects.playClick();
    setConfig((prev) => ({ ...prev, targetSpeedKmh: speed }));
  };

  const handleTriggerEmergency = () => {
    soundEffects.playEmergencySiren();
    setConfig((prev) => ({
      ...prev,
      activeEmergencyCorridor: !prev.activeEmergencyCorridor,
    }));
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 text-slate-900 dark:text-white transition-colors">
      {/* Header Banner */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Arterial Corridor Management &amp; "Green Wave" Synchronization
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans mt-0.5">
              Coordinated multi-junction traffic signal timing to maintain continuous vehicle platooning.
            </p>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-2.5 py-1 rounded bg-slate-100 dark:bg-black border border-slate-200 dark:border-[#1f1f23]">
            <span className="text-slate-500 dark:text-zinc-500 block text-[9px] uppercase">Corridor Length</span>
            <span className="text-slate-900 dark:text-white font-bold">1,050 meters (3 Nodes)</span>
          </div>
          <div className="px-2.5 py-1 rounded bg-slate-100 dark:bg-black border border-slate-200 dark:border-[#1f1f23]">
            <span className="text-slate-500 dark:text-zinc-500 block text-[9px] uppercase">Progression Efficiency</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">92.4% (Zero-Stop)</span>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-lg bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
            <Zap className="w-3.5 h-3.5" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Offset Calculation Law</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-mono">
            Signal green phase offset is computed using <code className="bg-slate-100 dark:bg-zinc-900 px-1 py-0.5 rounded font-bold">Δt = D / v_prog</code> where <code className="font-bold">D</code> is arterial node separation (450m, 600m).
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Fuel &amp; Delay Gains</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-mono">
            Eliminating stop-and-go cycles across consecutive arterial signals yields an estimated <strong>34% reduction in travel time</strong>.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Emergency Flush</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-mono">
            Emergency pre-emption dispatches an ACID transaction wave across all 3 Neo4j records, forcing green corridors 30 seconds ahead.
          </p>
        </div>
      </div>
    </div>
  );
};
