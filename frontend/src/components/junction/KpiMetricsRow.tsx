import React from 'react';
import { Car, Clock, Activity, Cpu, CheckCircle2, Zap } from 'lucide-react';
import { JunctionLiveTelemetry, HardwareState } from '../../types';

interface KpiMetricsRowProps {
  telemetry: JunctionLiveTelemetry;
  hardwareState: HardwareState | null;
}

export const KpiMetricsRow: React.FC<KpiMetricsRowProps> = ({
  telemetry,
  hardwareState,
}) => {
  const isHardwareSynced =
    hardwareState &&
    telemetry.roads.NORTH.currentSignal === hardwareState.actualHardwareSignalState.NORTH &&
    telemetry.roads.WEST.currentSignal === hardwareState.actualHardwareSignalState.WEST;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {/* 1. Total Junction Vehicle Volume */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] rounded-lg p-4 flex items-center justify-between transition text-slate-900 dark:text-white shadow-xs">
        <div>
          <span className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium block">
            Junction Vehicle Flow
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            {telemetry.totalVehicleCount} <span className="text-xs text-slate-500 dark:text-zinc-500 font-normal font-sans">veh</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono mt-0.5 block">
            Across 4 Approaches
          </span>
        </div>
        <div className="w-8 h-8 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 flex items-center justify-center shrink-0">
          <Car className="w-4 h-4" />
        </div>
      </div>

      {/* 2. Congestion Level */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] rounded-lg p-4 flex items-center justify-between transition text-slate-900 dark:text-white shadow-xs">
        <div className="w-full mr-2">
          <span className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium block">
            Congestion Level
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            {telemetry.congestionIndex}%
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-zinc-900 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                telemetry.congestionIndex > 70
                  ? 'bg-rose-500'
                  : telemetry.congestionIndex > 40
                  ? 'bg-amber-400'
                  : 'bg-slate-900 dark:bg-white'
              }`}
              style={{ width: `${telemetry.congestionIndex}%` }}
            />
          </div>
        </div>
        <div className="w-8 h-8 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 flex items-center justify-center shrink-0">
          <Activity className="w-4 h-4" />
        </div>
      </div>

      {/* 3. Average Wait Time */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] rounded-lg p-4 flex items-center justify-between transition text-slate-900 dark:text-white shadow-xs">
        <div>
          <span className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium block">
            Average Wait Time
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            {telemetry.averageWaitTimeSec} <span className="text-xs text-slate-500 dark:text-zinc-500 font-normal font-sans">sec</span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
            -38% vs static cycle
          </span>
        </div>
        <div className="w-8 h-8 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4" />
        </div>
      </div>

      {/* 4. Actuator Sync */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] rounded-lg p-4 flex items-center justify-between transition text-slate-900 dark:text-white shadow-xs">
        <div>
          <span className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium block">
            Actuator Sync
          </span>
          <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
            {isHardwareSynced ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% IN SYNC
              </span>
            ) : (
              <span className="text-slate-800 dark:text-zinc-200 flex items-center gap-1 font-mono text-xs">
                <Zap className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" /> SIMULATED
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono mt-0.5 block">
            BCNF Graph Cycle
          </span>
        </div>
        <div className="w-8 h-8 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 flex items-center justify-center shrink-0">
          <Cpu className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
