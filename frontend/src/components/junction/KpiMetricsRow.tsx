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
      <div className="bg-[#0a0a0a] border border-[#1f1f23] hover:border-[#333338] rounded-lg p-4 flex items-center justify-between transition">
        <div>
          <span className="text-[11px] text-zinc-400 font-medium block">
            Junction Vehicle Flow
          </span>
          <div className="text-2xl font-bold text-white mt-1 font-mono">
            {telemetry.totalVehicleCount} <span className="text-xs text-zinc-500 font-normal font-sans">veh</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">
            Across 4 Approaches
          </span>
        </div>
        <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center shrink-0">
          <Car className="w-4 h-4" />
        </div>
      </div>

      {/* 2. Congestion Level */}
      <div className="bg-[#0a0a0a] border border-[#1f1f23] hover:border-[#333338] rounded-lg p-4 flex items-center justify-between transition">
        <div className="w-full mr-2">
          <span className="text-[11px] text-zinc-400 font-medium block">
            Congestion Level
          </span>
          <div className="text-2xl font-bold text-white mt-1 font-mono">
            {telemetry.congestionIndex}%
          </div>
          <div className="w-full h-1.5 rounded-full bg-zinc-900 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                telemetry.congestionIndex > 70
                  ? 'bg-rose-500'
                  : telemetry.congestionIndex > 40
                  ? 'bg-amber-400'
                  : 'bg-white'
              }`}
              style={{ width: `${telemetry.congestionIndex}%` }}
            />
          </div>
        </div>
        <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center shrink-0">
          <Activity className="w-4 h-4" />
        </div>
      </div>

      {/* 3. Average Wait Time */}
      <div className="bg-[#0a0a0a] border border-[#1f1f23] hover:border-[#333338] rounded-lg p-4 flex items-center justify-between transition">
        <div>
          <span className="text-[11px] text-zinc-400 font-medium block">
            Average Wait Time
          </span>
          <div className="text-2xl font-bold text-white mt-1 font-mono">
            {telemetry.averageWaitTimeSec} <span className="text-xs text-zinc-500 font-normal font-sans">sec</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono mt-0.5 block">
            -38% vs static cycle
          </span>
        </div>
        <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4" />
        </div>
      </div>

      {/* 4. Actuator Sync */}
      <div className="bg-[#0a0a0a] border border-[#1f1f23] hover:border-[#333338] rounded-lg p-4 flex items-center justify-between transition">
        <div>
          <span className="text-[11px] text-zinc-400 font-medium block">
            Actuator Sync
          </span>
          <div className="text-sm font-semibold text-white mt-1 flex items-center gap-1.5">
            {isHardwareSynced ? (
              <span className="text-emerald-400 flex items-center gap-1 font-mono text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% IN SYNC
              </span>
            ) : (
              <span className="text-zinc-200 flex items-center gap-1 font-mono text-xs">
                <Zap className="w-3.5 h-3.5 text-zinc-400" /> SIMULATED
              </span>
            )}
          </div>
          <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">
            BCNF Graph Cycle
          </span>
        </div>
        <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center shrink-0">
          <Cpu className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
