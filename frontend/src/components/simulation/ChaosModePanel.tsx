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
  const [chaosLevel, setChaosLevel] = useState<number>(1);
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
    setIsSensorGlitchActive(!isSensorGlitchActive);
    if (!isSensorGlitchActive) {
      addChaosEvent(
        '⚠️ IoT Optical Camera Distortion',
        'Camera 3 (East) packet loss. Kalman filter failover active.',
        'HIGH'
      );
    } else {
      addChaosEvent(
        '✅ IoT Optical Feed Restored',
        'Telemetry re-synchronized with Neo4j real-time state database.',
        'WARNING'
      );
    }
  };

  return (
    <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] text-slate-900 dark:text-white transition shadow-xs">
      {/* Title Bar */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-[#1f1f23] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300">
            <Flame className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Chaos Engineering Sandbox
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono">
              Simulate high-concurrency traffic gridlocks, collisions, and sensor anomalies
            </p>
          </div>
        </div>

        {/* Severity Badge */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[10px] text-slate-500 dark:text-zinc-500">STRESS LEVEL:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  soundEffects.playClick();
                  setChaosLevel(lvl);
                  addChaosEvent(
                    `⚡ Grid Stress Level ${lvl} Activated`,
                    `Traffic throughput tested under ${lvl * 25}% peak saturation capacity.`,
                    lvl > 3 ? 'CRITICAL' : 'WARNING'
                  );
                }}
                className={`w-6 h-6 rounded text-[11px] font-bold transition cursor-pointer ${
                  chaosLevel === lvl
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (7 cols): Interactive Disruption Triggers */}
        <div className="lg:col-span-7 space-y-3">
          <h4 className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider">
            Simulate Physical Incidents &amp; Overrides
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Roadblock Trigger */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Block Road Approach</span>
                {activeRoadblock && (
                  <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400">
                    {activeRoadblock} BLOCKED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-sans">
                Simulate lane blockage collision.
              </p>

              {activeRoadblock ? (
                <button
                  onClick={handleClearRoadblock}
                  className="w-full py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white text-xs font-semibold transition cursor-pointer"
                >
                  Clear Roadblock
                </button>
              ) : (
                <div className="grid grid-cols-4 gap-1 font-mono text-[10px]">
                  {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleTriggerRoadblock(r)}
                      className="py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 transition cursor-pointer text-center"
                    >
                      {r[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* VIP Convoy Priority */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">VIP / Fire Brigade Cascade</span>
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-sans">
                Trigger emergency pre-emption sequence.
              </p>
              <button
                onClick={handleVipConvoy}
                className="w-full py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                Dispatch VIP Cascade
              </button>
            </div>

            {/* Camera Sensor Distort */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">IoT Optical Sensor Failover</span>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    isSensorGlitchActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-zinc-500'
                  }`}
                >
                  {isSensorGlitchActive ? 'GLITCH INJECTED' : 'NOMINAL'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-sans">
                Inject intermittent packet loss on edge sensor inputs to test Kalman filter estimation.
              </p>
              <button
                onClick={handleSensorGlitch}
                className={`w-full py-1.5 rounded text-xs font-semibold transition cursor-pointer ${
                  isSensorGlitchActive
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800'
                }`}
              >
                {isSensorGlitchActive ? 'Restore Sensor Telemetry' : 'Inject Sensor Distortion'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Real-Time Incident Audit Log */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider">
              Real-Time Incident Stream
            </h4>
            <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">Live Audit</span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="p-2 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] text-xs font-mono space-y-0.5"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-slate-900 dark:text-white">{evt.title}</span>
                  <span className="text-slate-400 dark:text-zinc-500">{evt.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 font-sans">{evt.impact}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
