import React, { useState } from 'react';
import {
  X,
  Search,
  Mic,
  ShieldAlert,
  Activity,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Video,
  FileText,
  Volume2,
  Sparkles,
  Zap,
  Navigation,
  CheckCircle2,
} from 'lucide-react';
import { VoiceAction, voiceCommander, EmergencyType } from '../../utils/voiceCommander';
import { soundEffects } from '../../utils/soundEffects';

interface CommandDictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (action: VoiceAction) => void;
}

interface CommandItem {
  category: string;
  phrase: string;
  actionDesc: string;
  action: VoiceAction;
  icon: React.FC<{ className?: string }>;
  badge: string;
  badgeColor: string;
}

export const CommandDictionaryModal: React.FC<CommandDictionaryModalProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (!isOpen) return null;

  const ALL_COMMANDS: CommandItem[] = [
    // 🚨 Emergency & Priority Dispatches
    {
      category: 'EMERGENCY',
      phrase: 'Trigger ambulance on North road',
      actionDesc: 'Spawns an Ambulance and forces an immediate Green pre-emption wave on North approach',
      action: { type: 'EMERGENCY', road: 'NORTH', emergencyType: 'AMBULANCE' },
      icon: ShieldAlert,
      badge: 'AMBULANCE',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
    {
      category: 'EMERGENCY',
      phrase: 'Police escort on South road',
      actionDesc: 'Spawns a High-Speed Police Cruiser with blue-red strobes and locks Green signal',
      action: { type: 'EMERGENCY', road: 'SOUTH', emergencyType: 'POLICE' },
      icon: ShieldAlert,
      badge: 'POLICE',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    },
    {
      category: 'EMERGENCY',
      phrase: 'VIP convoy on East road',
      actionDesc: 'Spawns Armored VIP Black SUV Motorcade with priority green clearance corridor',
      action: { type: 'EMERGENCY', road: 'EAST', emergencyType: 'VIP' },
      icon: ShieldAlert,
      badge: 'VIP MOTORCADE',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      category: 'EMERGENCY',
      phrase: 'Fire truck on West road',
      actionDesc: 'Spawns heavy Fire Brigade engine and activates acoustic alarm sweep',
      action: { type: 'EMERGENCY', road: 'WEST', emergencyType: 'FIRE_TRUCK' },
      icon: ShieldAlert,
      badge: 'FIRE BRIGADE',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    },
    {
      category: 'EMERGENCY',
      phrase: 'Clear emergency',
      actionDesc: 'Resolves active pre-emption locks and returns intersection to adaptive graph cycle',
      action: { type: 'CLEAR_EMERGENCY' },
      icon: CheckCircle2,
      badge: 'RESOLVE',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },

    // 🎮 Discrete Simulation Controls
    {
      category: 'SIMULATION',
      phrase: 'Start simulation / Run simulation',
      actionDesc: 'Starts discrete-event traffic generator and animated vehicle progression',
      action: { type: 'SIMULATION_START' },
      icon: Play,
      badge: 'RUN',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      category: 'SIMULATION',
      phrase: 'Pause simulation / Stop simulation',
      actionDesc: 'Freezes vehicle movements, queue accumulation, and signal timers',
      action: { type: 'SIMULATION_PAUSE' },
      icon: Pause,
      badge: 'PAUSE',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      category: 'SIMULATION',
      phrase: 'Reset simulation',
      actionDesc: 'Clears all vehicles and resets traffic cycle counters to initial research baseline',
      action: { type: 'SIMULATION_RESET' },
      icon: RotateCcw,
      badge: 'RESET',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
    {
      category: 'SIMULATION',
      phrase: 'Spawn car on North road',
      actionDesc: 'Injects a passenger sedan into the North approach queue buffer',
      action: { type: 'SIMULATION_SPAWN', road: 'NORTH', vehicleType: 'CAR' },
      icon: Activity,
      badge: 'SPAWN CAR',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    },
    {
      category: 'SIMULATION',
      phrase: 'Spawn bus on East road',
      actionDesc: 'Injects a high-capacity metropolitan transit bus into the East lane',
      action: { type: 'SIMULATION_SPAWN', road: 'EAST', vehicleType: 'BUS' },
      icon: Activity,
      badge: 'SPAWN BUS',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    },
    {
      category: 'SIMULATION',
      phrase: 'Speed 2x / Fast forward',
      actionDesc: 'Doubles simulation clock speed for rapid rush-hour load testing',
      action: { type: 'SIMULATION_SPEED', speed: 2 },
      icon: Zap,
      badge: '2X SPEED',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    },

    // 🎬 Simulation Scenarios
    {
      category: 'SCENARIOS',
      phrase: 'Rush hour scenario',
      actionDesc: 'Injects heavy traffic platoons simulating morning/evening office rush',
      action: { type: 'SIMULATION_SCENARIO', scenario: 'RUSH_HOUR' },
      icon: Activity,
      badge: 'RUSH HOUR',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      category: 'SCENARIOS',
      phrase: 'Accident scenario / Crash scenario',
      actionDesc: 'Simulates multi-vehicle roadblock edge cases to test adaptive detour routing',
      action: { type: 'SIMULATION_SCENARIO', scenario: 'ACCIDENT' },
      icon: ShieldAlert,
      badge: 'ACCIDENT',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
    {
      category: 'SCENARIOS',
      phrase: 'Low traffic scenario',
      actionDesc: 'Reduces vehicle flow to test zero-car signal skip thresholds (0s split)',
      action: { type: 'SIMULATION_SCENARIO', scenario: 'LOW_TRAFFIC' },
      icon: Activity,
      badge: 'SPARSE',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    },

    // 🎛️ Controller & Tools
    {
      category: 'CONTROLLER',
      phrase: 'Switch to Automatic mode',
      actionDesc: 'Enables autonomous AI Neo4j shortest-job-first dynamic cycle calculation',
      action: { type: 'SET_MODE', mode: 'AUTOMATIC' },
      icon: Sliders,
      badge: 'AUTO',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      category: 'CONTROLLER',
      phrase: 'Switch to Manual override',
      actionDesc: 'Transfers signal control to manual operator duration sliders',
      action: { type: 'SET_MODE', mode: 'MANUAL' },
      icon: Sliders,
      badge: 'MANUAL',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      category: 'CONTROLLER',
      phrase: 'Open CCTV Matrix Wall',
      actionDesc: 'Launches 4-screen live optical camera split grid with AI speed radar & OCR',
      action: { type: 'OPEN_MATRIX' },
      icon: Video,
      badge: 'CCTV 4K',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    },
    {
      category: 'CONTROLLER',
      phrase: 'Open 3D View / Three.js view',
      actionDesc: 'Switches Dashboard visualizer to full 3D WebGL perspective simulator',
      action: { type: 'OPEN_3D' },
      icon: Sparkles,
      badge: '3D WEBGL',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    },
    {
      category: 'CONTROLLER',
      phrase: 'Chaos mode / Stress test',
      actionDesc: 'Navigates to Simulation suite and expands the Chaos disruption sandbox',
      action: { type: 'CHAOS_MODE' },
      icon: Zap,
      badge: 'CHAOS',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    },
    {
      category: 'CONTROLLER',
      phrase: 'Generate audit report',
      actionDesc: 'Compiles municipal traffic audit metrics and opens one-click PDF exporter',
      action: { type: 'OPEN_REPORT' },
      icon: FileText,
      badge: 'PDF AUDIT',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    },
    {
      category: 'CONTROLLER',
      phrase: 'Tell me about this tab / Feature info',
      actionDesc: 'Opens viva highlights and reads out technical graph documentation aloud',
      action: { type: 'TAB_INFO' },
      icon: Volume2,
      badge: 'INFO VIVA',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    },
    {
      category: 'CONTROLLER',
      phrase: 'Who created this website? / Who made this?',
      actionDesc: 'Opens the About Us modal and introduces Lakshya Pundir, Lead System Architect & Developer at Team DigiX',
      action: { type: 'OPEN_ABOUT_US' },
      icon: Sparkles,
      badge: 'CREATOR',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    },

    // 🧭 Navigation
    {
      category: 'NAVIGATION',
      phrase: 'Navigate to Analytics',
      actionDesc: 'Opens Live Traffic Analytics, Congestion Heatmaps & Carbon Reduction curves',
      action: { type: 'NAVIGATE', tab: 'analytics' },
      icon: Navigation,
      badge: 'ANALYTICS',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    },
    {
      category: 'NAVIGATION',
      phrase: 'Navigate to Violations / E-Challan',
      actionDesc: 'Opens Automated ANPR E-Challan infraction registry & vehicle lookup',
      action: { type: 'NAVIGATE', tab: 'violations' },
      icon: Navigation,
      badge: 'E-CHALLAN',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
    {
      category: 'NAVIGATION',
      phrase: 'Navigate to Forecaster',
      actionDesc: 'Opens AI Predictive Rush-Hour Demand forecaster & 60-min horizon',
      action: { type: 'NAVIGATE', tab: 'forecaster' },
      icon: Navigation,
      badge: 'FORECAST',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    },
    {
      category: 'NAVIGATION',
      phrase: 'Navigate to Green Wave Corridor',
      actionDesc: 'Opens Arterial Corridor Synchronization and platoon speed tuning',
      action: { type: 'NAVIGATE', tab: 'corridor' },
      icon: Navigation,
      badge: 'GREEN WAVE',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      category: 'NAVIGATION',
      phrase: 'Navigate to City Map',
      actionDesc: 'Opens Multi-Junction Metropolitan City Network map',
      action: { type: 'NAVIGATE', tab: 'citymap' },
      icon: Navigation,
      badge: 'CITY MAP',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    },
  ];

  const categories = ['ALL', 'EMERGENCY', 'SIMULATION', 'SCENARIOS', 'CONTROLLER', 'NAVIGATION'];

  const filteredCommands = ALL_COMMANDS.filter((cmd) => {
    const matchesCategory = selectedCategory === 'ALL' || cmd.category === selectedCategory;
    const matchesSearch =
      cmd.phrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.actionDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleRunCommand = (cmd: CommandItem) => {
    soundEffects.playVoiceAck();
    onExecuteCommand(cmd.action);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl cursor-pointer overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#08090f] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-red-500/40 cursor-default my-auto space-y-5 animate-fade-in"
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/30 border border-red-400/50 text-[10px] font-mono font-bold text-red-300">
              <Mic className="w-3.5 h-3.5 text-red-300" />
              <span>AI VOICE DISPATCH DICTIONARY</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-sans tracking-tight">
              Voice Command Directory &amp; Cheat Sheet
            </h2>
            <p className="text-xs text-slate-400">
              Speak any of the following natural language phrases or click &quot;Run Command&quot; to execute directly.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Search & Category Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commands, police, vip, sim..."
              className="w-full pl-10 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-hidden focus:border-red-500 transition"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Command Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
          {filteredCommands.map((cmd, i) => {
            const Icon = cmd.icon;
            return (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/50 hover:bg-red-950/20 transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-black border ${cmd.badgeColor}`}>
                      {cmd.badge}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{cmd.category}</span>
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <Icon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono group-hover:text-red-300 transition">
                        &ldquo;{cmd.phrase}&rdquo;
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                        {cmd.actionDesc}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleRunCommand(cmd)}
                    className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run Command</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-red-400 animate-pulse" />
            <span>Click the floating Mic in bottom-right to speak any command hands-free!</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
