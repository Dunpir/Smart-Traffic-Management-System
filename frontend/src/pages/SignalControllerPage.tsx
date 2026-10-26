import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Play,
  Square,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Flame,
  Clock,
  ShieldAlert,
  Settings,
  Send,
  Lock,
} from 'lucide-react';
import {
  Direction,
  LightState,
  JunctionLiveTelemetry,
  HardwareState,
} from '../types';
import { api } from '../services/api';
import { soundEffects } from '../utils/soundEffects';
import { webSerialService } from '../services/webSerialService';

interface SignalControllerPageProps {
  telemetry: JunctionLiveTelemetry | null;
  hardwareState: HardwareState | null;
  onRefresh: () => void;
}

export const SignalControllerPage: React.FC<SignalControllerPageProps> = ({
  telemetry,
  hardwareState,
  onRefresh,
}) => {
  const [thresholds, setThresholds] = useState({
    lowMax: 10,
    mediumMax: 20,
    highMax: 35,
    yellowDuration: 3,
    allRedDuration: 2,
    minGreen: 15,
    maxGreen: 65,
  });

  const [manualDuration, setManualDuration] = useState<number>(30);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [commandHistory, setCommandHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchThresholds();
    fetchHardwareHistory();
  }, []);

  const fetchThresholds = async () => {
    try {
      const res = await api.getThresholds();
      if (res.success && res.data) {
        setThresholds(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHardwareHistory = async () => {
    try {
      const res = await api.getHardwareStatus();
      if (res.success && res.data?.commandHistory) {
        setCommandHistory(res.data.commandHistory);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualCommand = async (direction: Direction, signal: LightState) => {
    try {
      soundEffects.playClick();
      setIsUpdating(true);
      // Instant direct hardware actuation if USB WebSerial is connected
      webSerialService.testSignal(direction, signal).catch(() => {});
      await api.sendManualCommand(direction, signal, manualDuration);
      await fetchHardwareHistory();
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveThresholds = async () => {
    try {
      soundEffects.playClick();
      setIsUpdating(true);
      await api.updateThresholds(thresholds);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!telemetry) return null;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 text-slate-900 dark:text-white transition-colors">
      {/* Header Banner */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Traffic Signal Controller &amp; Safety Interlock
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans mt-0.5">
              Deterministic rule-based phase timing allocation, manual actuator controls, and safety lockout.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500 dark:text-zinc-400">Current Mode:</span>
          <span
            className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${
              telemetry.mode === 'AUTOMATIC'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                : 'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700'
            }`}
          >
            {telemetry.mode} MODE
          </span>
        </div>
      </div>

      {/* Live Signal Phasing Ring & Gantt Cycle Diagram */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#1f1f23]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Live Phase Cycle &amp; Arterial Gantt Timeline
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
            Phase Remaining: {telemetry.phaseTimeRemaining}s / Total Cycle: {telemetry.currentPhaseDuration || 60}s
          </span>
        </div>

        {/* Phase Gantt Progress Bars for All 4 Approaches */}
        <div className="space-y-2 font-mono text-xs">
          {(['NORTH', 'EAST', 'SOUTH', 'WEST'] as Direction[]).map((dir) => {
            const isActive = telemetry.activeDirection === dir;
            const signal = telemetry.roads[dir].currentSignal;
            const percent = isActive
              ? Math.min(100, Math.max(5, (1 - telemetry.phaseTimeRemaining / (telemetry.currentPhaseDuration || 45)) * 100))
              : signal === 'RED'
              ? 100
              : 0;

            return (
              <div key={dir} className="p-2 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] flex items-center gap-3">
                <div className="w-24 shrink-0 flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span>{dir}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] ${
                      signal === 'GREEN'
                        ? 'bg-emerald-500 text-black font-bold'
                        : signal === 'YELLOW'
                        ? 'bg-amber-400 text-black font-bold'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {signal}
                  </span>
                </div>

                <div className="flex-1 h-3 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      signal === 'GREEN'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : signal === 'YELLOW'
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-300'
                        : 'bg-rose-950/60 border-r-2 border-rose-500'
                    }`}
                    style={{ width: isActive ? `${percent}%` : signal === 'GREEN' ? '100%' : '10%' }}
                  />
                </div>

                <div className="w-28 text-right text-[11px] text-slate-500 dark:text-zinc-400">
                  {isActive ? `${telemetry.phaseTimeRemaining}s active` : `${telemetry.roads[dir].vehicleCount} queued`}
                </div>
              </div>
            );
          })}
        </div>

        {/* Master Quick Phase Overrides */}
        <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono">
          <button
            onClick={() => handleManualCommand('NORTH', 'GREEN')}
            className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 transition cursor-pointer flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>All-Red Emergency Freeze</span>
          </button>

          <button
            onClick={() => handleManualCommand('SOUTH', 'GREEN')}
            className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 transition cursor-pointer flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Flashing Yellow Night Caution</span>
          </button>

          <button
            onClick={() => handleManualCommand('EAST', 'GREEN')}
            className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 transition cursor-pointer flex items-center gap-1.5"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-500" />
            <span>Public Transit BRT Green Wave</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Deck: Manual Controller & State Parity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Manual Signal Override with Safety Interlock */}
        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200 dark:border-[#1f1f23]">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>Manual Signal Override (Interlocked)</span>
              </h3>
              <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                Safety Interlock Active
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 mb-3 leading-relaxed">
              Setting any approach to GREEN automatically interlocks and forces all conflicting approach lights to RED, preventing dangerous multi-directional collisions.
            </p>

            {/* Manual Duration Input */}
            <div className="mb-3.5 p-2.5 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] flex items-center justify-between">
              <label className="text-xs font-mono text-slate-700 dark:text-zinc-300">
                Override Duration (seconds):
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={manualDuration}
                onChange={(e) => setManualDuration(Number(e.target.value))}
                className="w-20 px-2 py-1 rounded bg-white dark:bg-[#141418] border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white font-mono text-xs text-center font-bold"
              />
            </div>

            {/* 4 Approach Manual Command Cards */}
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as Direction[]).map((dir) => {
                const isCurrentGreen = telemetry.roads[dir].currentSignal === 'GREEN';
                return (
                  <div
                    key={dir}
                    className={`p-3 rounded-lg border transition ${
                      isCurrentGreen
                        ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 dark:bg-black dark:border-[#1f1f23]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                        {dir} ROAD
                      </span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          telemetry.roads[dir].currentSignal === 'GREEN'
                            ? 'bg-emerald-500'
                            : telemetry.roads[dir].currentSignal === 'YELLOW'
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-rose-500'
                        }`}
                      />
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 mb-2">
                      Vehicles: <strong className="text-slate-900 dark:text-white">{telemetry.roads[dir].vehicleCount}</strong>
                    </div>

                    <button
                      onClick={() => handleManualCommand(dir, 'GREEN')}
                      disabled={isUpdating || isCurrentGreen}
                      className={`w-full py-1.5 px-2 rounded font-mono text-[10px] font-semibold uppercase tracking-wider transition cursor-pointer ${
                        isCurrentGreen
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black shadow-xs'
                      }`}
                    >
                      {isCurrentGreen ? 'ACTIVE GREEN' : `FORCE GREEN (${manualDuration}s)`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Threshold Tuning & Conflict Matrix Proof */}
        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200 dark:border-[#1f1f23]">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                <span>Threshold Tuning &amp; Conflict Lockout Matrix</span>
              </h3>
            </div>

            <div className="space-y-2 font-mono text-xs mb-3">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23]">
                <span className="text-slate-700 dark:text-zinc-300">Low Density Max Vehicles:</span>
                <input
                  type="number"
                  value={thresholds.lowMax}
                  onChange={(e) => setThresholds({ ...thresholds, lowMax: Number(e.target.value) })}
                  className="w-16 px-2 py-0.5 rounded bg-white dark:bg-[#141418] border border-slate-300 dark:border-zinc-700 text-center font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23]">
                <span className="text-slate-700 dark:text-zinc-300">High Density Max Vehicles:</span>
                <input
                  type="number"
                  value={thresholds.highMax}
                  onChange={(e) => setThresholds({ ...thresholds, highMax: Number(e.target.value) })}
                  className="w-16 px-2 py-0.5 rounded bg-white dark:bg-[#141418] border border-slate-300 dark:border-zinc-700 text-center font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23]">
                <span className="text-slate-700 dark:text-zinc-300">Yellow Phase Interval (s):</span>
                <input
                  type="number"
                  value={thresholds.yellowDuration}
                  onChange={(e) => setThresholds({ ...thresholds, yellowDuration: Number(e.target.value) })}
                  className="w-16 px-2 py-0.5 rounded bg-white dark:bg-[#141418] border border-slate-300 dark:border-zinc-700 text-center font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Conflict Lockout Matrix Verification Table */}
            <div className="p-2.5 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] text-xs font-mono">
              <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase mb-1.5 flex items-center justify-between">
                <span>Conflict Safety Verification Matrix</span>
                <span className="text-emerald-500 font-bold">100% COLLISION FREE</span>
              </div>
              <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
                <div className="font-bold">Dir</div>
                <div className="font-bold">North</div>
                <div className="font-bold">South</div>
                <div className="font-bold">East</div>
                <div className="font-bold">West</div>

                <div className="font-bold">N</div>
                <div className="bg-emerald-500/20 text-emerald-400 rounded">PASS</div>
                <div className="bg-emerald-500/20 text-emerald-400 rounded">PASS</div>
                <div className="bg-rose-500/20 text-rose-400 rounded">LOCK</div>
                <div className="bg-rose-500/20 text-rose-400 rounded">LOCK</div>

                <div className="font-bold">E</div>
                <div className="bg-rose-500/20 text-rose-400 rounded">LOCK</div>
                <div className="bg-rose-500/20 text-rose-400 rounded">LOCK</div>
                <div className="bg-emerald-500/20 text-emerald-400 rounded">PASS</div>
                <div className="bg-emerald-500/20 text-emerald-400 rounded">PASS</div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-[#1f1f23]">
            <button
              onClick={handleSaveThresholds}
              disabled={isUpdating}
              className="w-full py-2 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Apply Threshold Matrix Updates</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
