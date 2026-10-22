import React, { useState, useEffect, useRef } from 'react';
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
  TrendingDown,
  Activity,
  Layers,
  ArrowLeftRight,
} from 'lucide-react';
import { CorridorJunction, GreenWaveConfig, LightState, Direction } from '../../types';
import { soundEffects } from '../../utils/soundEffects';

interface CorridorVisualizerProps {
  junctions: CorridorJunction[];
  config: GreenWaveConfig;
  onToggleGreenWave: () => void;
  onTriggerEmergencyCorridor: () => void;
  onAdjustSpeed: (speed: number) => void;
  onToggleDirection?: () => void;
}

export const CorridorVisualizer: React.FC<CorridorVisualizerProps> = ({
  junctions,
  config,
  onToggleGreenWave,
  onTriggerEmergencyCorridor,
  onAdjustSpeed,
  onToggleDirection,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<'HIGHWAY' | 'TIME_SPACE'>('HIGHWAY');

  // Animated vehicles traveling through the 3-node highway corridor
  const vehiclesRef = useRef<
    Array<{
      id: number;
      x: number;
      lane: number;
      speed: number;
      isEmergency: boolean;
      color: string;
      length: number;
      isStopped: boolean;
    }>
  >([
    { id: 1, x: 20, lane: 0, speed: 1.8, isEmergency: false, color: '#38bdf8', length: 18, isStopped: false },
    { id: 2, x: 70, lane: 1, speed: 1.6, isEmergency: false, color: '#34d399', length: 26, isStopped: false },
    { id: 3, x: 140, lane: 0, speed: 1.9, isEmergency: false, color: '#f59e0b', length: 18, isStopped: false },
    { id: 4, x: 280, lane: 1, speed: 1.7, isEmergency: false, color: '#a78bfa', length: 18, isStopped: false },
    { id: 5, x: 420, lane: 0, speed: 1.5, isEmergency: false, color: '#f43f5e', length: 24, isStopped: false },
  ]);

  // Main animated Highway Corridor render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // 1. Draw highway surface background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Asphalt Road
      const roadTop = 30;
      const roadH = h - 60;
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, roadTop, w, roadH);

      // Road Borders
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, roadTop);
      ctx.lineTo(w, roadTop);
      ctx.moveTo(0, roadTop + roadH);
      ctx.lineTo(w, roadTop + roadH);
      ctx.stroke();

      // Dashed lane divider
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([14, 10]);
      ctx.beginPath();
      ctx.moveTo(0, roadTop + roadH / 2);
      ctx.lineTo(w, roadTop + roadH / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Green wave progression band glow
      if (config.enabled) {
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.05)');
        grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.22)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0.05)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, roadTop, w, roadH);
      }

      // 2. Render 3 Junction Stop-Lines & Traffic Signal Towers
      const jPositions = [w * 0.18, w * 0.54, w * 0.90];

      junctions.forEach((j, idx) => {
        const jX = jPositions[idx];
        const isGreen = j.currentSignal === 'GREEN';
        const isYellow = j.currentSignal === 'YELLOW';

        // Stop line on road
        ctx.strokeStyle = isGreen ? '#10b981' : isYellow ? '#f59e0b' : '#ef4444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(jX, roadTop);
        ctx.lineTo(jX, roadTop + roadH);
        ctx.stroke();

        // Gantry Structure on top
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(jX - 16, 4, 32, 22);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.strokeRect(jX - 16, 4, 32, 22);

        // Signal Lenses
        const rColor = j.currentSignal === 'RED' ? '#ef4444' : '#450a0a';
        const yColor = j.currentSignal === 'YELLOW' ? '#f59e0b' : '#451a03';
        const gColor = j.currentSignal === 'GREEN' ? '#10b981' : '#022c22';

        const drawLight = (lx: number, color: string, glow: boolean) => {
          ctx.beginPath();
          ctx.arc(lx, 15, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          if (glow) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        };

        drawLight(jX - 8, rColor, j.currentSignal === 'RED');
        drawLight(jX, yColor, j.currentSignal === 'YELLOW');
        drawLight(jX + 8, gColor, j.currentSignal === 'GREEN');

        // Node ID & countdown text under road
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = isGreen ? '#34d399' : '#f87171';
        ctx.textAlign = 'center';
        ctx.fillText(`${j.junctionId} (${j.phaseTimeRemaining}s)`, jX, h - 10);
        ctx.fillStyle = '#64748b';
        ctx.font = '8px monospace';
        ctx.fillText(idx === 0 ? '0m' : idx === 1 ? '+450m' : '+1050m', jX, h - 2);
      });

      // 3. Move and Render Highway Vehicles
      vehiclesRef.current.forEach((veh) => {
        const laneY = veh.lane === 0 ? roadTop + 14 : roadTop + roadH / 2 + 14;

        // Check if stopped at red light
        let stopped = false;
        junctions.forEach((j, idx) => {
          const jX = jPositions[idx];
          const isRed = j.currentSignal === 'RED' || j.currentSignal === 'YELLOW';
          if (isRed && veh.x > jX - 35 && veh.x < jX) {
            stopped = true;
          }
        });

        veh.isStopped = stopped;

        if (!veh.isStopped || config.activeEmergencyCorridor) {
          const speedMultiplier = (config.targetSpeedKmh / 45) * (config.enabled ? 1.35 : 0.95);
          veh.x += veh.speed * speedMultiplier;
          if (veh.x > w + 40) {
            veh.x = -40;
          }
        }

        // Vehicle body
        ctx.fillStyle = veh.isEmergency ? '#ef4444' : veh.color;
        ctx.beginPath();
        ctx.roundRect(veh.x, laneY, veh.length, 14, 3);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Headlights
        ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
        ctx.beginPath();
        ctx.moveTo(veh.x + veh.length, laneY + 2);
        ctx.lineTo(veh.x + veh.length + 28, laneY - 4);
        ctx.lineTo(veh.x + veh.length + 28, laneY + 18);
        ctx.lineTo(veh.x + veh.length, laneY + 12);
        ctx.closePath();
        ctx.fill();

        // Emergency Flashing Beacon
        if (config.activeEmergencyCorridor || veh.isEmergency) {
          const strobe = Math.sin(Date.now() * 0.02) > 0;
          ctx.fillStyle = strobe ? '#ef4444' : '#3b82f6';
          ctx.beginPath();
          ctx.arc(veh.x + veh.length / 2, laneY + 7, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [junctions, config]);

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
    <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] relative overflow-hidden text-slate-900 dark:text-white shadow-xs transition-colors space-y-4">
      {/* Header & Mode Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#1f1f23]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
            <Navigation className="w-4 h-4 text-emerald-500" />
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

        {/* Speed Advisor & View Tabs */}
        <div className="flex items-center gap-2">
          {/* VMS Speed Advisor Signboard */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] px-3 py-1.5 rounded-md text-xs font-mono">
            <Gauge className="w-4 h-4 text-emerald-500" />
            <div>
              <span className="text-[9px] text-slate-500 dark:text-zinc-500 uppercase block">VMS Advisory</span>
              <div className="font-bold text-slate-900 dark:text-white">{config.targetSpeedKmh} km/h Cruise</div>
            </div>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-black p-1 rounded-lg border border-slate-200 dark:border-[#1f1f23] text-xs font-mono">
            <button
              onClick={() => {
                soundEffects.playTabSwitch();
                setActiveTab('HIGHWAY');
              }}
              className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                activeTab === 'HIGHWAY'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Platoon View
            </button>
            <button
              onClick={() => {
                soundEffects.playTabSwitch();
                setActiveTab('TIME_SPACE');
              }}
              className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                activeTab === 'TIME_SPACE'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Time-Space (TSD)
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Highway or Time-Space Diagram */}
      {activeTab === 'HIGHWAY' ? (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          {/* Dynamic LED Highway VMS Banner */}
          <div className="p-2 rounded-lg bg-black border border-amber-500/40 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-bold text-amber-300">
                VARIABLE MESSAGE SIGN: MAINTAIN {config.targetSpeedKmh} KM/H • ZERO-STOP WAVE ACTIVE
              </span>
            </div>
            <span className="text-emerald-400 font-bold text-[11px]">
              EST. TRANSIT: 36.4s (3 NODES)
            </span>
          </div>

          {/* Animated 2D Highway Canvas */}
          <div className="relative w-full rounded-lg overflow-hidden border border-slate-800">
            <canvas ref={canvasRef} width={800} height={160} className="w-full h-40" />
          </div>

          <div className="flex justify-between items-center px-2 text-[11px] font-mono text-slate-400">
            <span>Origin: J001 (Central Hub)</span>
            <span className="text-emerald-400 font-bold">Progression Wave Speed: {config.targetSpeedKmh} km/h</span>
            <span>Terminus: J003 (Airport Node)</span>
          </div>
        </div>
      ) : (
        /* Interactive Time-Space Diagram (TSD) */
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs text-white">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="font-bold uppercase tracking-wider">Arterial Time-Space Progression Graph</span>
            </div>
            <span className="text-emerald-400 text-[10px]">Slope = Speed ({config.targetSpeedKmh} km/h)</span>
          </div>

          <div className="p-4 rounded-lg bg-black border border-zinc-800 space-y-4">
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">J001 (Central Hub - 0m):</span>
                <span className="text-emerald-400 font-bold">Offset: 0s [GREEN BAND: 0s - 45s]</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">J002 (Tech Park - 450m):</span>
                <span className="text-emerald-400 font-bold">Offset: +36s [GREEN BAND: 36s - 76s]</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">J003 (Airport Node - 1050m):</span>
                <span className="text-emerald-400 font-bold">Offset: +84s [GREEN BAND: 84s - 134s]</span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300">
              💡 <strong>Traffic Law:</strong> When vehicles cruise inside the continuous green progression bandwidth, signal stops are eliminated across all consecutive signals, maximizing arterial corridor throughput.
            </div>
          </div>
        </div>
      )}

      {/* 3-Junction Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
        <div className="flex flex-wrap items-center gap-2">
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

          {/* Speed Preset Buttons */}
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

        {/* 3-Node Emergency Wave Button */}
        <button
          onClick={onTriggerEmergencyCorridor}
          className={`px-3.5 py-1.5 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-md ${
            config.activeEmergencyCorridor
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900'
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

