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
    <div className="space-y-4 max-w-5xl mx-auto pb-12 text-slate-900 dark:text-white transition-colors">
      {/* 1. Theme Configuration Card */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] rounded-lg p-5 transition space-y-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
            Theme &amp; Appearance
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-zinc-400">
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
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white/10 dark:border-white dark:text-white'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700 dark:bg-black/40 dark:border-[#1f1f23] dark:hover:border-zinc-700 dark:text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Dark Theme</div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">Cyber highway canvas</div>
              </div>
            </div>
            {theme === 'dark' && (
              <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white shadow-xs" />
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
                ? 'bg-white text-slate-900 font-semibold border-slate-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700 dark:bg-black/40 dark:border-[#1f1f23] dark:hover:border-zinc-700 dark:text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Light Theme</div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">High-contrast daytime interface</div>
              </div>
            </div>
            {theme === 'light' && (
              <span className="w-2 h-2 rounded-full bg-slate-900 shadow-xs" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Advanced Features Toggle Card */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] rounded-lg p-5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center shrink-0 text-slate-700 dark:text-zinc-300">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                Advanced Developer &amp; AI Modules
              </h3>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                  advancedFeatures
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800'
                }`}
              >
                {advancedFeatures ? 'ACTIVE (5 MODULES)' : 'OFF'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans max-w-xl">
              Toggles specialized engineering and intelligence modules (<strong>ANPR Violations</strong>, <strong>AI Forecaster</strong>, <strong>Hardware IoT / GPIO</strong>, <strong>Neo4j Database</strong>, and <strong>DBMS Architecture</strong>) in the sidebar.
            </p>
          </div>
        </div>

        {/* Robust, Pixel-Perfect Toggle Switch */}
        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <button
            type="button"
            onClick={handleToggleAdvanced}
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out relative cursor-pointer border focus:outline-hidden ${
              advancedFeatures
                ? 'bg-slate-900 border-slate-900 dark:bg-white dark:border-white'
                : 'bg-slate-200 border-slate-300 dark:bg-zinc-800 dark:border-zinc-700'
            }`}
            aria-pressed={advancedFeatures}
            aria-label="Toggle Advanced Developer Modules"
          >
            <div
              className={`w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                advancedFeatures
                  ? 'translate-x-5 bg-white dark:bg-black'
                  : 'translate-x-0 bg-white dark:bg-zinc-400'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 3. Zone / Junction Management Card */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] rounded-lg p-5 transition space-y-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
            Junction Grid Nodes
          </h3>
        </div>

        {/* Junction Items List */}
        <div className="space-y-2">
          {junctions.map((j) => (
            <div
              key={j.id}
              className="p-3 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] flex items-center justify-between gap-3"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{j.name}</div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 mt-0.5">{j.url}</div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  deleteJunction(j.id);
                }}
                className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition cursor-pointer"
                title="Delete Junction Node"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Junction Form */}
        <div className="pt-2 border-t border-slate-200 dark:border-[#1f1f23] flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Junction Name (e.g. Ring Road Arterial)"
            value={newJunctionName}
            onChange={(e) => setNewJunctionName(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded bg-white dark:bg-black border border-slate-300 dark:border-[#222226] text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Endpoint URL / IP"
            value={newJunctionIp}
            onChange={(e) => setNewJunctionIp(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded bg-white dark:bg-black border border-slate-300 dark:border-[#222226] text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none font-mono"
          />
          <button
            type="button"
            onClick={handleAddJunction}
            className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-black font-semibold text-xs transition cursor-pointer shrink-0 shadow-xs"
          >
            Add Node
          </button>
        </div>
      </div>

      {/* 4. Team DigiX & Creator Profile */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] rounded-lg p-5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center font-bold text-slate-900 dark:text-white text-xs shadow-xs">
            LP
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Lakshya Pundir</h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">Team DigiX • Lead System Architect &amp; Developer</p>
            <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono mt-0.5">+91 7340441973 · lpmarshall1107@gmail.com</p>
          </div>
        </div>

        {onOpenAboutUs && (
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              onOpenAboutUs();
            }}
            className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-200 dark:hover:text-white dark:border-zinc-800 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Github className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span>About Team DigiX</span>
          </button>
        )}
      </div>

      {/* 5. Danger Zone: Reset Data */}
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-700 dark:text-red-300">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider">
            Reset Data &amp; Cache
          </h4>
          <p className="text-[11px] text-slate-600 dark:text-red-300/80 mt-0.5 font-sans">
            Purge historical violation logs, AI cache, and restore default traffic cycle parameters.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetData}
          className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition cursor-pointer shrink-0 shadow-xs"
        >
          {resetSuccess ? 'Data Reset Complete' : 'Reset System Data'}
        </button>
      </div>
    </div>
  );
};
