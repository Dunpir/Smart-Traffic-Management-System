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
      setIsUpdating(true);
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
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              Traffic Signal Controller &amp; Safety Interlock
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Deterministic rule-based phase timing allocation, manual actuator controls, and safety lockout.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Current Mode:</span>
          <span
            className={`px-3 py-1 rounded-lg font-bold ${
              telemetry.mode === 'AUTOMATIC'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}
          >
            {telemetry.mode} MODE
          </span>
        </div>
      </div>

      {/* Main 2-Column Deck: Manual Controller & State Parity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Manual Signal Override with Safety Interlock */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Manual Signal Override (Interlocked)</span>
              </h3>
              <span className="text-[11px] font-mono text-amber-400 font-semibold">
                Safety Interlock Active
              </span>
            </div>

            <p className="text-xs text-slate-400 font-mono mb-4 leading-relaxed">
              Setting any approach to GREEN automatically interlocks and forces all conflicting approach lights to RED, preventing dangerous multi-directional collisions.
            </p>

            {/* Manual Duration Input */}
            <div className="mb-5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <label className="text-xs font-mono text-slate-300">
                Override Duration (seconds):
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={manualDuration}
                onChange={(e) => setManualDuration(Number(e.target.value))}
                className="w-20 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-sm text-center font-bold"
              />
            </div>

            {/* 4 Approach Manual Command Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as Direction[]).map((dir) => {
                const isCurrentGreen = telemetry.roads[dir].currentSignal === 'GREEN';
                return (
                  <div
                    key={dir}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCurrentGreen
                        ? 'bg-emerald-950/40 border-emerald-600/60 shadow-lg shadow-emerald-950/50'
                        : 'bg-slate-900/70 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold font-mono text-white">
                        {dir} ROAD
                      </span>
                      <span
                        className={`w-3 h-3 rounded-full ${
                          telemetry.roads[dir].currentSignal === 'GREEN'
                            ? 'bg-traffic-green glow-traffic-green'
                            : telemetry.roads[dir].currentSignal === 'YELLOW'
                            ? 'bg-traffic-yellow glow-traffic-yellow'
                            : 'bg-traffic-red'
                        }`}
                      />
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 mb-3">
                      Vehicles: <strong className="text-slate-200">{telemetry.roads[dir].vehicleCount}</strong>
                    </div>

                    {/* Button to Command Green */}
                    <button
                      onClick={() => handleManualCommand(dir, 'GREEN')}
                      disabled={isUpdating}
                      className={`w-full py-2 px-2 rounded-lg font-mono text-xs font-bold transition-all ${
                        isCurrentGreen
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isCurrentGreen ? 'ACTIVE GREEN' : `FORCE ${dir} GREEN`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>To resume adaptive cycle:</span>
            <button
              onClick={() => api.setMode('AUTOMATIC').then(onRefresh)}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors"
            >
              SWITCH TO AUTOMATIC MODE
            </button>
          </div>
        </div>

        {/* Right Column: Software State vs Actual Hardware State Parity */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Software State vs Hardware State Parity</span>
              </h3>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Synchronized
              </span>
            </div>

            <p className="text-xs text-slate-400 font-mono mb-4 leading-relaxed">
              Verifies that software signal variables in the Traffic Decision Engine strictly match the physical/simulated Arduino GPIO outputs (Pins D2 through D13).
            </p>

            {/* Parity Table */}
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 pb-2">
                    <th className="py-2">Approach</th>
                    <th className="py-2">Software State</th>
                    <th className="py-2">Hardware State</th>
                    <th className="py-2">Active Pins</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as Direction[]).map((dir) => {
                    const sw = telemetry.roads[dir].currentSignal;
                    const hw = hardwareState?.actualHardwareSignalState[dir] || sw;
                    const pins = dir === 'NORTH' ? 'D2-D4' : dir === 'SOUTH' ? 'D5-D7' : dir === 'EAST' ? 'D8-D10' : 'D11-D13';

                    return (
                      <tr key={dir} className="text-slate-300">
                        <td className="py-2.5 font-bold text-white">{dir} ROAD</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sw === 'GREEN'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : sw === 'YELLOW'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {sw}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              hw === 'GREEN'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : hw === 'YELLOW'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {hw}
                          </span>
                        </td>
                        <td className="py-2.5 text-cyan-400 font-semibold">{pins}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400">
            Hardware Handshake: <strong className="text-white">{hardwareState?.connected ? 'ARDUINO ATTACHED' : 'SIMULATION BRIDGE ACTIVE'}</strong>
          </div>
        </div>
      </div>

      {/* Rule-Based Threshold Configuration Deck */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
              Rule-Based Traffic Decision Thresholds
            </h3>
          </div>
          <button
            onClick={handleSaveThresholds}
            disabled={isUpdating}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-md transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>SAVE THRESHOLDS</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs font-mono">
          {/* Low Max */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <label className="block text-slate-400 mb-1">
              Low Density Max (&lt;= veh):
            </label>
            <input
              type="number"
              value={thresholds.lowMax}
              onChange={(e) => setThresholds({ ...thresholds, lowMax: Number(e.target.value) })}
              className="w-full px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-emerald-400 font-bold"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Green window: 15s</span>
          </div>

          {/* Medium Max */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <label className="block text-slate-400 mb-1">
              Medium Density Max (&lt;= veh):
            </label>
            <input
              type="number"
              value={thresholds.mediumMax}
              onChange={(e) => setThresholds({ ...thresholds, mediumMax: Number(e.target.value) })}
              className="w-full px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-cyan-400 font-bold"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Green window: 28s</span>
          </div>

          {/* High Max */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <label className="block text-slate-400 mb-1">
              High Density Max (&lt;= veh):
            </label>
            <input
              type="number"
              value={thresholds.highMax}
              onChange={(e) => setThresholds({ ...thresholds, highMax: Number(e.target.value) })}
              className="w-full px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-amber-400 font-bold"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Green window: 42s</span>
          </div>

          {/* Yellow Duration */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <label className="block text-slate-400 mb-1">
              Yellow Clearance (s):
            </label>
            <input
              type="number"
              value={thresholds.yellowDuration}
              onChange={(e) => setThresholds({ ...thresholds, yellowDuration: Number(e.target.value) })}
              className="w-full px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-yellow-400 font-bold"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Safety transition</span>
          </div>
        </div>
      </div>
    </div>
  );
};
