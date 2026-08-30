import React, { useState } from 'react';
import {
  ExternalLink,
  Github,
  Bell,
  Volume2,
  VolumeX,
  Video,
  Mic,
  FileText,
  HelpCircle,
  Activity,
  GitBranch,
  Radio,
  ChevronDown,
} from 'lucide-react';
import { DatabaseStatus, HardwareState, SimulationConfig } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { soundEffects } from '../../utils/soundEffects';
import { NavTab } from './Sidebar';

interface HeaderProps {
  dbStatus: DatabaseStatus | null;
  hardwareState: HardwareState | null;
  simConfig: SimulationConfig | null;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenDemo: () => void;
  onOpenAuditReport?: () => void;
  onOpenAboutUs?: () => void;
  onOpenMatrixWall?: () => void;
  onOpenVoiceCommand?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dbStatus,
  activeTab,
  onSelectTab,
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

  const handleToggleAudio = () => {
    const nextMuted = soundEffects.toggleMute();
    setIsAudioMuted(nextMuted);
    if (!nextMuted) {
      soundEffects.playClick();
    }
  };

  // Real traffic modules (clean, useful tabs only)
  const navTabs: { id: NavTab; label: string }[] = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'simulation', label: '3D Simulation' },
    { id: 'citymap', label: 'City Map' },
    { id: 'violations', label: 'ANPR Violations' },
    { id: 'controller', label: 'Signal Controller' },
    { id: 'corridor', label: 'Green Corridor' },
    { id: 'hardware', label: 'Hardware IoT' },
    { id: 'analytics', label: 'Traffic Analytics' },
    { id: 'forecaster', label: 'AI Forecaster' },
    { id: 'architecture', label: 'DBMS Architecture' },
    { id: 'database', label: 'Database Graph' },
    { id: 'logs', label: 'Audit Logs' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="w-full bg-[#000000] border-b border-[#1f1f23] sticky top-0 z-40 text-[#ededed]">
      {/* Top Navbar Row */}
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-[#141417]">
        {/* Left: Trafix Brand + Breadcrumbs */}
        <div className="flex items-center gap-3">
          {/* Trafix Geometric Icon */}
          <div className="w-7 h-7 rounded-lg bg-[#0a0a0a] border border-[#222226] flex items-center justify-center relative shadow-xs">
            <div className="flex flex-col gap-0.5 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-xs" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-xs" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-xs" />
            </div>
          </div>

          {/* Brand Title */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-white">Trafix</span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-[#141417] text-zinc-400 border border-[#222226]">
              STMS
            </span>
          </div>

          <span className="text-[#3f3f46] text-sm hidden sm:inline">/</span>

          {/* Project Breadcrumb */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-zinc-300 px-2 py-1 rounded-md hover:bg-[#0e0e11] transition cursor-pointer">
            <span className="text-white font-semibold">Smart-Traffic-Grid</span>
            <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-zinc-900/80 px-1.5 py-0.2 rounded border border-zinc-800">
              <GitBranch className="w-2.5 h-2.5 text-zinc-500" />
              <span>BCNF</span>
            </div>
          </div>
        </div>

        {/* Right: Actions, Live Status, Feedback, Profile */}
        <div className="flex items-center gap-2">
          {/* Live Engine Status Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0a0a0a] border border-[#222226] text-[11px] font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isNeo4jOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-zinc-300">
              {isNeo4jOnline ? 'Neo4j Live' : 'Offline'}
            </span>
          </div>

          {/* Audio FX Toggle */}
          <button
            type="button"
            onClick={handleToggleAudio}
            title={isAudioMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-[#141417] transition border border-transparent hover:border-[#222226] cursor-pointer"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* AI Voice Assistant Trigger */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              onOpenVoiceCommand?.();
            }}
            title="Trafix AI Voice Dispatcher"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#0e0e11] hover:bg-[#18181b] text-zinc-300 hover:text-white border border-[#222226] transition cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5 text-red-400" />
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
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-[#141417] transition border border-transparent hover:border-[#222226] cursor-pointer"
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
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-400 hover:text-white hover:bg-[#141417] border border-transparent hover:border-[#222226] transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tour</span>
          </button>

          {/* User Profile Avatar with dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-7 h-7 rounded-full bg-gradient-to-tr from-zinc-700 via-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white hover:border-zinc-500 transition cursor-pointer shadow-xs"
            >
              LP
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-2xl py-1.5 z-50 text-xs font-medium animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-[#1f1f23]">
                  <p className="font-semibold text-white">Lakshya Pundir</p>
                  <p className="text-[11px] text-zinc-400 font-mono truncate">Team DigiX • Lead Architect</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenAboutUs?.();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#18181b] text-zinc-300 hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <Github className="w-3.5 h-3.5 text-zinc-400" />
                  <span>About Team DigiX</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenAuditReport?.();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#18181b] text-zinc-300 hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Download Audit PDF</span>
                </button>

                <div className="border-t border-[#1f1f23] my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-red-950/40 text-red-400 hover:text-red-300 transition cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Horizontal Navigation Bar (Vercel Style Underline Tabs) */}
      <div className="px-4 sm:px-6 flex items-center gap-5 overflow-x-auto no-scrollbar h-11 text-xs">
        {navTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundEffects.playTabSwitch();
                onSelectTab(tab.id);
              }}
              className={`h-full flex items-center whitespace-nowrap font-medium transition-colors border-b-2 cursor-pointer ${
                isActive
                  ? 'text-white border-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 border-transparent'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
