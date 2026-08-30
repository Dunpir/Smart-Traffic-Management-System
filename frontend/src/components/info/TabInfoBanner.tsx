import React, { useState } from 'react';
import { Info, Volume2, Square, ArrowRight, Bot } from 'lucide-react';
import { NavTab } from '../layout/Sidebar';
import { TAB_INFO_DIRECTORY } from './TabInfoModal';
import { soundEffects } from '../../utils/soundEffects';
import { voiceCommander } from '../../utils/voiceCommander';

interface TabInfoBannerProps {
  activeTab: NavTab;
  onOpenInfo: () => void;
}

export const TabInfoBanner: React.FC<TabInfoBannerProps> = ({ activeTab, onOpenInfo }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const detail = TAB_INFO_DIRECTORY[activeTab] || TAB_INFO_DIRECTORY.dashboard;

  const handleQuickListen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      voiceCommander.stopSpeech();
      setIsPlaying(false);
    } else {
      soundEffects.playVoiceAck();
      setIsPlaying(true);
      voiceCommander.speak(detail.speechText);
    }
  };

  return (
    <div
      onClick={() => {
        soundEffects.playClick();
        onOpenInfo();
      }}
      className="w-full p-3 rounded-lg border border-slate-200 dark:border-[#1f1f23] hover:border-slate-300 dark:hover:border-[#333338] bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md text-slate-900 dark:text-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer shadow-xs"
      title="Click to view module documentation"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 flex items-center justify-center shrink-0">
          <Info className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              {detail.badge}
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 hidden md:inline">
              · Module Reference
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-1 mt-0.5 font-sans">
            {detail.summary}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <button
          type="button"
          onClick={handleQuickListen}
          title={isPlaying ? 'Stop Speech' : 'Listen to Neerja AI'}
          className={`px-2 py-1 rounded border transition flex items-center gap-1.5 text-[11px] font-mono cursor-pointer ${
            isPlaying
              ? 'bg-amber-500 text-black border-amber-600 animate-pulse font-semibold'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {isPlaying ? (
            <>
              <Square className="w-2.5 h-2.5 fill-current" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Bot className="w-3 h-3 text-sky-500" />
              <Volume2 className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
              <span className="hidden md:inline">Listen to AI</span>
            </>
          )}
        </button>

        <div className="px-2.5 py-1 rounded bg-slate-900 text-white dark:bg-white dark:text-black text-[11px] font-semibold transition flex items-center gap-1 shadow-xs">
          <span>Docs</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};
