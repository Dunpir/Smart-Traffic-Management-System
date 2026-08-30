import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
  User,
  Trash2,
  Lock,
  Info,
  Layers,
  FlaskConical,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';

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

  const isDark = theme === 'dark';

  const handleAddJunction = () => {
    if (!newJunctionName.trim()) return;
    addJunction(newJunctionName, newJunctionIp);
    setNewJunctionName('');
    setNewJunctionIp('');
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(true);
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Are you sure you want to reset simulation and historical violation data?'
      )
    ) {
      resetAllData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn">
      {/* 1. Theme Configuration Card (Dark & Light Theme) */}
      <div className="card-modern rounded-3xl p-6 shadow-sm space-y-4 border border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
          <Sun className="w-5 h-5" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Theme &amp; Appearance</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-300">
          Customize the visual interface between Cyber Midnight animated traffic canvas and Clean Modern daytime mode.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Dark Mode */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${theme === 'dark'
                ? 'bg-slate-900 border-indigo-500 shadow-md text-white ring-2 ring-indigo-500/30'
                : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10 hover:border-slate-300 text-slate-700 dark:text-slate-300'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Dark Theme (Cyber Traffic)</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Animated glowing traffic highway background</div>
              </div>
            </div>
            {theme === 'dark' && (
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm" />
            )}
          </button>

          {/* Light Mode */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${theme === 'light'
                ? 'bg-indigo-50/90 border-indigo-600 shadow-md shadow-indigo-500/10 text-indigo-950 ring-2 ring-indigo-500/30'
                : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10 hover:border-slate-300 text-slate-700 dark:text-slate-300'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Light Theme (Basic)</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Electric Indigo &amp; Emerald Grid interface</div>
              </div>
            </div>
            {theme === 'light' && (
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-sm" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Advanced Features Toggle Card */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-500/40 rounded-3xl p-6 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-500/40 flex items-center justify-center shrink-0">
            <FlaskConical className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-950 dark:text-amber-200">Advanced Features</h3>
            <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-0.5">
              Toggles advanced tabs (E-Challan &amp; ANPR, Traffic Forecaster, Green Wave Corridor, Hardware Simulator, Architecture &amp; DBMS) in the navigation sidebar.
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={advancedFeatures}
            onChange={(e) => setAdvancedFeatures(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {/* 3. Zone / Junction Management Card */}
      <div className="card-modern rounded-3xl p-6 shadow-sm space-y-4 border border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Layers className="w-5 h-5" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Junction Management</h3>
        </div>

        {/* Junction Items List */}
        <div className="space-y-3">
          {junctions.map((j) => (
            <div
              key={j.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3"
            >
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{j.name}</div>
                <div className="text-xs font-mono text-slate-500 dark:text-indigo-300 mt-0.5">{j.url}</div>
              </div>

              <button
                onClick={() => deleteJunction(j.id)}
                className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 border border-rose-200 dark:border-rose-500/40 text-rose-600 dark:text-rose-300 flex items-center justify-center transition cursor-pointer"
                title="Remove Junction"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add New Junction Sub-Card */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 space-y-3">
          <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Add New Junction</div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            <input
              type="text"
              placeholder="Junction Name (e.g. Lajpat Nagar LJP-06)"
              value={newJunctionName}
              onChange={(e) => setNewJunctionName(e.target.value)}
              className="sm:col-span-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="Controller IP (e.g. 10.213.45.186)"
              value={newJunctionIp}
              onChange={(e) => setNewJunctionIp(e.target.value)}
              className="sm:col-span-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleAddJunction}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Add Junction
            </button>
          </div>
        </div>
      </div>

      {/* 4. User Profile Card */}
      <div className="card-modern rounded-3xl p-6 shadow-sm space-y-4 border border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <User className="w-5 h-5" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">User Profile</h3>
        </div>

        <div className="space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Full Name:</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {user?.name || 'Officer Vikram Sharma'}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Official Email:</span>
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {user?.email || 'v.sharma@trafix.gov.in'}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Department / Role:</span>
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
              {user?.department || 'Central Traffic Control'}
            </span>
          </div>

          {/* Password Change Form */}
          <form onSubmit={handleUpdatePassword} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/15 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
            >
              Update Password
            </button>

            {passwordSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 text-xs font-medium text-center">
                Password updated successfully.
              </div>
            )}
          </form>
        </div>
      </div>

      {/* 5. About Us Card */}
      <div className="card-modern rounded-3xl p-6 shadow-sm space-y-3 border border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Info className="w-5 h-5" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">About Trafix</h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          Trafix is an intelligent traffic signal controller that leverages Neo4j graph databases to dynamically optimize 4-way intersection cycles, pre-empt emergency vehicles, detect infractions via ANPR vision, and coordinate citywide green waves.
        </p>
        <button
          onClick={onOpenAboutUs}
          className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <Info className="w-4 h-4" />
          <span>About Us</span>
        </button>
      </div>

      {/* 6. Factory Reset Card */}
      <div className="card-modern border-2 border-rose-300 dark:border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/20 rounded-3xl p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
          <Trash2 className="w-5 h-5" />
          <h3 className="text-base font-bold text-rose-700 dark:text-rose-400">Factory Reset</h3>
        </div>
        <p className="text-xs text-rose-900/80 dark:text-rose-200/80">
          Warning: This will permanently delete all simulation records, violation registries, custom thresholds, and reset junction configs.
        </p>
        <button
          onClick={handleResetData}
          className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
        >
          Clear All Data
        </button>
        {resetSuccess && (
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 text-xs font-medium text-center">
            System memory and violation cache reset successfully.
          </div>
        )}
      </div>
    </div>
  );
};
