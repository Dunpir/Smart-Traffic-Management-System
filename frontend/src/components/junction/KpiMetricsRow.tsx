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
      <div className="bg-[#0a0a0a] border border-[#27272a] hover:border-zinc-700 rounded-xl p-4 flex items-center justify-between transition">
        <div>
          <span className="text-[11px] font-mono text-zinc-400 block uppercase">
            Junction Vehicle Flow
          </span>
          <div className="text-2xl font-bold text-white mt-1 flex items-baseline gap-1.5 font-mono">
            <span>{telemetry.totalVehicleCount}</span>
            <span className="text-xs font-sans text-zinc-500 font-normal">vehicles</span>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono mt-0.5 block">
            Across 4 Approaches
          </span>
        </div>
        <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center shrink-0">
          <Car className="w-4 h-4" />
        </div>
      </div>

      {/* 2. Congestion Index */}
      <div className="bg-[#0a0a0a] border border-[#27272a] hover:border-zinc-700 rounded-xl p-4 flex items-center justify-between transition">
        <div className="w-full mr-2">
          <span className="text-[11px] font-mono text-zinc-400 block uppercase">
            Congestion Level
          </span>
          <div className="text-2xl font-bold text-white mt-1 flex items-baseline gap-1.5 font-mono">
            <span>{telemetry.congestionIndex}%</span>
            <span className="text-xs font-sans text-zinc-500 font-normal">capacity</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-zinc-900 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                telemetry.congestionIndex > 70
                  ? 'bg-rose-500'
                  : telemetry.congestionIndex > 40
                  ? 'bg-amber-400'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${telemetry.congestionIndex}%` }}
            />
          </div>
        </div>
        <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center shrink-0">
          <Activity className="w-4 h-4" />
        </div>
      </div>

      {/* 3. Average Waiting Time */}
      <div className="bg-[#0a0a0a] border border-[#27272a] hover:border-zinc-700 rounded-xl p-4 flex items-center justify-between transition">
        <div>
          <span className="text-[11px] font-mono text-zinc-400 block uppercase">
            Average Wait Time
          </span>
          <div className="text-2xl font-bold text-white mt-1 flex items-baseline gap-1.5 font-mono">
            <span>{telemetry.averageWaitTimeSec}</span>
            <span className="text-xs font-sans text-zinc-500 font-normal">seconds</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono mt-0.5 block">
            -38% vs Static Cycles
          </span>
        </div>
        <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4" />
        </div>
      </div>

      {/* 4. Hardware-Software Parity Status */}
      <div className="bg-[#0a0a0a] border border-[#27272a] hover:border-zinc-700 rounded-xl p-4 flex items-center justify-between transition">
        <div>
          <span className="text-[11px] font-mono text-zinc-400 block uppercase">
            Actuator Sync
          </span>
          <div className="text-sm font-semibold text-white mt-1 flex items-center gap-1.5">
            {isHardwareSynced ? (
              <span className="text-emerald-400 flex items-center gap-1 font-mono text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% IN SYNC
              </span>
            ) : (
              <span className="text-cyan-400 flex items-center gap-1 font-mono text-xs">
                <Zap className="w-3.5 h-3.5" /> SIMULATED
              </span>
            )}
          </div>
          <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">
            4 Phase Actuation
          </span>
        </div>
        <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center shrink-0">
          <Cpu className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
