import React, { useState, useEffect } from 'react';
import {
  Zap,
  ArrowRight,
  Gauge,
  ShieldAlert,
  Car,
  CheckCircle2,
  Navigation,
  Clock,
  Radio,
  Flame,
} from 'lucide-react';
import { CorridorJunction, GreenWaveConfig, LightState, Direction } from '../../types';
import { soundEffects } from '../../utils/soundEffects';

interface CorridorVisualizerProps {
  junctions: CorridorJunction[];
  config: GreenWaveConfig;
  onToggleGreenWave: () => void;
  onTriggerEmergencyCorridor: () => void;
  onAdjustSpeed: (speed: number) => void;
}

export const CorridorVisualizer: React.FC<CorridorVisualizerProps> = ({
  junctions,
  config,
  onToggleGreenWave,
  onTriggerEmergencyCorridor,
  onAdjustSpeed,
}) => {
  const [pulsePosition, setPulsePosition] = useState<number>(0);

  // Animated progression wave moving through the corridor
  useEffect(() => {
    if (!config.enabled) return;

    const interval = setInterval(() => {
      setPulsePosition((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 150);

    return () => clearInterval(interval);
  }, [config.enabled]);

  const getSignalColor = (state: LightState) => {
    switch (state) {
      case 'GREEN':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
      case 'YELLOW':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
      case 'RED':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
    }
  };

  return (
    <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] relative overflow-hidden text-slate-900 dark:text-white shadow-xs transition-colors">
      {/* Header & Mode Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-[#1f1f23]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              Grand Arterial: 3-Junction Green Wave Corridor
              {config.enabled && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                  SYNC ACTIVE
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans">
              Synchronized traffic wave progression across J001 &rarr; J002 &rarr; J003 (1.05 km)
            </p>
          </div>
        </div>

        {/* Speed Advisor */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] px-3 py-1.5 rounded-md text-xs font-mono">
          <Gauge className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
          <div>
            <span className="text-[9px] text-slate-500 dark:text-zinc-500 uppercase block">Optimal Speed</span>
            <div className="font-bold text-slate-900 dark:text-white">{config.targetSpeedKmh} km/h</div>
          </div>
        </div>
      </div>

      {/* Corridor Interactive Canvas */}
      <div className="p-4 rounded-lg bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] relative mb-4">
        {/* Highway Road Surface */}
        <div className="relative py-8 px-4">
          <div className="h-24 bg-slate-800 rounded-lg relative overflow-hidden flex items-center border border-slate-700">
            {/* Lane Divider Lines (Dashed) */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0 border-t border-dashed border-amber-400/50" />

            {/* Green Wave Progression Beam */}
            {config.enabled && (
              <div
                className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent blur-xs pointer-events-none"
                style={{ left: `${pulsePosition}%` }}
              />
            )}

            {/* Junction Nodes on Highway */}
            <div className="w-full flex justify-between items-center relative z-10 px-4 md:px-12 text-white">
              {junctions.map((junction) => {
                const isGreen = junction.currentSignal === 'GREEN';
                return (
                  <div key={junction.junctionId} className="flex flex-col items-center relative">
                    {/* Signal Mini LED */}
                    <div className="p-1.5 rounded bg-black border border-zinc-700 mb-1 flex items-center gap-1">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          junction.currentSignal === 'RED' ? 'bg-red-500 shadow-xs' : 'bg-zinc-800'
                        }`}
                      />
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          junction.currentSignal === 'YELLOW' ? 'bg-amber-400 shadow-xs' : 'bg-zinc-800'
                        }`}
                      />
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          junction.currentSignal === 'GREEN' ? 'bg-emerald-400 shadow-xs' : 'bg-zinc-800'
                        }`}
                      />
                    </div>

                    {/* Node Pillar */}
                    <div className="w-10 h-10 rounded bg-slate-900 border border-slate-600 flex flex-col items-center justify-center">
                      <span className="text-[9px] font-bold font-mono text-white">{junction.junctionId}</span>
                      <span className="text-[8px] font-mono text-zinc-400">{junction.phaseTimeRemaining}s</span>
                    </div>

                    <div className="absolute -bottom-5 text-[9px] font-mono text-slate-500 dark:text-zinc-500 whitespace-nowrap">
                      +{junction.distanceMeters}m
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 text-[11px] font-mono text-slate-500 dark:text-zinc-500">
            <span>Origin: J001 (Central Hub)</span>
            <span>Progression Travel Time: ~36s</span>
            <span>Terminus: J003 (Airport Node)</span>
          </div>
        </div>
      </div>

      {/* 3-Junction Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {junctions.map((j) => (
          <div
            key={j.junctionId}
            className="p-3 rounded-lg bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">{j.name}</h4>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500">ID: {j.junctionId}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${getSignalColor(j.currentSignal)}`}>
                  {j.currentSignal} ({j.phaseTimeRemaining}s)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-xs font-mono text-slate-600 dark:text-zinc-400 mt-2 pt-2 border-t border-slate-200 dark:border-zinc-900">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block">Queue</span>
                  <span className="font-bold text-slate-900 dark:text-white">{j.vehicleCount} cars</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block">Offset</span>
                  <span className="font-bold text-slate-900 dark:text-white">+{j.offsetDelaySec}s</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-[#1f1f23]">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleGreenWave}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              config.enabled
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{config.enabled ? 'Green Wave Sync Active' : 'Enable Green Wave Sync'}</span>
          </button>

          <div className="flex items-center gap-1 text-xs font-mono">
            {[35, 45, 55].map((spd) => (
              <button
                key={spd}
                onClick={() => onAdjustSpeed(spd)}
                className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                  config.targetSpeedKmh === spd
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-zinc-900 dark:text-zinc-400'
                }`}
              >
                {spd} km/h
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onTriggerEmergencyCorridor}
          className={`px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            config.activeEmergencyCorridor
              ? 'bg-red-600 text-white animate-pulse'
              : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>
            {config.activeEmergencyCorridor ? 'CLEARING 3-JUNCTION CORRIDOR' : 'Trigger 3-Node Emergency Wave'}
          </span>
        </button>
      </div>
    </div>
  );
};
