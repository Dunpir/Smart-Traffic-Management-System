import React, { useState, useEffect } from 'react';
import {
  Footprints,
  Volume2,
  VolumeX,
  Accessibility,
  Hand,
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
    <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] space-y-3.5 text-slate-900 dark:text-white transition shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-[#1f1f23]">
        <div className="flex items-center gap-2">
          <Footprints className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Pedestrian Crosswalk Actuator (PAB)
            </h3>
            <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500">
              Pelican &amp; Puffin Intelligent Safe All-Red Vehicular Hold
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => {
              soundEffects.playClick();
              setAudioEnabled(!audioEnabled);
            }}
            className={`p-1 rounded border transition cursor-pointer ${
              audioEnabled
                ? 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-zinc-900 dark:text-white dark:border-zinc-700'
                : 'bg-white text-slate-400 border-slate-200 dark:bg-black dark:text-zinc-600 dark:border-zinc-800'
            }`}
            title={audioEnabled ? 'Acoustic Chirp Enabled' : 'Acoustic Chirp Muted'}
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setAccessibleMode(!accessibleMode);
            }}
            className={`px-2 py-0.5 rounded border text-[11px] font-mono transition cursor-pointer flex items-center gap-1 ${
              accessibleMode
                ? 'bg-slate-900 text-white font-semibold border-slate-900 dark:bg-white dark:text-black dark:border-white'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800 dark:hover:text-white'
            }`}
            title="Visually Impaired & Senior Mode (+6s)"
          >
            <Accessibility className="w-3 h-3" />
            <span>{accessibleMode ? 'Accessible (+6s)' : 'Standard'}</span>
          </button>
        </div>
      </div>

      {/* Main Display & Button */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Left: Walking Signal Box */}
        <div
          className={`p-4 rounded-lg border flex flex-col items-center justify-center text-center transition ${
            isWalkPhase
              ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-950/30 dark:border-emerald-500'
              : isWaiting
              ? 'bg-amber-50 border-amber-500 dark:bg-amber-950/30 dark:border-amber-500'
              : 'bg-slate-50 dark:bg-black border-slate-200 dark:border-[#1f1f23]'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-1.5 border ${
              isWalkPhase
                ? 'bg-emerald-500 text-white border-emerald-400'
                : 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800'
            }`}
          >
            {isWalkPhase ? (
              <Footprints className="w-5 h-5 text-white" />
            ) : (
              <Hand className="w-5 h-5" />
            )}
          </div>

          <div
            className={`text-xs font-bold font-mono tracking-wider uppercase ${
              isWalkPhase ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-zinc-300'
            }`}
          >
            {isWalkPhase ? 'WALK - SAFE TO CROSS' : isWaiting ? 'WAIT - SCHEDULED' : "DON'T WALK"}
          </div>

          <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 mt-0.5">
            {isWalkPhase ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                {state.countdown}s REMAINING (ALL-RED HOLD)
              </span>
            ) : isWaiting ? (
              <span className="text-amber-700 dark:text-amber-400">
                Scheduled on next phase ({state.waitingPedestrians} waiting)
              </span>
            ) : (
              <span>Press call button below to request crossing</span>
            )}
          </div>
        </div>

        {/* Right: PAB Push Button */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] flex flex-col justify-between space-y-2">
          <div>
            <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase block">
              Pedestrian Actuation
            </span>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
              Press to schedule safe clearance window across 4-way intersection.
            </p>
          </div>

          <button
            onClick={() => handlePressCallButton('ALL')}
            disabled={isRequesting || isWalkPhase}
            className={`w-full py-2.5 rounded font-mono text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
              isWalkPhase
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-700 cursor-default'
                : isWaiting
                ? 'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700'
                : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>
              {isWalkPhase
                ? `Crossing Active (${state.countdown}s)`
                : isWaiting
                ? `Queued (${state.waitingPedestrians} Waiting)`
                : 'Press to Cross (PAB)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
