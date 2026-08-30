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
import { soundEffects } from '../../utils/soundEffects';

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
    soundEffects.playClick();
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
    <div className="bg-[#0a0a0a] p-5 rounded-xl border border-[#27272a] hover:border-zinc-700 space-y-4 text-white transition">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1f1f23]">
        <div className="flex items-center gap-2">
          <Footprints className="w-4 h-4 text-cyan-400" />
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Smart Pedestrian &amp; Accessibility Crosswalk (PAB)
            </h3>
            <div className="text-[10px] font-mono text-zinc-500">
              Pelican / Puffin Intelligent Safe All-Red Vehicular Clearance
            </div>
          </div>
        </div>

        {/* Audio & Accessibility Toggles */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => {
              soundEffects.playClick();
              setAudioEnabled(!audioEnabled);
            }}
            className={`p-1.5 rounded-md border transition cursor-pointer ${
              audioEnabled
                ? 'bg-zinc-900 text-cyan-400 border-zinc-700'
                : 'bg-black text-zinc-600 border-zinc-800'
            }`}
            title={audioEnabled ? 'Acoustic Chirp Enabled' : 'Acoustic Chirp Muted'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setAccessibleMode(!accessibleMode);
            }}
            className={`px-2 py-1 rounded-md border text-[11px] font-mono transition cursor-pointer flex items-center gap-1 ${
              accessibleMode
                ? 'bg-white text-black font-semibold border-white'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
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
          className={`p-5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
            isWalkPhase
              ? 'bg-emerald-950/60 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.3)] animate-pulse'
              : isWaiting
              ? 'bg-amber-950/40 border-amber-500'
              : 'bg-black border-[#27272a]'
          }`}
        >
          {/* Signal Indicator Graphic */}
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 border ${
              isWalkPhase
                ? 'bg-emerald-500 text-white border-emerald-300 shadow-emerald-500/50 scale-105'
                : 'bg-red-950/80 text-red-400 border-red-800'
            }`}
          >
            {isWalkPhase ? (
              <Footprints className="w-7 h-7 animate-bounce" />
            ) : (
              <Hand className="w-7 h-7" />
            )}
          </div>

          <div
            className={`text-sm font-bold font-mono tracking-widest uppercase ${
              isWalkPhase ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {isWalkPhase ? 'WALK - SAFE TO CROSS' : isWaiting ? 'WAIT - SIGNAL QUEUED' : "DON'T WALK"}
          </div>

          <div className="text-[11px] font-mono text-zinc-400 mt-1">
            {isWalkPhase ? (
              <span className="text-emerald-300 font-bold font-mono">
                {state.countdown}s REMAINING (ALL RED VEHICLE HOLD)
              </span>
            ) : isWaiting ? (
              <span className="text-amber-400 font-medium">
                Clearance scheduled on next phase ({state.waitingPedestrians} waiting)
              </span>
            ) : (
              <span>Push button below to request crossing</span>
            )}
          </div>
        </div>

        {/* Right: PAB Push Button & Approach Triggers */}
        <div className="p-4 rounded-xl bg-black border border-[#27272a] flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <div className="text-[10px] font-mono text-zinc-500 uppercase font-semibold">
              Pedestrian Actuated Button (PAB)
            </div>
            <div className="text-xs text-zinc-300">
              Press to trigger safe pedestrian clearance interval across the 4-way intersection.
            </div>
          </div>

          {/* Vercel Style Pedestrian Call Button */}
          <button
            onClick={() => handlePressCallButton('ALL')}
            disabled={isRequesting || isWalkPhase}
            className={`w-full py-3 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isWalkPhase
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700 cursor-default'
                : isWaiting
                ? 'bg-amber-950 text-amber-300 border border-amber-700 animate-pulse'
                : 'bg-white hover:bg-zinc-200 text-black shadow-sm active:scale-98'
            }`}
          >
            <Footprints className="w-4 h-4" />
            <span>
              {isWalkPhase
                ? `Crossing In Progress (${state.countdown}s)`
                : isWaiting
                ? `Wait for Green Walk (${state.waitingPedestrians} Waiting)`
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
                className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-center transition cursor-pointer"
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
