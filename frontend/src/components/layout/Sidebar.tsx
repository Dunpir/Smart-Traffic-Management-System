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
  LogOut,
  FileText,
  User,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
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
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(hasActiveEmergency ? 2 : 1);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Admin';
  const initials = displayName.slice(0, 2).toUpperCase();
  const userRole = user?.role || 'City Administrator';

  // Navigation routes
  const allNavigationItems: Array<{
    id: NavTab;
    label: string;
    icon: any;
    isAdvanced?: boolean;
    badge?: string;
  }> = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'simulation', label: 'Simulation & Chaos', icon: Box },
    { id: 'citymap', label: 'City Map Grid', icon: Map },
    { id: 'corridor', label: 'Green Corridor', icon: Navigation },
    { id: 'violations', label: 'ANPR Violations', icon: ShieldAlert, badge: 'RLVD' },
    { id: 'controller', label: 'Signal Controller', icon: Sliders },
    { id: 'analytics', label: 'Analytics & Trends', icon: BarChart3 },
    { id: 'forecaster', label: 'AI Forecaster', icon: TrendingUp, badge: 'ARIMA' },
    { id: 'logs', label: 'Audit Logs', icon: Terminal },
    { id: 'hardware', label: 'Hardware IoT', icon: Cpu, isAdvanced: true, badge: 'GPIO' },
    { id: 'database', label: 'Neo4j Database', icon: Database, isAdvanced: true },
    { id: 'architecture', label: 'DBMS Architecture', icon: Network, isAdvanced: true, badge: 'BCNF' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const visibleItems = allNavigationItems.filter((item) => {
    if (item.isAdvanced && !advancedFeatures) return false;
    if (
      searchTerm &&
      !item.label.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <aside className="w-64 bg-white/90 dark:bg-black/75 backdrop-blur-md border-r border-slate-200 dark:border-[#1f1f23]/80 p-3.5 flex flex-col justify-between shrink-0 h-[calc(100vh-3.25rem)] sticky top-13 select-none transition-colors">
      <div className="space-y-3 overflow-hidden flex flex-col flex-1">
        {/* Search / Filter Input inside Sidebar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search Modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-[#0a0a0a]/70 border border-slate-200 dark:border-[#222226] rounded-md text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500 transition font-mono"
          />
        </div>

        {/* Navigation Items List */}
        <nav className="space-y-0.5 overflow-y-auto pr-1 flex-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  onSelectTab(item.id);
                  setIsUserMenuOpen(false);
                  setIsNotificationsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-semibold shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-white dark:text-black' : 'text-slate-400 dark:text-zinc-500'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                      isActive
                        ? 'bg-slate-800 text-white border-slate-700 dark:bg-zinc-200 dark:text-black dark:border-zinc-300'
                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#141417]/80 dark:text-zinc-400 dark:border-[#222226]'
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
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300 text-xs space-y-1 animate-pulse backdrop-blur-xs">
            <div className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400">
              <ShieldAlert className="w-4 h-4" />
              <span>EMERGENCY CORRIDOR</span>
            </div>
            <p className="text-[11px] text-red-600 dark:text-red-200">
              Green wave pre-emption active. Conflicting approaches held at Red.
            </p>
          </div>
        )}
      </div>

      {/* Dynamic Logged-in User Profile Footer with Working Menus */}
      <div className="pt-3 border-t border-slate-200 dark:border-[#1f1f23]/80 relative">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white dark:bg-gradient-to-tr dark:from-zinc-700 dark:via-zinc-800 dark:to-zinc-900 border border-slate-300 dark:border-zinc-700 flex items-center justify-center text-[10px] font-bold shadow-xs shrink-0">
              {initials}
            </div>
            <div className="truncate">
              <p className="text-slate-900 dark:text-white text-xs font-semibold truncate">{displayName}</p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono truncate">{userRole}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-slate-500 dark:text-zinc-400">
            {/* Notification Bell Button */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsUserMenuOpen(false);
              }}
              className="p-1 rounded hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800 dark:hover:text-white transition cursor-pointer relative"
              title="System Notifications"
            >
              <Bell className="w-3.5 h-3.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>

            {/* 3 Dots Menu Button */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setIsUserMenuOpen(!isUserMenuOpen);
                setIsNotificationsOpen(false);
              }}
              className="p-1 rounded hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800 dark:hover:text-white transition cursor-pointer"
              title="User Options & Logout"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3 Dots Dropdown Menu */}
        {isUserMenuOpen && (
          <div className="absolute bottom-12 right-0 w-60 bg-white dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 z-50 text-xs font-medium animate-in fade-in zoom-in-95">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-900">
              <p className="font-semibold text-slate-900 dark:text-white">{displayName}</p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono truncate">{user?.email || 'admin@trafix.gov.in'}</p>
              <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-100 text-slate-700 dark:bg-zinc-900 dark:text-zinc-400">
                {userRole}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setIsUserMenuOpen(false);
                onSelectTab('settings');
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-2 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>System Settings</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setIsUserMenuOpen(false);
                onSelectTab('logs');
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-2 cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <span>View Audit Logs</span>
            </button>

            <div className="border-t border-slate-100 dark:border-zinc-900 my-1" />

            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setIsUserMenuOpen(false);
                logout();
              }}
              className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 hover:text-red-700 dark:hover:bg-red-950/40 dark:text-red-400 transition flex items-center gap-2 cursor-pointer font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        )}

        {/* Notifications Popover */}
        {isNotificationsOpen && (
          <div className="absolute bottom-12 right-0 w-72 bg-white dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 space-y-2">
            <div className="flex items-center justify-between px-3 pb-2 border-b border-slate-100 dark:border-zinc-900">
              <span className="font-semibold text-slate-900 dark:text-white">Notifications</span>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setUnreadCount(0);
                }}
                className="text-[10px] text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
              >
                Mark read
              </button>
            </div>

            <div className="px-3 space-y-2 max-h-56 overflow-y-auto">
              {hasActiveEmergency && (
                <div className="p-2 rounded bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-900 text-red-800 dark:text-red-300 space-y-0.5">
                  <div className="flex items-center gap-1 font-bold text-[11px]">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    <span>Emergency Priority Active</span>
                  </div>
                  <p className="text-[10px]">Ambulance pre-emption corridor engaged.</p>
                </div>
              )}

              <div className="p-2 rounded bg-slate-50 border border-slate-200 dark:bg-zinc-900/60 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 space-y-0.5">
                <div className="flex items-center gap-1 font-bold text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>Neo4j Graph Database Active</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400">All 7 intersection nodes synchronized.</p>
              </div>

              <div className="p-2 rounded bg-slate-50 border border-slate-200 dark:bg-zinc-900/60 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 space-y-0.5">
                <div className="flex items-center gap-1 font-bold text-[11px]">
                  <ShieldAlert className="w-3 h-3 text-amber-500" />
                  <span>ANPR Camera OCR</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400">Optical scanner operating at 60 FPS UHD.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
