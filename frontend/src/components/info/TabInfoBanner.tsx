import React from 'react';
import { Info, Sparkles, Volume2 } from 'lucide-react';
import { NavTab } from '../layout/Sidebar';
import { TAB_INFO_DIRECTORY } from './TabInfoModal';
import { soundEffects } from '../../utils/soundEffects';
import { voiceCommander } from '../../utils/voiceCommander';

interface TabInfoBannerProps {
  activeTab: NavTab;
  onOpenInfo: () => void;
}

export const TabInfoBanner: React.FC<TabInfoBannerProps> = ({ activeTab, onOpenInfo }) => {
  const detail = TAB_INFO_DIRECTORY[activeTab] || TAB_INFO_DIRECTORY.dashboard;

  const handleQuickListen = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playVoiceAck();
    voiceCommander.speak(detail.speechText);
  };

  return (
    <div
      onClick={() => {
        soundEffects.playClick();
        onOpenInfo();
      }}
      className="w-full p-3 rounded-xl border border-[#27272a] hover:border-zinc-700 bg-[#0a0a0a] hover:bg-[#0d0d0d] text-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
      title="Click to view detailed tab documentation & viva highlights"
    >
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center shrink-0">
          <Info className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white uppercase tracking-wide">
              {detail.badge}
            </span>
            <span className="text-[10px] font-mono text-zinc-500 hidden md:inline">
              · Viva &amp; Architecture Details
            </span>
          </div>
          <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5 font-sans">
            {detail.summary}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {/* Quick Listen Button */}
        <button
          type="button"
          onClick={handleQuickListen}
          title="Listen Aloud"
          className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition flex items-center gap-1 text-[11px] font-mono cursor-pointer"
        >
          <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden md:inline">Listen</span>
        </button>

        {/* Info Pill */}
        <div className="px-2.5 py-1 rounded-md bg-white hover:bg-zinc-200 text-black text-[11px] font-semibold transition flex items-center gap-1.5 shadow-xs">
          <Sparkles className="w-3 h-3" />
          <span>Documentation</span>
        </div>
      </div>
    </div>
  );
};
