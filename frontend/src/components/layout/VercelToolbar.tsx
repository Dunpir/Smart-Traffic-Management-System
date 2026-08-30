import React, { useState } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  ChevronDown,
  AlertTriangle,
  Flame,
  FileText,
  Video,
  Navigation,
  CheckCircle2,
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
  const [isAddNewOpen, setIsAddNewOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const junctions = [
    { id: 'JUNC-001', name: 'Connaught Place Central (CP-01)' },
    { id: 'JUNC-002', name: 'Ring Road Arterial (RR-04)' },
    { id: 'JUNC-003', name: 'Cyber City Expressway (CC-09)' },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#27272a]">
      {/* Left: Project Category / Junction Dropdown */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={selectedJunction}
            onChange={(e) => {
              soundEffects.playClick();
              onSelectJunction(e.target.value);
            }}
            className="appearance-none bg-[#0a0a0a] hover:bg-[#111111] border border-[#27272a] hover:border-zinc-500 rounded-md pl-3 pr-8 py-1.5 text-xs font-semibold text-white focus:outline-none cursor-pointer transition"
          >
            {junctions.map((j) => (
              <option key={j.id} value={j.id} className="bg-[#0a0a0a] text-white">
                {j.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        </div>

        <span className="text-zinc-500 text-xs hidden md:inline">·</span>
        <span className="text-zinc-400 text-xs hidden md:inline font-mono">
          Live BCNF Normalized Engine
        </span>
      </div>

      {/* Right: Search, Grid/List switcher, Add New Dropdown */}
      <div className="flex items-center gap-2">
        {/* Search input with '/' shortcut badge */}
        <div className="relative w-48 sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search Projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-[#0a0a0a] border border-[#27272a] focus:border-zinc-500 rounded-md text-xs text-white placeholder-zinc-500 focus:outline-none transition"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500 bg-[#18181b] px-1 py-0.2 rounded border border-[#27272a]">
            /
          </span>
        </div>

        {/* View toggles */}
        <div className="flex items-center bg-[#0a0a0a] border border-[#27272a] rounded-md p-0.5">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setViewMode('list');
            }}
            className={`p-1 rounded text-zinc-400 hover:text-white transition ${
              viewMode === 'list' ? 'bg-[#18181b] text-white' : ''
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
            className={`p-1 rounded text-zinc-400 hover:text-white transition ${
              viewMode === 'grid' ? 'bg-[#18181b] text-white' : ''
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Vercel Add New ▾ Button with Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setIsAddNewOpen(!isAddNewOpen);
            }}
            className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <span>Add New</span>
            <ChevronDown className="w-3.5 h-3.5 text-black" />
          </button>

          {isAddNewOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-2xl py-1.5 z-50 text-xs font-medium animate-in fade-in zoom-in-95">
              <button
                type="button"
                onClick={() => {
                  setIsAddNewOpen(false);
                  onInjectEmergency?.();
                }}
                className="w-full text-left px-3 py-2 hover:bg-red-950/40 text-red-400 hover:text-red-300 transition flex items-center gap-2"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Inject Emergency Vehicle</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAddNewOpen(false);
                  onTriggerChaos?.();
                }}
                className="w-full text-left px-3 py-2 hover:bg-[#18181b] text-zinc-300 hover:text-white transition flex items-center gap-2"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Trigger Chaos Scenario</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAddNewOpen(false);
                  onOpenCorridor?.();
                }}
                className="w-full text-left px-3 py-2 hover:bg-[#18181b] text-zinc-300 hover:text-white transition flex items-center gap-2"
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                <span>Green Wave Corridor</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAddNewOpen(false);
                  onOpenMatrixWall?.();
                }}
                className="w-full text-left px-3 py-2 hover:bg-[#18181b] text-zinc-300 hover:text-white transition flex items-center gap-2"
              >
                <Video className="w-3.5 h-3.5 text-cyan-400" />
                <span>4-Screen CCTV Matrix Wall</span>
              </button>

              <div className="border-t border-[#1f1f23] my-1" />

              <button
                type="button"
                onClick={() => {
                  setIsAddNewOpen(false);
                  onOpenAuditReport?.();
                }}
                className="w-full text-left px-3 py-2 hover:bg-[#18181b] text-zinc-300 hover:text-white transition flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                <span>Download Audit PDF Report</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
