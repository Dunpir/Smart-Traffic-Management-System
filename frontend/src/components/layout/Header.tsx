import React, { useState } from 'react';
import {
  Github,
  Volume2,
  VolumeX,
  Video,
  Mic,
  FileText,
  HelpCircle,
  GitBranch,
} from 'lucide-react';
import { DatabaseStatus, HardwareState, SimulationConfig } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { soundEffects } from '../../utils/soundEffects';

interface HeaderProps {
  dbStatus: DatabaseStatus | null;
  hardwareState: HardwareState | null;
  simConfig: SimulationConfig | null;
  onOpenDemo: () => void;
  onOpenAuditReport?: () => void;
  onOpenAboutUs?: () => void;
  onOpenMatrixWall?: () => void;
  onOpenVoiceCommand?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dbStatus,
  onOpenDemo,
  onOpenAuditReport,
  onOpenAboutUs,
  onOpenMatrixWall,
  onOpenVoiceCommand,
}) => {
  const { user, logout } = useAuth();
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(soundEffects.getIsMuted());
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);

  const isNeo4jOnline = dbStatus?.connected ?? false;

  const displayName = user?.name || user?.email?.split('@')[0] || 'Admin';
  const initials = displayName.slice(0, 2).toUpperCase();
  const userRole = user?.role || 'Administrator';

  const handleToggleAudio = () => {
    const nextMuted = soundEffects.toggleMute();
    setIsAudioMuted(nextMuted);
    if (!nextMuted) {
      soundEffects.playClick();
    }
  };

  return (
    <header className="w-full bg-white/90 dark:bg-black/75 backdrop-blur-md border-b border-slate-200 dark:border-[#1f1f23]/80 sticky top-0 z-40 text-slate-900 dark:text-[#ededed] transition-colors">
      {/* Sleek Single Top Navbar Row */}
      <div className="flex items-center justify-between px-4 sm:px-6 h-13">
        {/* Left: Trafix Brand + Breadcrumbs */}
        <div className="flex items-center gap-3">
          {/* Trafix Geometric Icon */}
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#0a0a0a]/90 border border-slate-300 dark:border-[#222226] flex items-center justify-center relative shadow-xs">
            <div className="flex flex-col gap-0.5 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-xs" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-xs" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-xs" />
            </div>
          </div>

          {/* Brand Title */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Trafix</span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 dark:bg-[#141417] dark:text-zinc-400 dark:border-[#222226]">
              STMS
            </span>
          </div>

          <span className="text-slate-300 dark:text-[#3f3f46] text-sm hidden sm:inline">/</span>

          {/* Project Breadcrumb */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer">
            <span className="text-slate-900 dark:text-white font-semibold">Smart-Traffic-Grid</span>
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-600 bg-slate-100 dark:text-zinc-400 dark:bg-zinc-900/80 px-1.5 py-0.2 rounded border border-slate-200 dark:border-zinc-800">
              <GitBranch className="w-2.5 h-2.5 text-slate-400 dark:text-zinc-500" />
              <span>BCNF</span>
            </div>
          </div>
        </div>

        {/* Right: Actions, Live Status, Feedback, Profile */}
        <div className="flex items-center gap-2">
          {/* Live Engine Status Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 dark:bg-[#0a0a0a]/80 dark:border-[#222226] text-[11px] font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isNeo4jOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-slate-800 dark:text-zinc-300">
              {isNeo4jOnline ? 'Neo4j Live' : 'Offline'}
            </span>
          </div>

          {/* Audio FX Toggle */}
          <button
            type="button"
            onClick={handleToggleAudio}
            title={isAudioMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5 transition border border-transparent hover:border-slate-200 dark:hover:border-[#222226] cursor-pointer"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
          </button>

          {/* AI Voice Assistant Trigger */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              onOpenVoiceCommand?.();
            }}
            title="Trafix AI Voice Dispatcher (Indian Female Voice)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-[#0e0e11]/90 dark:hover:bg-[#18181b] dark:text-zinc-300 dark:hover:text-white dark:border-[#222226] transition cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden lg:inline">AI Voice</span>
          </button>

          {/* CCTV Matrix Wall */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              onOpenMatrixWall?.();
            }}
            title="Open 4-Screen CCTV Matrix Wall"
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5 transition border border-transparent hover:border-slate-200 dark:hover:border-[#222226] cursor-pointer"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Viva Tour / Help */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              onOpenDemo();
            }}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-[#222226] transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tour</span>
          </button>

          {/* Dynamic Logged-in User Profile Avatar with dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-7 h-7 rounded-full bg-slate-900 text-white dark:bg-gradient-to-tr dark:from-zinc-700 dark:via-zinc-800 dark:to-zinc-900 border border-slate-300 dark:border-zinc-700 flex items-center justify-center text-xs font-bold hover:border-slate-500 dark:hover:border-zinc-500 transition cursor-pointer shadow-xs"
            >
              {initials}
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0a0a0a]/95 backdrop-blur-xl border border-slate-200 dark:border-[#27272a] rounded-xl shadow-2xl py-1.5 z-50 text-xs font-medium animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-[#1f1f23]">
                  <p className="font-semibold text-slate-900 dark:text-white">{displayName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono truncate">{userRole} • {user?.department || 'Command HQ'}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenAboutUs?.();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <Github className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
                  <span>About Team DigiX</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenAuditReport?.();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
                  <span>Download Audit PDF</span>
                </button>

                <div className="border-t border-slate-100 dark:border-[#1f1f23] my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 hover:text-red-700 dark:hover:bg-red-950/40 dark:text-red-400 dark:hover:text-red-300 transition cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
