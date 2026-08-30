import React, { useState, useEffect } from 'react';
import {
  Footprints,
  Volume2,
  VolumeX,
  Accessibility,
  CheckCircle,
  Clock,
  Hand,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { PedestrianCrosswalkState, Direction } from '../../types';
import {
  playPedestrianWalkChirp,
  playPedestrianButtonChime,
} from '../../utils/audioBeep';

interface PedestrianCrosswalkCardProps {
  pedestrianState?: PedestrianCrosswalkState | null;
  onRequestCrossing: (direction: Direction | 'ALL', accessibleMode: boolean) => Promise<void>;
}

export const PedestrianCrosswalkCard: React.FC<PedestrianCrosswalkCardProps> = ({
  pedestrianState,
  onRequestCrossing,
}) => {
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [accessibleMode, setAccessibleMode] = useState<boolean>(false);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);

  const state: PedestrianCrosswalkState = pedestrianState || {
    isActive: false,
    requestedDirection: 'ALL',
    phase: 'IDLE',
    countdown: 0,
    waitingPedestrians: 0,
    audioChirpActive: false,
    accessibleMode: false,
    safeClearanceDuration: 12,
  };

  const isWalkPhase = state.phase === 'WALK';
  const isWaiting = state.phase === 'WAITING';

  // Trigger acoustic chirp every 400ms during safe WALK phase if audio is enabled
  useEffect(() => {
    if (!isWalkPhase || !audioEnabled) return;

    const interval = setInterval(() => {
      playPedestrianWalkChirp();
    }, 400);

    return () => clearInterval(interval);
  }, [isWalkPhase, audioEnabled]);

  const handlePressCallButton = async (dir: Direction | 'ALL' = 'ALL') => {
    setIsRequesting(true);
    if (audioEnabled) {
      playPedestrianButtonChime();
    }
    try {
      await onRequestCrossing(dir, accessibleMode);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Footprints className="w-4 h-4 text-cyan-400" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Smart Pedestrian &amp; Accessibility Crosswalk (PAB)
            </h3>
            <div className="text-[10px] font-mono text-slate-400">
              Pelican / Puffin Intelligent Safe All-Red Vehicular Clearance
            </div>
          </div>
        </div>

        {/* Audio & Accessibility Toggles */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-1.5 rounded-lg border transition ${audioEnabled
              ? 'bg-cyan-950 text-cyan-400 border-cyan-700'
              : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            title={audioEnabled ? 'Acoustic Chirp Enabled' : 'Acoustic Chirp Muted'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setAccessibleMode(!accessibleMode)}
            className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 ${accessibleMode
              ? 'bg-rose-950 text-rose-300 border-rose-600 shadow-md shadow-rose-950/50'
              : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            title="Visually Impaired & Senior Extended Window Mode (18s)"
          >
            <Accessibility className="w-3.5 h-3.5" />
            <span>{accessibleMode ? 'Accessible (+6s)' : 'Standard'}</span>
          </button>
        </div>
      </div>

      {/* Main Walk / Don't Walk Display & Countdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left: Pelican Walking Light Box */}
        <div
          className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all ${isWalkPhase
            ? 'bg-emerald-950/60 border-emerald-500 shadow-[0_0_25px_#10b981] animate-pulse'
            : isWaiting
              ? 'bg-amber-950/40 border-amber-500'
              : 'bg-slate-950 border-slate-800'
            }`}
        >
          {/* Signal Indicator Graphic */}
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 shadow-xl border-2 ${isWalkPhase
              ? 'bg-emerald-500 text-white border-emerald-300 shadow-emerald-500/50 scale-110'
              : 'bg-rose-950 text-rose-500 border-rose-800'
              }`}
          >
            {isWalkPhase ? (
              <Footprints className="w-8 h-8 animate-bounce" />
            ) : (
              <Hand className="w-8 h-8" />
            )}
          </div>

          <div
            className={`text-base font-black font-mono tracking-widest uppercase ${isWalkPhase ? 'text-emerald-400' : 'text-rose-400'
              }`}
          >
            {isWalkPhase ? 'WALK - SAFE TO CROSS' : isWaiting ? 'WAIT - SIGNAL QUEUED' : "DON'T WALK"}
          </div>

          <div className="text-[11px] font-mono text-slate-400 mt-1">
            {isWalkPhase ? (
              <span className="text-emerald-300 font-bold font-mono">
                {state.countdown}s REMAINING (ALL RED VEHICLE HOLD)
              </span>
            ) : isWaiting ? (
              <span className="text-amber-400 font-bold">
                Clearance scheduled on next phase ({state.waitingPedestrians} waiting)
              </span>
            ) : (
              <span>Push button below to request crossing</span>
            )}
          </div>
        </div>

        {/* Right: PAB Push Button & Approach Triggers */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">
              Pedestrian Actuated Button (PAB)
            </div>
            <div className="text-xs text-slate-300 font-mono">
              Press to trigger safe pedestrian clearance interval across the 4-way intersection.
            </div>
          </div>

          {/* Large Yellow Pedestrian Call Button */}
          <button
            onClick={() => handlePressCallButton('ALL')}
            disabled={isRequesting || isWalkPhase}
            className={`w-full py-3.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2 ${isWalkPhase
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-600 cursor-default'
              : isWaiting
                ? 'bg-amber-950 text-amber-300 border border-amber-600 animate-pulse'
                : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-amber-950/60 hover:scale-105 active:scale-95'
              }`}
          >
            <Footprints className="w-5 h-5" />
            <span>
              {isWalkPhase
                ? `Crossing In Progress (${state.countdown}s)`
                : isWaiting
                  ? `Wait for Green Walk (${state.waitingPedestrians} Pedestrians)`
                  : 'Press to Cross Road (PAB)'}
            </span>
          </button>

          {/* Sub Approaches */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            {(['NORTH', 'SOUTH'] as Direction[]).map((d) => (
              <button
                key={d}
                onClick={() => handlePressCallButton(d)}
                disabled={isWalkPhase}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-center transition"
              >
                {d} Crosswalk
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
