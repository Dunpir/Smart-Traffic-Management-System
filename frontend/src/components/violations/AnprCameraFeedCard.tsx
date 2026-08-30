import React, { useState } from 'react';
import { Camera, ShieldAlert, Zap, Radio, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { ViolationRecord, Direction } from '../../types';
import { playViolationAlarm } from '../../utils/audioBeep';
import { soundEffects } from '../../utils/soundEffects';

interface AnprCameraFeedCardProps {
  onTriggerViolation: (direction: Direction, violationType: any, speedKmh?: number) => void;
  latestViolation: ViolationRecord | null;
}

export const AnprCameraFeedCard: React.FC<AnprCameraFeedCardProps> = ({
  onTriggerViolation,
  latestViolation,
}) => {
  const [selectedDirection, setSelectedDirection] = useState<Direction>('NORTH');
  const [isScanning, setIsScanning] = useState<boolean>(true);

  const handleSimulate = (type: any, speed?: number) => {
    playViolationAlarm();
    onTriggerViolation(selectedDirection, type, speed);
  };

  return (
    <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] space-y-3.5 text-slate-900 dark:text-white transition shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-[#1f1f23]">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
            ANPR License Plate Scanner
          </h3>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-500 dark:text-zinc-400">Camera:</span>
          <select
            value={selectedDirection}
            onChange={(e) => {
              soundEffects.playClick();
              setSelectedDirection(e.target.value as Direction);
            }}
            className="bg-slate-100 dark:bg-[#141418] border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-bold px-2 py-0.5 rounded text-xs focus:outline-none"
          >
            <option value="NORTH">North Approach</option>
            <option value="SOUTH">South Approach</option>
            <option value="EAST">East Approach</option>
            <option value="WEST">West Approach</option>
          </select>
        </div>
      </div>

      {/* Simulated Camera Viewport */}
      <div className="relative aspect-video rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex flex-col justify-between p-4 group text-white">
        {/* Laser scan animation line */}
        {isScanning && (
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#06b6d4] animate-[bounce_3s_infinite]" />
        )}

        {/* Top HUD Info */}
        <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-zinc-300">
          <div className="flex items-center gap-2 bg-black/70 backdrop-blur px-2.5 py-1 rounded border border-zinc-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>CAM_ANPR_{selectedDirection}</span>
            <span className="text-zinc-600">|</span>
            <span>60 FPS</span>
          </div>

          <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur px-2.5 py-1 rounded border border-zinc-800 text-xs">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>RADAR ACTIVE</span>
          </div>
        </div>

        {/* Center ANPR Target Box */}
        <div className="relative z-10 mx-auto max-w-sm w-full p-3.5 rounded-lg bg-black/80 backdrop-blur border border-zinc-700 shadow-2xl flex flex-col items-center text-center">
          <div className="text-[10px] font-mono font-bold tracking-wider text-zinc-400 uppercase mb-1">
            ANPR OCR RECOGNITION BOX
          </div>

          {/* License Plate Display (IndiPlate Standard) */}
          <div className="px-4 py-1.5 rounded bg-amber-300 text-black font-mono font-black text-lg tracking-widest border-2 border-black shadow-md flex items-center gap-2">
            <span className="text-[10px] bg-blue-700 text-white px-1 py-0.2 rounded font-bold">IND</span>
            <span>{latestViolation ? latestViolation.plateNumber : 'DL 01 AB 1234'}</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 w-full mt-2.5 text-[10px] font-mono">
            <div className="p-1 rounded bg-zinc-900/90 border border-zinc-800">
              <div className="text-zinc-500">CONFIDENCE</div>
              <div className="text-emerald-400 font-bold">
                {latestViolation ? `${latestViolation.anprConfidence}%` : '98.6%'}
              </div>
            </div>
            <div className="p-1 rounded bg-zinc-900/90 border border-zinc-800">
              <div className="text-zinc-500">SPEED</div>
              <div className="text-rose-400 font-bold">
                {latestViolation ? `${latestViolation.speedKmh} km/h` : '48 km/h'}
              </div>
            </div>
            <div className="p-1 rounded bg-zinc-900/90 border border-zinc-800">
              <div className="text-zinc-500">VEHICLE</div>
              <div className="text-zinc-200 font-bold">
                {latestViolation ? latestViolation.vehicleType : 'CAR'}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom HUD Banner */}
        <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-zinc-400">
          <div className="bg-black/60 px-2 py-0.5 rounded">LATENCY: 18ms</div>
          <div className="bg-black/60 px-2 py-0.5 rounded text-emerald-400">
            AUTO-E-CHALLAN GENERATOR READY
          </div>
        </div>
      </div>

      {/* Simulator Action Buttons for Live Demo */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider">
          Simulate Camera Triggers ({selectedDirection} Approach):
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            onClick={() => handleSimulate('RED_LIGHT_JUMP')}
            className="flex items-center justify-center gap-1.5 p-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 text-xs font-semibold font-mono transition cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            <span>Red Light</span>
          </button>

          <button
            onClick={() => handleSimulate('SPEED_VIOLATION', 84)}
            className="flex items-center justify-center gap-1.5 p-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 text-xs font-semibold font-mono transition cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Overspeed</span>
          </button>

          <button
            onClick={() => handleSimulate('ILLEGAL_TURN')}
            className="flex items-center justify-center gap-1.5 p-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 text-xs font-semibold font-mono transition cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Illegal Turn</span>
          </button>

          <button
            onClick={() => handleSimulate('ZEBRA_CROSSING_BLOCK')}
            className="flex items-center justify-center gap-1.5 p-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 text-xs font-semibold font-mono transition cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Cross Block</span>
          </button>
        </div>
      </div>
    </div>
  );
};
