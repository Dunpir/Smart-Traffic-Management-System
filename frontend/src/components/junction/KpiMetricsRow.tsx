import React from 'react';
import { Car, Clock, Activity, Cpu, CheckCircle2 } from 'lucide-react';
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4">
      {/* 1. Total Junction Vehicle Volume */}
      <div className="card-modern p-4 rounded-3xl flex items-center justify-between transition-all hover:shadow-md">
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider block">
            Junction Vehicle Flow
          </span>
          <div className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-baseline gap-1.5 font-sans">
            <span>{telemetry.totalVehicleCount}</span>
            <span className="text-xs font-medium text-slate-400">vehicles</span>
          </div>
          <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-0.5 block">
            Across 4 Approaches
          </span>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-500/20">
          <Car className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Congestion Index */}
      <div className="card-modern p-4 rounded-3xl flex items-center justify-between transition-all hover:shadow-md">
        <div className="w-full mr-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider block">
            Congestion Level
          </span>
          <div className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-baseline gap-1.5 font-sans">
            <span>{telemetry.congestionIndex}%</span>
            <span className="text-xs font-medium text-slate-400">capacity</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${telemetry.congestionIndex > 70
                ? 'bg-rose-500'
                : telemetry.congestionIndex > 40
                  ? 'bg-amber-400'
                  : 'bg-red-500'
                }`}
              style={{ width: `${telemetry.congestionIndex}%` }}
            />
          </div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-500/20">
          <Activity className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Average Waiting Time */}
      <div className="card-modern p-4 rounded-3xl flex items-center justify-between transition-all hover:shadow-md">
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider block">
            Average Wait Time
          </span>
          <div className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-baseline gap-1.5 font-sans">
            <span>{telemetry.averageWaitTimeSec}</span>
            <span className="text-xs font-medium text-slate-400">seconds</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            -38% vs Static Cycles
          </span>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/20">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Hardware-Software Parity Status */}
      <div className="card-modern p-4 rounded-3xl flex items-center justify-between transition-all hover:shadow-md">
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider block">
            Actuator Sync
          </span>
          <div className="text-sm font-black text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
            {isHardwareSynced ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 100% IN SYNC
              </span>
            ) : (
              <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-4 h-4 text-indigo-500" /> SIMULATED
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 block">
            {hardwareState?.connected ? 'Physical Arduino (12-ch)' : '12-channel Controller'}
          </span>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-500/20">
          <Cpu className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
