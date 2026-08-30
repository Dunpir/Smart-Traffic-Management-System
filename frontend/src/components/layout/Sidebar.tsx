import React, { useState } from 'react';
import {
  FolderKanban,
  Layers,
  Terminal,
  BarChart3,
  Gauge,
  Eye,
  Shield,
  Globe,
  Sliders,
  Network,
  Database,
  Cpu,
  Search,
  Settings,
  Bell,
  MoreHorizontal,
  ShieldAlert,
  Sparkles,
  Map,
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

  const sidebarNavItems: {
    id: NavTab;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }[] = [
    { id: 'dashboard', label: 'Projects', icon: FolderKanban },
    { id: 'controller', label: 'Deployments', icon: Layers },
    { id: 'logs', label: 'Logs', icon: Terminal },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'forecaster', label: 'Speed Insights', icon: Gauge },
    { id: 'simulation', label: 'Observability', icon: Eye },
    { id: 'violations', label: 'Firewall', icon: Shield, badge: 'ANPR' },
    { id: 'corridor', label: 'CDN / Corridors', icon: Globe },
    { id: 'citymap', label: 'Domains / City Map', icon: Map },
    { id: 'database', label: 'Storage', icon: Database },
    { id: 'architecture', label: 'Architecture & Schema', icon: Network },
    { id: 'hardware', label: 'Environment Variables', icon: Sliders },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const filteredItems = sidebarNavItems.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="w-full md:w-56 shrink-0 flex flex-col justify-between border-r border-[#27272a] bg-[#000000] p-3 text-zinc-400 select-none min-h-[calc(100vh-100px)]">
      <div className="space-y-4">
        {/* Vercel Search Box */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Find..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-[#0a0a0a] border border-[#27272a] focus:border-zinc-500 rounded-md text-xs text-white placeholder-zinc-500 focus:outline-none transition"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500 bg-[#18181b] px-1.5 py-0.5 rounded border border-[#27272a]">
            F
          </span>
        </div>

        {/* Sidebar Navigation Items */}
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
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-[#18181b] text-white font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-[#111111]'
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
                  <span className="text-[9px] font-mono px-1 rounded bg-[#27272a] text-zinc-300">
                    {item.badge}
                  </span>
                )}

                {item.id === 'dashboard' && hasActiveEmergency && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Active Emergency Vercel Incident Banner */}
        {hasActiveEmergency && (
          <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs space-y-1 animate-pulse">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>INCIDENT ACTIVE</span>
            </div>
            <p className="text-[10px] text-red-200">
              Emergency Green wave corridor engaged.
            </p>
          </div>
        )}
      </div>

      {/* Bottom User / Team Card */}
      <div className="pt-3 border-t border-[#1f1f23] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-900 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-white">
            D
          </div>
          <div className="truncate">
            <p className="text-white text-xs font-medium truncate">dunpir</p>
            <p className="text-[10px] text-zinc-500 font-mono">Team DigiX</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-zinc-500">
          <Bell className="w-3.5 h-3.5 hover:text-white cursor-pointer transition" />
          <MoreHorizontal className="w-3.5 h-3.5 hover:text-white cursor-pointer transition" />
        </div>
      </div>
    </aside>
  );
};
