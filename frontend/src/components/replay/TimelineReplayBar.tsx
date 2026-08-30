import React from 'react';
import {
  Play,
  Pause,
  Clock,
  History,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { ReplayState } from '../../types';
import { soundEffects } from '../../utils/soundEffects';

interface TimelineReplayBarProps {
  replayState: ReplayState;
  onToggleReplayMode: (active: boolean) => void;
  onTogglePlay: () => void;
  onSeek: (index: number) => void;
  onChangeSpeed: (speed: 1 | 2 | 5) => void;
  onStep: (direction: 'prev' | 'next') => void;
}

export const TimelineReplayBar: React.FC<TimelineReplayBarProps> = ({
  replayState,
  onToggleReplayMode,
  onTogglePlay,
  onSeek,
  onChangeSpeed,
  onStep,
}) => {
  const { isReplaying, isPlaying, playbackSpeed, currentIndex, snapshots } = replayState;
  const currentSnapshot = snapshots[currentIndex] || snapshots[snapshots.length - 1];

  return (
    <div className="bg-[#0a0a0a] p-4 rounded-xl border border-[#27272a] hover:border-zinc-700 text-white flex flex-col gap-3 transition">
      {/* Top Bar: Mode Switcher & Snapshot Info */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mode Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundEffects.playClick();
              onToggleReplayMode(!isReplaying);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-2 ${
              isReplaying
                ? 'bg-amber-400 text-black shadow-xs'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{isReplaying ? 'Replay Mode Active' : 'Switch to Replay Mode'}</span>
          </button>

          {!isReplaying && (
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE TELEMETRY STREAM
            </span>
          )}
        </div>

        {/* Center: Current Snapshot Metadata */}
        {isReplaying && currentSnapshot && (
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-300 bg-black px-3 py-1.5 rounded-md border border-[#27272a]">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Time: </span>
            <strong className="text-white">{currentSnapshot.timeFormatted}</strong>
            <span className="text-zinc-600">·</span>
            <span>Phase: </span>
            <strong className="text-emerald-400">
              {currentSnapshot.activeDirection} ({currentSnapshot.currentPhase})
            </strong>
            {currentSnapshot.isEmergency && (
              <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 text-[10px] font-mono border border-red-800">
                🚨 {currentSnapshot.emergencyVehicle || 'EMERGENCY'}
              </span>
            )}
          </div>
        )}

        {/* Right: Controls & Speed */}
        {isReplaying && (
          <div className="flex items-center gap-2">
            {/* Speed Selector */}
            <div className="flex items-center bg-zinc-900 p-0.5 rounded-md border border-zinc-800 text-[10px] font-mono font-medium">
              {([1, 2, 5] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => {
                    soundEffects.playClick();
                    onChangeSpeed(spd);
                  }}
                  className={`px-2 py-0.5 rounded font-mono ${
                    playbackSpeed === spd
                      ? 'bg-white text-black font-bold shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Playback Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  soundEffects.playClick();
                  onStep('prev');
                }}
                className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 cursor-pointer"
                title="Step backward"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  onTogglePlay();
                }}
                className="p-1.5 rounded-md bg-white hover:bg-zinc-200 text-black font-semibold cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  onStep('next');
                }}
                className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 cursor-pointer"
                title="Step forward"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scrubber Timeline Bar (Active in Replay Mode) */}
      {isReplaying && (
        <div className="space-y-1.5 pt-1">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={Math.max(snapshots.length - 1, 1)}
              value={currentIndex}
              onChange={(e) => onSeek(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-zinc-500 px-1 font-mono">
            <span>{snapshots[0]?.timeFormatted || '00:00:00'}</span>
            <span>{snapshots[snapshots.length - 1]?.timeFormatted || 'Live'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
