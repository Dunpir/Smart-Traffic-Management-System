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
        return 'bg-emerald-500 shadow-lg shadow-emerald-500/50 text-emerald-300';
      case 'YELLOW':
        return 'bg-amber-500 shadow-lg shadow-amber-500/50 text-amber-300';
      case 'RED':
        return 'bg-rose-500 shadow-lg shadow-rose-500/50 text-rose-300';
    }
  };

  return (
    <div className="glass-panel p-5 lg:p-6 rounded-2xl border border-slate-800 bg-[#090e1a]/95 relative overflow-hidden">
      {/* Header & Mode Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Grand Arterial Avenue: 3-Junction Green Wave Corridor
                {config.enabled && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 animate-pulse">
                    COORDINATED SYNC ACTIVE
                  </span>
                )}
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Synchronized traffic wave progression across J001 &rarr; J002 &rarr; J003 (1.05 km)
              </p>
            </div>
          </div>
        </div>

        {/* Speed Advisor */}
        <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-700/60 px-3.5 py-2 rounded-xl">
          <Gauge className="w-5 h-5 text-cyan-400" />
          <div>
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">
              Optimal Green Wave Speed
            </span>
            <div className="text-sm font-black text-cyan-300 font-mono flex items-center gap-1">
              <span>{config.targetSpeedKmh} km/h</span>
              <span className="text-[10px] font-normal text-slate-400">(Zero-Stop Platoon)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Corridor Interactive Canvas */}
      <div className="p-4 rounded-2xl bg-gradient-to-b from-[#050811] to-[#0a1020] border border-slate-800/80 relative mb-6">
        {/* Highway Road Surface */}
        <div className="relative py-12 px-6">
          {/* Asphalt Road Canvas */}
          <div className="h-28 bg-[#121724] border-y-2 border-slate-700 rounded-xl relative overflow-hidden flex items-center">
            {/* Lane Divider Lines (Dashed) */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0 border-t-2 border-dashed border-amber-400/40" />

            {/* Green Wave Progression Beam */}
            {config.enabled && (
              <div
                className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent blur-md transition-all duration-150 pointer-events-none"
                style={{ left: `${pulsePosition}%` }}
              />
            )}

            {/* Emergency Corridor Visual Sweep */}
            {config.activeEmergencyCorridor && (
              <div className="absolute inset-0 bg-rose-500/10 animate-pulse pointer-events-none border border-rose-500/40" />
            )}

            {/* Junction Nodes on the Highway */}
            <div className="w-full flex justify-between items-center relative z-10 px-4 md:px-12">
              {junctions.map((junction, idx) => {
                const isGreen = junction.currentSignal === 'GREEN';
                const isEmergency = config.activeEmergencyCorridor;

                return (
                  <div key={junction.junctionId} className="flex flex-col items-center group relative">
                    {/* Upper Signal Head */}
                    <div
                      className={`p-2 rounded-xl bg-black/90 border transition-all duration-300 mb-2 flex items-center gap-1.5 shadow-xl ${
                        isEmergency
                          ? 'border-rose-500 ring-2 ring-rose-500/50'
                          : isGreen
                          ? 'border-emerald-500/80 ring-2 ring-emerald-500/30'
                          : 'border-slate-800'
                      }`}
                    >
                      {/* Signal LED */}
                      <div
                        className={`w-4 h-4 rounded-full ${
                          junction.currentSignal === 'RED'
                            ? 'bg-rose-500 shadow-md shadow-rose-500'
                            : 'bg-slate-900 border border-slate-800'
                        }`}
                      />
                      <div
                        className={`w-4 h-4 rounded-full ${
                          junction.currentSignal === 'YELLOW'
                            ? 'bg-amber-400 shadow-md shadow-amber-400'
                            : 'bg-slate-900 border border-slate-800'
                        }`}
                      />
                      <div
                        className={`w-4 h-4 rounded-full ${
                          junction.currentSignal === 'GREEN'
                            ? 'bg-emerald-400 shadow-md shadow-emerald-400'
                            : 'bg-slate-900 border border-slate-800'
                        }`}
                      />
                    </div>

                    {/* Node Pillar */}
                    <div className="w-12 h-12 rounded-2xl bg-slate-900/90 border-2 border-cyan-500/60 shadow-lg shadow-cyan-950/80 flex flex-col items-center justify-center relative">
                      <span className="text-[10px] font-black text-cyan-300 font-mono">
                        {junction.junctionId}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 font-bold">
                        {junction.phaseTimeRemaining}s
                      </span>

                      {/* Distance marker */}
                      <div className="absolute -bottom-6 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-400 whitespace-nowrap">
                        +{junction.distanceMeters}m
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Platoon progression travel times */}
          <div className="flex justify-between items-center mt-8 px-6 md:px-16 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>J001: Central Hub (Origin)</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              <span>Travel Time: ~36s (450m @ 45 km/h)</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span>J003: Airport Express (+1050m)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Junction Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {junctions.map((j) => (
          <div
            key={j.junctionId}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-xs font-bold text-white">{j.name}</h4>
                  <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                    Node ID: {j.junctionId}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${getSignalColor(
                    j.currentSignal
                  )}`}
                >
                  {j.currentSignal} ({j.phaseTimeRemaining}s)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 mt-3 pt-3 border-t border-slate-800/80">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Vehicle Queue</span>
                  <span className="font-bold text-white">{j.vehicleCount} cars</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Offset Delay</span>
                  <span className="font-bold text-cyan-400">+{j.offsetDelaySec}s sync</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Phase Duration</span>
                  <span className="font-bold text-white">{j.phaseDuration}s total</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Speed Limit</span>
                  <span className="font-bold text-slate-300">{j.speedLimitKmh} km/h</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Corridor Controls & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleGreenWave}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 ${
              config.enabled
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30 border border-cyan-400/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>{config.enabled ? 'Green Wave Sync: ACTIVE' : 'Enable Green Wave Mode'}</span>
          </button>

          {/* Speed Adjustment Buttons */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <span className="text-[10px] text-slate-400 px-2">Target Speed:</span>
            {[35, 45, 55].map((spd) => (
              <button
                key={spd}
                onClick={() => onAdjustSpeed(spd)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                  config.targetSpeedKmh === spd
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd} km/h
              </button>
            ))}
          </div>
        </div>

        {/* Emergency Pre-emption Corridor */}
        <button
          onClick={onTriggerEmergencyCorridor}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 ${
            config.activeEmergencyCorridor
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/50 animate-pulse'
              : 'bg-rose-950/70 hover:bg-rose-900/90 text-rose-300 border border-rose-700/60'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>
            {config.activeEmergencyCorridor
              ? 'CLEARING 3-JUNCTION CORRIDOR'
              : 'Trigger 3-Junction Emergency Corridor'}
          </span>
        </button>
      </div>
    </div>
  );
};
