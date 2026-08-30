import React, { useState } from 'react';
import { Zap, AlertOctagon, Flame, CloudRain, Radio, RefreshCw, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';

interface ChaosEvent {
  id: string;
  timestamp: string;
  title: string;
  impact: string;
  severity: 'HIGH' | 'CRITICAL' | 'WARNING';
}

interface ChaosModePanelProps {
  onTriggerEmergency?: (road: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST') => void;
  onInjectSpike?: (road: string, count: number) => void;
}

export const ChaosModePanel: React.FC<ChaosModePanelProps> = ({
  onTriggerEmergency,
  onInjectSpike,
}) => {
  const [chaosLevel, setChaosLevel] = useState<number>(1); // 1 (Normal) to 5 (Catastrophic)
  const [activeRoadblock, setActiveRoadblock] = useState<'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | null>(null);
  const [isSensorGlitchActive, setIsSensorGlitchActive] = useState<boolean>(false);
  const [events, setEvents] = useState<ChaosEvent[]>([
    {
      id: '1',
      timestamp: new Date().toLocaleTimeString(),
      title: 'Baseline Network Status',
      impact: 'All 4 approaches clear. Flow rate normal.',
      severity: 'WARNING',
    },
  ]);

  const addChaosEvent = (title: string, impact: string, severity: ChaosEvent['severity']) => {
    const newEvent: ChaosEvent = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      title,
      impact,
      severity,
    };
    setEvents((prev) => [newEvent, ...prev.slice(0, 7)]);
  };

  const handleTriggerRoadblock = (road: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST') => {
    soundEffects.playViolationPing();
    setActiveRoadblock(road);
    addChaosEvent(
      `💥 Severe Collision on ${road} Approach`,
      `Approach completely blocked. Cypher graph dynamically rerouting perimeter flow.`,
      'CRITICAL'
    );
    if (onInjectSpike) {
      onInjectSpike(road, 45);
    }
  };

  const handleClearRoadblock = () => {
    soundEffects.playClick();
    setActiveRoadblock(null);
    addChaosEvent(
      '✅ Roadblock Cleared by Highway Patrol',
      'Approach reopened. Traffic queue clearing at standard discharge rate.',
      'WARNING'
    );
  };

  const handleVipConvoy = () => {
    soundEffects.playEmergencySiren();
    addChaosEvent(
      '🚒 Multi-Vehicle VIP / Fire Brigade Cascade',
      'Simultaneous emergency corridor requested. High-priority pre-emption sequence engaged.',
      'CRITICAL'
    );
    if (onTriggerEmergency) {
      onTriggerEmergency('EAST');
    }
  };

  const handleSensorGlitch = () => {
    soundEffects.playViolationPing();
    const nextState = !isSensorGlitchActive;
    setIsSensorGlitchActive(nextState);
    if (nextState) {
      addChaosEvent(
        '⚠️ Sensor Noise & Actuator Packet Loss Injected',
        'Hardware telemetry corrupt. Fallback to graph time-series ML prediction engine.',
        'HIGH'
      );
    } else {
      addChaosEvent(
        '✅ Hardware Telemetry Restored',
        'Sensor loop integrity verified at 100% parity.',
        'WARNING'
      );
    }
  };

  const handleMegaSpike = () => {
    soundEffects.playClick();
    addChaosEvent(
      `⚡ Rush-Hour Traffic Deluge (${chaosLevel * 25} Vehicles)`,
      `Massive volume injected across all approaches. Adaptive cycle expanding to 120s max green.`,
      'HIGH'
    );
    if (onInjectSpike) {
      onInjectSpike('NORTH', chaosLevel * 10);
      onInjectSpike('SOUTH', chaosLevel * 8);
      onInjectSpike('EAST', chaosLevel * 12);
      onInjectSpike('WEST', chaosLevel * 9);
    }
  };

  return (
    <div className="card-modern p-6 rounded-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Chaos Mode &amp; Graph Stress-Test Sandbox
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                CHAOS ENGINE v2.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Inject catastrophic real-world disruptions to validate Neo4j graph self-healing algorithms.
            </p>
          </div>
        </div>
      </div>

      {/* Control Disruption Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Disruption 1: Multi-Vehicle Roadblock */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
            <AlertOctagon className="w-4 h-4" />
            <span>Accident Roadblock</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300">
            Simulate a 3-lane blockage on any approach road.
          </p>

          {activeRoadblock ? (
            <button
              onClick={handleClearRoadblock}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Clear {activeRoadblock} Roadblock
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as const).map((dir) => (
                <button
                  key={dir}
                  onClick={() => handleTriggerRoadblock(dir)}
                  className="py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-600 hover:text-white text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 text-[10px] font-bold transition cursor-pointer"
                >
                  Block {dir}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Disruption 2: VIP Convoy Cascade */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Flame className="w-4 h-4" />
            <span>Emergency Cascade</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300">
            Simulate VIP motorcade &amp; fire truck pre-emption.
          </p>
          <button
            onClick={handleVipConvoy}
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Dispatch Multi-Emergency
          </button>
        </div>

        {/* Disruption 3: Hardware Sensor Fault */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
            <Radio className="w-4 h-4" />
            <span>Sensor Glitch Injection</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300">
            Inject packet loss &amp; noise into IR loop sensors.
          </p>
          <button
            onClick={handleSensorGlitch}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
              isSensorGlitchActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {isSensorGlitchActive ? 'Disable Sensor Fault' : 'Inject Telemetry Glitch'}
          </button>
        </div>

        {/* Disruption 4: Traffic Volume Surge */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Volume Multiplier
            </span>
            <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
              {chaosLevel}x
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={chaosLevel}
            onChange={(e) => setChaosLevel(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <button
            onClick={handleMegaSpike}
            className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Inject {chaosLevel * 25} Vehicles
          </button>
        </div>
      </div>

      {/* Live Chaos Event Log */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-mono font-bold pb-2 border-b border-white/10">
          <span className="flex items-center gap-2 text-rose-400">
            <ShieldAlert className="w-4 h-4" />
            <span>LIVE STRESS-TEST EVENT STREAM</span>
          </span>
          <span className="text-[10px] text-slate-400">RESILIENCE SCORE: 98.4%</span>
        </div>

        <div className="space-y-1.5 max-h-36 overflow-y-auto">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="flex items-start justify-between gap-3 text-xs p-2 rounded-xl bg-white/5 border border-white/5"
            >
              <div>
                <span className="font-bold text-slate-200">{ev.title}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">{ev.impact}</p>
              </div>
              <span className="text-[10px] font-mono text-slate-500 shrink-0">{ev.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
