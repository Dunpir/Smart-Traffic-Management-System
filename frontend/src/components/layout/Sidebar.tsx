import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  TrendingUp,
  Map,
  Navigation,
  Sliders,
  Cpu,
  Database,
  Network,
  Terminal,
  Settings,
  ShieldAlert,
  Layers,
  Activity,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export type NavTab =
  | 'dashboard'
  | 'simulation'
  | 'analytics'
  | 'violations'
  | 'forecaster'
  | 'citymap'
  | 'corridor'
  | 'controller'
  | 'hardware'
  | 'database'
  | 'settings'
  | 'architecture'
  | 'logs';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  hasActiveEmergency: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  hasActiveEmergency,
}) => {
  const { advancedFeatures, junctions, selectedJunction, setSelectedJunction, theme } = useSettings();

  // All Navigation Items
  const allNavItems: {
    id: NavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    isAdvanced?: boolean;
  }[] = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'simulation', label: 'STMS Simulation', icon: Activity },
      { id: 'analytics', label: 'Live Analytics', icon: BarChart3 },
      { id: 'violations', label: 'E-Challan & ANPR', icon: FileText, isAdvanced: true },
      { id: 'forecaster', label: 'Traffic Forecaster', icon: TrendingUp, isAdvanced: true },
      { id: 'citymap', label: 'City Intersections Map', icon: Map },
      { id: 'corridor', label: 'Green Wave Corridor', icon: Navigation, isAdvanced: true },
      { id: 'controller', label: 'Signal Controller', icon: Sliders },
      { id: 'hardware', label: 'Hardware Simulator', icon: Cpu, isAdvanced: true },
      { id: 'database', label: 'Neo4j Database', icon: Database },
      { id: 'architecture', label: 'Architecture & DBMS', icon: Network, isAdvanced: true },
      { id: 'logs', label: 'System Logs', icon: Terminal },
    ];

  // Filter items based on whether Advanced Features are enabled
  const visibleNavItems = allNavItems.filter((item) => !item.isAdvanced || advancedFeatures);

  const isDark = theme === 'dark';

  return (
    <aside
      className={`w-full md:w-64 rounded-3xl p-4 shadow-2xl border flex flex-col justify-between gap-4 shrink-0 m-2 md:m-3 self-start transition-colors ${isDark
          ? 'bg-[#0a0b10]/95 backdrop-blur-xl border-red-500/25 text-white shadow-red-950/30'
          : 'bg-white/90 backdrop-blur-xl border-slate-200/90 text-slate-800'
        }`}
    >
      <div className="space-y-4">
        {/* Active Junction Selector Box */}
        <div
          className={`p-3 rounded-2xl border space-y-1.5 shadow-sm transition-colors ${isDark
              ? 'bg-red-950/30 border-red-500/30'
              : 'bg-red-50/70 border-red-200/80'
            }`}
        >
          <label
            className={`block text-[10px] font-black tracking-wider uppercase ${isDark ? 'text-red-400' : 'text-red-900'
              }`}
          >
            ACTIVE JUNCTION
          </label>
          <select
            value={selectedJunction}
            onChange={(e) => setSelectedJunction(e.target.value)}
            className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 transition shadow-sm ${isDark
                ? 'bg-black/90 border-red-500/40 text-slate-100 focus:ring-red-400/30'
                : 'bg-white border-red-200 text-slate-800 focus:ring-red-400/30'
              }`}
          >
            {junctions.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name}
              </option>
            ))}
          </select>
        </div>

        {/* Main Navigation Tabs */}
        <nav className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-visible">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold tracking-tight transition-all whitespace-nowrap text-left ${isActive
                    ? isDark
                      ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-lg shadow-red-950/60 font-extrabold'
                      : 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/25 font-extrabold'
                    : isDark
                      ? 'text-zinc-400 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 hover:text-red-950 hover:bg-red-50/60'
                  }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform ${isActive
                      ? 'text-white scale-105'
                      : isDark
                        ? 'text-zinc-500'
                        : 'text-slate-400'
                    }`}
                />
                <span className="flex-1">{item.label}</span>

                {item.id === 'dashboard' && hasActiveEmergency && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3">
        {/* Emergency Alert Banner in Sidebar when Emergency is active */}
        {hasActiveEmergency && (
          <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-300 animate-pulse space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>EMERGENCY ACTIVE</span>
            </div>
            <p className="text-[10px] font-mono text-rose-200">
              Green corridor engaged on active route.
            </p>
          </div>
        )}

        {/* Pinned Bottom Settings Button */}
        <div className={`pt-2 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <button
            onClick={() => onSelectTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold tracking-tight transition-all text-left ${activeTab === 'settings'
                ? isDark
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-lg shadow-red-950/60 font-extrabold'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/25 font-extrabold'
                : isDark
                  ? 'text-zinc-300 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10'
                  : 'text-slate-700 bg-slate-100 hover:bg-red-50 hover:text-red-900 border border-slate-200'
              }`}
          >
            <Settings
              className={`w-4 h-4 transition-transform ${activeTab === 'settings'
                  ? 'text-white'
                  : isDark
                    ? 'text-red-400'
                    : 'text-red-600'
                }`}
            />
            <span className="flex-1">Settings &amp; Theme</span>
            {activeTab === 'settings' && (
              <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-slate-950' : 'bg-white'}`} />
            )}
          </button>
        </div>

        {/* Footer Copyright */}
        <div
          className={`pt-1 text-center text-xs font-semibold ${isDark ? 'text-zinc-500' : 'text-slate-400'
            }`}
        >
          © 2026 Trafix STMS
        </div>
      </div>
    </aside>
  );
};
