import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  User,
  Sun,
  Moon,
  HelpCircle,
  LogOut,
  Info,
  FileText,
  Volume2,
  VolumeX,
  Video,
  Mic,
} from 'lucide-react';
import { DatabaseStatus, HardwareState, SimulationConfig } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { Button } from '@/components/ui/button';
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
  hardwareState,
  simConfig,
  onOpenDemo,
  onOpenAuditReport,
  onOpenAboutUs,
  onOpenMatrixWall,
  onOpenVoiceCommand,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useSettings();
  const isDark = theme === 'dark';
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(soundEffects.getIsMuted());

  const isNeo4jOnline = dbStatus?.connected ?? false;
  const time = dbStatus?.lastChecked ? new Date(dbStatus.lastChecked).toLocaleTimeString() : '';

  const handleToggleAudio = () => {
    const nextMuted = soundEffects.toggleMute();
    setIsAudioMuted(nextMuted);
    if (!nextMuted) {
      soundEffects.playClick();
    }
  };

  return (
    <header
      className={`w-full border-b backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 transition-colors ${
        isDark
          ? 'bg-[#070e1b]/90 border-white/10 text-white'
          : 'bg-white/90 border-slate-200/80 text-slate-800 shadow-xs'
      }`}
    >
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3">
        {/* Brand Icon */}
        <div
          className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-lg transition-colors ${
            isDark
              ? 'bg-gradient-to-tr from-teal-500/20 via-cyan-500/10 to-transparent border-teal-500/30 shadow-teal-950/50'
              : 'bg-gradient-to-tr from-blue-50 via-blue-100/50 to-white border-blue-200 shadow-blue-500/10'
          }`}
        >
          <div className="flex flex-col gap-1 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-xs" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-xs" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-xs" />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1
              className={`text-xl font-extrabold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Trafix
            </h1>
            <span
              className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                isDark
                  ? 'bg-teal-950 text-teal-300 border-teal-500/40'
                  : 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
              }`}
            >
              DBMS PROJECT
            </span>
          </div>
          <p
            className={`text-xs font-medium hidden sm:block ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}
          >
            Intelligent Adaptive Traffic Signal Grid
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 lg:gap-2.5">
        {/* Database Connection Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-medium transition ${
            isNeo4jOnline
              ? isDark
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 shadow-sm'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : isDark
              ? 'bg-rose-950/70 border-rose-500/40 text-rose-300'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {isNeo4jOnline ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span className="text-[11px] font-bold">
            {isNeo4jOnline ? `Neo4j Live • ${time || 'Connected'}` : 'Disconnected'}
          </span>
        </div>

        {/* Audio Sound FX Toggle */}
        <button
          type="button"
          onClick={handleToggleAudio}
          title={isAudioMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          className={`p-2 rounded-full border transition flex items-center justify-center cursor-pointer ${
            isAudioMuted
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
              : isDark
              ? 'border-white/15 bg-white/5 hover:bg-white/10 text-emerald-400'
              : 'border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700'
          }`}
        >
          {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* CCTV Matrix Wall Launcher */}
        {onOpenMatrixWall && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              soundEffects.playClick();
              onOpenMatrixWall();
            }}
            className={`rounded-full text-xs font-bold gap-1.5 hidden md:flex cursor-pointer ${
              isDark
                ? 'border-blue-500/40 bg-slate-900/80 hover:bg-blue-950/90 text-white'
                : 'border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 text-slate-700'
            }`}
          >
            <Video className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <span>CCTV Wall</span>
          </Button>
        )}

        {/* Theme Switcher Button */}
        <button
          type="button"
          onClick={() => {
            soundEffects.playClick();
            toggleTheme();
          }}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
          className={`p-2 rounded-full border transition flex items-center justify-center cursor-pointer ${
            isDark
              ? 'border-white/15 bg-white/5 hover:bg-white/10 text-amber-300'
              : 'border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700'
          }`}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* About Us Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            soundEffects.playClick();
            if (onOpenAboutUs) onOpenAboutUs();
          }}
          className={`rounded-full text-xs font-bold gap-1.5 hidden sm:flex cursor-pointer ${
            isDark
              ? 'border-blue-500/40 bg-slate-900/80 hover:bg-blue-950/90 text-white'
              : 'border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 text-slate-700'
          }`}
        >
          <Info className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <span>About Us</span>
        </Button>

        {/* Guided Tour Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            soundEffects.playClick();
            onOpenDemo();
          }}
          className={`rounded-full text-xs font-bold gap-1.5 hidden lg:flex cursor-pointer ${
            isDark
              ? 'border-blue-500/40 bg-slate-900/80 hover:bg-blue-950/90 text-white'
              : 'border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 text-slate-700'
          }`}
        >
          <HelpCircle className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <span>Tour</span>
        </Button>

        {/* PDF Audit Report Button */}
        {onOpenAuditReport && (
          <Button
            size="sm"
            onClick={() => {
              soundEffects.playClick();
              onOpenAuditReport();
            }}
            className={`rounded-full text-xs font-bold shadow-md gap-1.5 cursor-pointer ${
              isDark
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-blue-500/20'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Audit Report</span>
          </Button>
        )}

        {/* User Profile & Logout */}
        <div className={`flex items-center gap-2 pl-3 border-l ${isDark ? 'border-white/15' : 'border-slate-200'}`}>
          <div className="hidden lg:flex flex-col text-right text-xs">
            <span className={`font-bold whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {user?.name || 'Officer'}
            </span>
            <span className={`text-[10px] font-mono whitespace-nowrap ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>
              {user?.role || 'Traffic Control'}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            title="Sign Out"
            className={`rounded-full transition ${isDark
                ? 'text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40'
                : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
              }`}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
