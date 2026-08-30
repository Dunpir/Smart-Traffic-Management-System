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
    <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-3">
      {/* Top Bar: Mode Switcher & Snapshot Info */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mode Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleReplayMode(!isReplaying)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${isReplaying
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{isReplaying ? 'Replay Mode Active' : 'Switch to Replay Mode'}</span>
          </button>

          {!isReplaying && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              LIVE STREAM
            </span>
          )}
        </div>

        {/* Center: Current Snapshot Metadata */}
        {isReplaying && currentSnapshot && (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            <span>Time: </span>
            <strong className="text-slate-900">{currentSnapshot.timeFormatted}</strong>
            <span>•</span>
            <span>Phase: </span>
            <strong className="text-teal-700">
              {currentSnapshot.activeDirection} ({currentSnapshot.currentPhase})
            </strong>
            {currentSnapshot.isEmergency && (
              <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                🚨 {currentSnapshot.emergencyVehicle || 'EMERGENCY'}
              </span>
            )}
          </div>
        )}

        {/* Right: Controls & Speed */}
        {isReplaying && (
          <div className="flex items-center gap-2">
            {/* Speed Selector */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
              {([1, 2, 5] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => onChangeSpeed(spd)}
                  className={`px-2 py-0.5 rounded font-bold ${playbackSpeed === spd
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Playback Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onStep('prev')}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                title="Step backward"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onTogglePlay}
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={() => onStep('next')}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
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
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 px-1 font-mono">
            <span>{snapshots[0]?.timeFormatted || '00:00:00'}</span>
            <span>{snapshots[snapshots.length - 1]?.timeFormatted || 'Live'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
