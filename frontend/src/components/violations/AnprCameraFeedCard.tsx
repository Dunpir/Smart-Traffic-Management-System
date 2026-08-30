import React, { useState } from 'react';
import { Camera, ShieldAlert, Zap, Radio, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { ViolationRecord, Direction } from '../../types';
import { playViolationAlarm } from '../../utils/audioBeep';

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
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>ANPR Optical License Plate Scanner (Live OCR Feed)</span>
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Direction:</span>
          <select
            value={selectedDirection}
            onChange={(e) => setSelectedDirection(e.target.value as Direction)}
            className="bg-slate-900 border border-slate-700 text-cyan-400 font-bold px-2 py-1 rounded text-xs focus:outline-none"
          >
            <option value="NORTH">North Boulevard</option>
            <option value="SOUTH">South Avenue</option>
            <option value="EAST">East Highway</option>
            <option value="WEST">West Expressway</option>
          </select>
        </div>
      </div>

      {/* Simulated Camera Viewport */}
      <div className="relative aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col justify-between p-4 group">
        {/* Subtle camera scanline overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

        {/* Laser scan animation line */}
        {isScanning && (
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#06b6d4] animate-[bounce_3s_infinite]" />
        )}

        {/* Viewport HUD Corner Brackets */}
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400/80" />
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400/80" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-400/80" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-400/80" />

        {/* Top HUD Info */}
        <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-cyan-400">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur px-2.5 py-1 rounded-lg border border-cyan-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>CAM_ANPR_{selectedDirection}_4K</span>
            <span className="text-slate-400">|</span>
            <span>60 FPS</span>
          </div>

          <div className="flex items-center gap-2 bg-black/60 backdrop-blur px-2.5 py-1 rounded-lg border border-cyan-500/30">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>RADAR ACTIVE</span>
          </div>
        </div>

        {/* Center ANPR Target Box */}
        <div className="relative z-10 mx-auto max-w-sm w-full p-4 rounded-xl bg-black/70 backdrop-blur border border-cyan-500/40 shadow-2xl flex flex-col items-center text-center">
          <div className="text-[10px] font-mono font-bold tracking-wider text-cyan-400 uppercase mb-1">
            ANPR OCR RECOGNITION BOX
          </div>

          {/* License Plate Display (IndiPlate Standard) */}
          <div className="px-4 py-2 rounded-lg bg-amber-300 text-black font-mono font-black text-xl tracking-widest border-2 border-black shadow-md flex items-center gap-2">
            <span className="text-xs bg-blue-700 text-white px-1 py-0.5 rounded font-bold">IND</span>
            <span>{latestViolation ? latestViolation.plateNumber : 'DL 01 AB 1234'}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full mt-3 text-[10px] font-mono">
            <div className="p-1.5 rounded bg-slate-900/90 border border-slate-800">
              <div className="text-slate-400">CONFIDENCE</div>
              <div className="text-emerald-400 font-bold">
                {latestViolation ? `${latestViolation.anprConfidence}%` : '98.6%'}
              </div>
            </div>
            <div className="p-1.5 rounded bg-slate-900/90 border border-slate-800">
              <div className="text-slate-400">SPEED RADAR</div>
              <div className="text-rose-400 font-bold">
                {latestViolation ? `${latestViolation.speedKmh} km/h` : '48 km/h'}
              </div>
            </div>
            <div className="p-1.5 rounded bg-slate-900/90 border border-slate-800">
              <div className="text-slate-400">VEHICLE TYPE</div>
              <div className="text-cyan-300 font-bold">
                {latestViolation ? latestViolation.vehicleType : 'CAR'}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom HUD Banner */}
        <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div className="bg-black/60 px-2 py-0.5 rounded">LATENCY: 18ms</div>
          <div className="bg-black/60 px-2 py-0.5 rounded text-emerald-400">
            AUTO-E-CHALLAN GENERATOR READY
          </div>
        </div>
      </div>

      {/* Simulator Action Buttons for Live Demo */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
          Simulate Camera Violation Triggers ({selectedDirection} Approach):
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => handleSimulate('RED_LIGHT_JUMP')}
            className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-600/40 text-xs font-semibold font-mono transition-all hover:scale-[1.02]"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Red Light Jump</span>
          </button>

          <button
            onClick={() => handleSimulate('SPEED_VIOLATION', 84)}
            className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-600/40 text-xs font-semibold font-mono transition-all hover:scale-[1.02]"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Overspeed (84km/h)</span>
          </button>

          <button
            onClick={() => handleSimulate('ILLEGAL_TURN')}
            className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-600/40 text-xs font-semibold font-mono transition-all hover:scale-[1.02]"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Illegal U-Turn</span>
          </button>

          <button
            onClick={() => handleSimulate('ZEBRA_CROSSING_BLOCK')}
            className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-600/40 text-xs font-semibold font-mono transition-all hover:scale-[1.02]"
          >
            <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Zebra Cross Block</span>
          </button>
        </div>
      </div>
    </div>
  );
};
