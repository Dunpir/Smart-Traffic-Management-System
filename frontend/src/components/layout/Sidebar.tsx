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
  Activity,
} from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');

  // Real traffic management navigation routes (No fake or dummy tabs!)
  const navigationItems: {
    id: NavTab;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'simulation', label: '3D Simulation', icon: Box, badge: 'WebGL' },
    { id: 'citymap', label: 'City Map Grid', icon: Map },
    { id: 'violations', label: 'ANPR Violations', icon: ShieldAlert, badge: 'AI' },
    { id: 'controller', label: 'Signal Controller', icon: Sliders },
    { id: 'corridor', label: 'Green Corridor', icon: Navigation },
    { id: 'hardware', label: 'Hardware IoT', icon: Cpu },
    { id: 'analytics', label: 'Traffic Analytics', icon: BarChart3 },
    { id: 'forecaster', label: 'AI Forecaster', icon: TrendingUp },
    { id: 'architecture', label: 'DBMS Architecture', icon: Network, badge: 'BCNF' },
    { id: 'database', label: 'Database Graph', icon: Database, badge: 'Neo4j' },
    { id: 'logs', label: 'Audit Logs', icon: Terminal },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const filteredItems = navigationItems.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="w-full md:w-60 shrink-0 flex flex-col justify-between border-r border-[#1f1f23] bg-[#000000] p-3 text-zinc-400 select-none min-h-[calc(100vh-100px)]">
      <div className="space-y-3">
        {/* Vercel Search Box */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Find module..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-[#0a0a0a] border border-[#222226] focus:border-zinc-500 rounded-md text-xs text-white placeholder-zinc-500 focus:outline-none transition font-sans"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500 bg-[#141417] px-1.5 py-0.5 rounded border border-[#27272a]">
            F
          </span>
        </div>

        {/* Real Traffic Navigation Menu */}
        <nav className="space-y-0.5">
          {filteredItems.map((item) => {
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
                    ? 'bg-[#18181b] text-white font-semibold shadow-xs'
                    : 'text-zinc-400 hover:text-white hover:bg-[#0e0e11]'
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
                        ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                        : 'bg-[#141417] text-zinc-400 border-[#222226]'
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
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/80 text-red-300 text-xs space-y-1 animate-pulse">
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
      <div className="pt-3 border-t border-[#1f1f23] flex items-center justify-between text-xs">
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
