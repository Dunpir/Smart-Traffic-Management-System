import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
  User,
  Trash2,
  Lock,
  Layers,
  FlaskConical,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  Github,
  Key,
} from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

interface SettingsPageProps {
  onOpenAboutUs?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onOpenAboutUs }) => {
  const { user } = useAuth();
  const {
    theme,
    setTheme,
    advancedFeatures,
    setAdvancedFeatures,
    junctions,
    addJunction,
    deleteJunction,
    resetAllData,
  } = useSettings();

  const [newJunctionName, setNewJunctionName] = useState('');
  const [newJunctionIp, setNewJunctionIp] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleAddJunction = () => {
    if (!newJunctionName.trim()) return;
    soundEffects.playClick();
    addJunction(newJunctionName, newJunctionIp);
    setNewJunctionName('');
    setNewJunctionIp('');
  };

  const handleToggleAdvanced = () => {
    soundEffects.playClick();
    setAdvancedFeatures(!advancedFeatures);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    setPasswordSuccess(true);
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Are you sure you want to reset simulation and historical violation data?'
      )
    ) {
      soundEffects.playClick();
      resetAllData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12 text-white">
      {/* 1. Theme Configuration Card */}
      <div className="bg-[#0a0a0a]/75 backdrop-blur-md border border-[#1f1f23]/80 hover:border-[#333338] rounded-lg p-5 transition space-y-3">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-zinc-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
            Theme &amp; Appearance
          </h3>
        </div>
        <p className="text-xs text-zinc-400">
          Customize the visual interface between Cyber Midnight animated traffic canvas and Clean Modern daytime mode.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Dark Mode */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setTheme('dark');
            }}
            className={`p-3.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
              theme === 'dark'
                ? 'bg-white/10 border-white text-white'
                : 'bg-black/40 border-[#1f1f23] hover:border-zinc-700 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Dark Theme (Cyber Traffic)</div>
                <div className="text-[10px] text-zinc-400 font-mono">Animated traffic canvas background</div>
              </div>
            </div>
            {theme === 'dark' && (
              <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
            )}
          </button>

          {/* Light Mode */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setTheme('light');
            }}
            className={`p-3.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
              theme === 'light'
                ? 'bg-white text-black font-semibold border-white'
                : 'bg-black/40 border-[#1f1f23] hover:border-zinc-700 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Light Theme (Basic)</div>
                <div className="text-[10px] text-zinc-400 font-mono">Clean daytime grid interface</div>
              </div>
            </div>
            {theme === 'light' && (
              <span className="w-2 h-2 rounded-full bg-black shadow-xs" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Advanced Features Toggle Card */}
      <div className="bg-[#0a0a0a]/75 backdrop-blur-md border border-[#1f1f23]/80 hover:border-[#333338] rounded-lg p-5 transition flex items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-zinc-300">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
              Advanced Features
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Toggles specialized tabs (ANPR Violations, AI Forecaster, Green Corridor, Hardware IoT, DBMS Architecture, Neo4j Graph, Audit Logs) in the sidebar.
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          onClick={handleToggleAdvanced}
          className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 border ${
            advancedFeatures
              ? 'bg-white border-white'
              : 'bg-zinc-900 border-zinc-700'
          }`}
          aria-label="Toggle Advanced Features"
        >
          <span
            className={`absolute top-0.5 w-4.5 h-4.5 rounded-full transition-transform ${
              advancedFeatures
                ? 'translate-x-6 bg-black'
                : 'translate-x-1 bg-zinc-400'
            }`}
          />
        </button>
      </div>

      {/* 3. Zone / Junction Management Card */}
      <div className="bg-[#0a0a0a]/75 backdrop-blur-md border border-[#1f1f23]/80 hover:border-[#333338] rounded-lg p-5 transition space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-zinc-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
            Junction Grid Nodes
          </h3>
        </div>

        {/* Junction Items List */}
        <div className="space-y-2">
          {junctions.map((j) => (
            <div
              key={j.id}
              className="p-3 rounded bg-black/50 border border-[#1f1f23] flex items-center justify-between gap-3"
            >
              <div>
                <div className="text-xs font-bold text-white">{j.name}</div>
                <div className="text-[11px] font-mono text-zinc-400 mt-0.5">{j.url}</div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  deleteJunction(j.id);
                }}
                className="p-1.5 rounded hover:bg-red-950/50 text-zinc-500 hover:text-red-400 transition cursor-pointer"
                title="Delete Junction Node"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Junction Form */}
        <div className="pt-2 border-t border-[#1f1f23] flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Junction Name (e.g. Ring Road Arterial)"
            value={newJunctionName}
            onChange={(e) => setNewJunctionName(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded bg-black border border-[#222226] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          />
          <input
            type="text"
            placeholder="Endpoint URL / IP"
            value={newJunctionIp}
            onChange={(e) => setNewJunctionIp(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded bg-black border border-[#222226] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
          />
          <button
            type="button"
            onClick={handleAddJunction}
            className="px-4 py-1.5 rounded bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition cursor-pointer shrink-0"
          >
            Add Node
          </button>
        </div>
      </div>

      {/* 4. Team DigiX & Creator Profile */}
      <div className="bg-[#0a0a0a]/75 backdrop-blur-md border border-[#1f1f23]/80 hover:border-[#333338] rounded-lg p-5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-700 via-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center font-bold text-white text-xs shadow-xs">
            LP
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Lakshya Pundir</h4>
            <p className="text-[11px] text-zinc-400 font-mono">Team DigiX • Lead System Architect &amp; Developer</p>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">+91 7340441973 · lpmarshall1107@gmail.com</p>
          </div>
        </div>

        {onOpenAboutUs && (
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              onOpenAboutUs();
            }}
            className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Github className="w-3.5 h-3.5 text-zinc-400" />
            <span>About Team DigiX</span>
          </button>
        )}
      </div>

      {/* 5. Danger Zone: Reset Data */}
      <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-300">
        <div>
          <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider">
            Reset Data &amp; Cache
          </h4>
          <p className="text-[11px] text-red-300/80 mt-0.5">
            Purge historical violation logs, AI cache, and restore default traffic cycle parameters.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetData}
          className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition cursor-pointer shrink-0"
        >
          {resetSuccess ? 'Data Reset Complete' : 'Reset System Data'}
        </button>
      </div>
    </div>
  );
};
