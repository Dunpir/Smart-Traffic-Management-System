import React, { useState } from 'react';
import {
  LayoutDashboard,
  Box,
  Map,
  ShieldAlert,
  Sliders,
  Navigation,
  Cpu,
  BarChart3,
  TrendingUp,
  Network,
  Database,
  Terminal,
  Settings,
  Search,
  Bell,
  MoreHorizontal,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { soundEffects } from '../../utils/soundEffects';

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
  const { advancedFeatures } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');

  // Real traffic management navigation routes
  const allNavigationItems: {
    id: NavTab;
    label: string;
    icon: React.ElementType;
    badge?: string;
    isAdvanced?: boolean;
  }[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'simulation', label: '3D Simulation', icon: Box, badge: 'WebGL' },
    { id: 'citymap', label: 'City Map Grid', icon: Map },
    { id: 'controller', label: 'Signal Controller', icon: Sliders },
    { id: 'analytics', label: 'Traffic Analytics', icon: BarChart3 },
    // Advanced features toggled via Settings
    { id: 'violations', label: 'ANPR Violations', icon: ShieldAlert, badge: 'AI', isAdvanced: true },
    { id: 'corridor', label: 'Green Corridor', icon: Navigation, isAdvanced: true },
    { id: 'hardware', label: 'Hardware IoT', icon: Cpu, isAdvanced: true },
    { id: 'forecaster', label: 'AI Forecaster', icon: TrendingUp, isAdvanced: true },
    { id: 'architecture', label: 'DBMS Architecture', icon: Network, badge: 'BCNF', isAdvanced: true },
    { id: 'database', label: 'Database Graph', icon: Database, badge: 'Neo4j', isAdvanced: true },
    { id: 'logs', label: 'Audit Logs', icon: Terminal, isAdvanced: true },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Filter based on Advanced Features setting
  const visibleItems = allNavigationItems.filter((item) => {
    if (item.isAdvanced && !advancedFeatures) {
      return false;
    }
    return item.label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <aside className="w-full md:w-60 shrink-0 flex flex-col justify-between border-r border-[#1f1f23]/80 bg-black/60 backdrop-blur-md p-3 text-zinc-400 select-none min-h-[calc(100vh-80px)]">
      <div className="space-y-3">
        {/* Search Box */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Find module..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-[#0a0a0a]/70 border border-[#222226] focus:border-zinc-500 rounded-md text-xs text-white placeholder-zinc-500 focus:outline-none transition font-sans"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500 bg-[#141417] px-1.5 py-0.5 rounded border border-[#27272a]">
            F
          </span>
        </div>

        {/* Real Traffic Navigation Menu */}
        <nav className="space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  soundEffects.playTabSwitch();
                  onSelectTab(item.id);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-white/10 text-white font-semibold shadow-xs backdrop-blur-xs'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-zinc-500'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                      isActive
                        ? 'bg-zinc-800/80 text-zinc-200 border-zinc-700'
                        : 'bg-[#141417]/80 text-zinc-400 border-[#222226]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {item.id === 'dashboard' && hasActiveEmergency && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Emergency Alert Widget in Sidebar if Active */}
        {hasActiveEmergency && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/80 text-red-300 text-xs space-y-1 animate-pulse backdrop-blur-xs">
            <div className="flex items-center gap-1.5 font-bold text-red-400">
              <ShieldAlert className="w-4 h-4" />
              <span>EMERGENCY CORRIDOR</span>
            </div>
            <p className="text-[11px] text-red-200">
              Green wave pre-emption active. All conflicting approaches held at Red.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Profile Footer: Lakshya Pundir & Team DigiX */}
      <div className="pt-3 border-t border-[#1f1f23]/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-zinc-700 via-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
            LP
          </div>
          <div className="truncate">
            <p className="text-white text-xs font-semibold truncate">Lakshya Pundir</p>
            <p className="text-[10px] text-zinc-500 font-mono">Team DigiX • Lead</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-zinc-500">
          <Bell className="w-3.5 h-3.5 hover:text-white cursor-pointer transition" />
          <MoreHorizontal className="w-3.5 h-3.5 hover:text-white cursor-pointer transition" />
        </div>
      </div>
    </aside>
  );
};
