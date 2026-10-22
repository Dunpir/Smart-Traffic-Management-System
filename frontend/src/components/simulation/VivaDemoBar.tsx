import React from 'react';
import {
  Sparkles,
  Zap,
  ShieldAlert,
  Ghost,
  Footprints,
  Flame,
  Volume2,
  BookOpen,
  BarChart3,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';
import { voiceCommander } from '../../utils/voiceCommander';

interface VivaDemoBarProps {
  onTriggerRushHour: () => void;
  onTriggerEmergency: () => void;
  onTriggerGhostGreenDemo: () => void;
  onTriggerPedestrian: () => void;
  onTriggerChaos: () => void;
  onOpenBenchmark: () => void;
  onOpenTheory: () => void;
  activeScenarioName?: string;
}

export const VivaDemoBar: React.FC<VivaDemoBarProps> = ({
  onTriggerRushHour,
  onTriggerEmergency,
  onTriggerGhostGreenDemo,
  onTriggerPedestrian,
  onTriggerChaos,
  onOpenBenchmark,
  onOpenTheory,
  activeScenarioName,
}) => {
  const handlePlayDefenseBriefing = () => {
    soundEffects.playClick();
    // Play authentic Neerja speech explaining simulation to the faculty examiner
    voiceCommander.playAudioUrl('/audio/assistant/simulation_defense.mp3');
  };

  return (
    <div className="w-full bg-slate-900/90 dark:bg-black/85 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
      {/* Left: Section Label */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <div className="text-xs font-bold font-mono text-white flex items-center gap-2 uppercase tracking-wide">
            <span>Faculty Viva Demonstration Presets</span>
            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60">
              1-CLICK TESTS
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-sans hidden sm:block">
            Demonstrate real-time algorithmic superiority and emergency pre-emption to examiners.
          </p>
        </div>
      </div>

      {/* Center: Viva Scenario Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
        {/* Preset 1: Rush Hour Spike */}
        <button
          onClick={() => {
            soundEffects.playClick();
            onTriggerRushHour();
          }}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
          title="Simulate asymmetric peak rush hour queue on North & East to demonstrate dynamic 60s allocation"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Rush Hour Spike</span>
        </button>

        {/* Preset 2: Emergency Pre-emption */}
        <button
          onClick={() => {
            soundEffects.playEmergencySiren();
            onTriggerEmergency();
          }}
          className="px-2.5 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900/80 text-red-200 hover:text-white border border-red-700/70 flex items-center gap-1.5 transition cursor-pointer active:scale-95 animate-pulse"
          title="Spawn Ambulance with active sirens to demonstrate instant 2.5s priority pre-emption corridor"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span>Ambulance Flush</span>
        </button>

        {/* Preset 3: Ghost Green Waste Failure */}
        <button
          onClick={() => {
            soundEffects.playClick();
            onTriggerGhostGreenDemo();
          }}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
          title="Empties South approach while jamming North, proving STMS skips empty roads in 0s while fixed timers waste 60s"
        >
          <Ghost className="w-3.5 h-3.5 text-purple-400" />
          <span>Ghost Green Test</span>
        </button>

        {/* Preset 4: Pedestrian Actuation */}
        <button
          onClick={() => {
            soundEffects.playClick();
            onTriggerPedestrian();
          }}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
          title="Simulate actuated pedestrian pushbutton call, activating pedestrian crosswalk phase"
        >
          <Footprints className="w-3.5 h-3.5 text-emerald-400" />
          <span>Pedestrian Call</span>
        </button>

        {/* Preset 5: Chaos Gridlock */}
        <button
          onClick={() => {
            soundEffects.playViolationPing();
            onTriggerChaos();
          }}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
          title="Trigger multi-lane accident and collision to test graph rerouting and fail-safe safety locks"
        >
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span>Chaos Gridlock</span>
        </button>
      </div>

      {/* Right: Academic Defense Tools */}
      <div className="flex items-center gap-2 text-xs font-mono shrink-0">
        {/* Examiner Audio Briefing */}
        <button
          onClick={handlePlayDefenseBriefing}
          className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-200 hover:text-white border border-cyan-500/60 flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-md shadow-cyan-950/40"
          title="Play Neerja's spoken explanation of the simulation algorithm for the examiner"
        >
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Examiner Briefing</span>
        </button>

        {/* Live Benchmark Toggle */}
        <button
          onClick={() => {
            soundEffects.playClick();
            onOpenBenchmark();
          }}
          className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-200 hover:text-white border border-emerald-500/60 flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-md shadow-emerald-950/40 font-bold"
          title="Open Side-by-Side Algorithm Comparison: STMS Adaptive vs Conventional Fixed-Timer"
        >
          <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Benchmark Live</span>
        </button>

        {/* Theory & Formulas Drawer */}
        <button
          onClick={() => {
            soundEffects.playClick();
            onOpenTheory();
          }}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
          title="Inspect Webster's delay equation, Greenshields model, and HCM 2020 Level of Service standards"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-300" />
          <span>Theory &amp; Math</span>
        </button>
      </div>
    </div>
  );
};
