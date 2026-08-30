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
      onClick={onOpenInfo}
      className="w-full p-3 sm:p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:shadow-md card-modern bg-gradient-to-r from-red-50/70 via-rose-50/40 to-red-50/30 dark:from-red-950/40 dark:via-[#0c0d14] dark:to-red-950/30 border-red-200/80 dark:border-red-500/30 text-slate-800 dark:text-slate-100"
      title="Click to view detailed tab documentation & viva highlights"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-500/20">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-red-900 dark:text-red-400">
              {detail.badge}
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 hidden md:inline">
              • Click for Viva &amp; Architecture Details
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
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
          className="p-1.5 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-red-600 hover:text-white border border-slate-200 dark:border-white/10 text-red-600 dark:text-red-300 transition flex items-center gap-1 text-[11px] font-bold cursor-pointer"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Listen</span>
        </button>

        {/* Info Pill */}
        <div className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-extrabold transition shadow-xs flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          <span>Feature Info</span>
        </div>
      </div>
    </div>
  );
};
