import React, { useState } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  ChevronDown,
  AlertTriangle,
  Flame,
  FileText,
  Video,
  Navigation,
  Sparkles,
} from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';

interface VercelToolbarProps {
  onInjectEmergency?: () => void;
  onTriggerChaos?: () => void;
  onOpenAuditReport?: () => void;
  onOpenMatrixWall?: () => void;
  onOpenCorridor?: () => void;
  selectedJunction: string;
  onSelectJunction: (j: string) => void;
}

export const VercelToolbar: React.FC<VercelToolbarProps> = ({
  onInjectEmergency,
  onTriggerChaos,
  onOpenAuditReport,
  onOpenMatrixWall,
  onOpenCorridor,
  selectedJunction,
  onSelectJunction,
}) => {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const junctions = [
    { id: 'JUNC-001', name: 'Connaught Place Central (CP-01)' },
    { id: 'JUNC-002', name: 'Ring Road Arterial (RR-04)' },
    { id: 'JUNC-003', name: 'Cyber City Expressway (CC-09)' },
    { id: 'JUNC-004', name: 'AIIMS Flyover Arterial (AIIMS-02)' },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#1f1f23]/80 transition-colors">
      {/* Left: Intersection / Grid Selector */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={selectedJunction}
            onChange={(e) => {
              soundEffects.playClick();
              onSelectJunction(e.target.value);
            }}
            className="appearance-none bg-white/90 dark:bg-[#0a0a0a]/70 backdrop-blur-md hover:bg-slate-50 dark:hover:bg-[#121215]/90 border border-slate-300 dark:border-[#222226]/80 hover:border-slate-500 dark:hover:border-zinc-500 rounded-md pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer transition shadow-xs"
          >
            {junctions.map((j) => (
              <option key={j.id} value={j.id} className="bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-white">
                {j.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-zinc-400 pointer-events-none" />
        </div>

        <span className="text-slate-400 dark:text-zinc-600 text-xs hidden md:inline">·</span>
        <span className="text-slate-600 dark:text-zinc-400 text-xs hidden md:inline font-mono">
          Overview &amp; Real-Time Telemetry
        </span>
      </div>

      {/* Right: Search, Grid/List switcher, Vercel Action Button */}
      <div className="flex items-center gap-2">
        {/* Search input with '/' shortcut badge */}
        <div className="relative w-48 sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search Intersections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-white/90 dark:bg-[#0a0a0a]/70 backdrop-blur-md border border-slate-300 dark:border-[#222226]/80 focus:border-slate-500 dark:focus:border-zinc-500 rounded-md text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none transition"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 dark:text-zinc-500 bg-slate-100 dark:bg-[#141417] px-1 py-0.2 rounded border border-slate-200 dark:border-[#27272a]">
            /
          </span>
        </div>

        {/* View toggles */}
        <div className="flex items-center bg-slate-100 dark:bg-[#0a0a0a]/70 backdrop-blur-md border border-slate-200 dark:border-[#222226]/80 rounded-md p-0.5">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setViewMode('list');
            }}
            className={`p-1 rounded text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition ${
              viewMode === 'list' ? 'bg-white shadow-xs text-slate-900 dark:bg-[#18181b] dark:text-white' : ''
            }`}
            title="List View"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setViewMode('grid');
            }}
            className={`p-1 rounded text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition ${
              viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900 dark:bg-[#18181b] dark:text-white' : ''
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Actions Dropdown Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setIsActionMenuOpen(!isActionMenuOpen);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-xs transition cursor-pointer shadow-xs"
          >
            <span>Quick Actions</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {isActionMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#27272a] rounded-lg shadow-xl py-1 z-50 text-xs font-medium animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-mono text-slate-400 dark:text-zinc-500 uppercase tracking-wider border-b border-slate-100 dark:border-[#1f1f23]">
                Junction Overrides
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  onInjectEmergency?.();
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-800 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-2 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span>Inject Ambulance Pre-emption</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  onTriggerChaos?.();
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-800 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-2 cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Trigger Rush Hour Jam (120+ veh)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  onOpenCorridor?.();
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-800 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-2 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                <span>Synchronize Green Wave Corridor</span>
              </button>

              <div className="border-t border-slate-100 dark:border-[#1f1f23] my-1" />

              <button
                type="button"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  onOpenMatrixWall?.();
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-800 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-2 cursor-pointer"
              >
                <Video className="w-3.5 h-3.5 text-cyan-500" />
                <span>Open 4-Screen CCTV Matrix</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  onOpenAuditReport?.();
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-800 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span>Download System Audit Report</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
