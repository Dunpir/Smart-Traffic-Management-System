import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Camera,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import { AnprCameraFeedCard } from '../components/violations/AnprCameraFeedCard';
import { ViolationLogTable } from '../components/violations/ViolationLogTable';
import { EChallanModal } from '../components/violations/EChallanModal';
import { ViolationRecord, ViolationStats, Direction } from '../types';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { soundEffects } from '../utils/soundEffects';

export const ViolationsPage: React.FC = () => {
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [stats, setStats] = useState<ViolationStats | null>(null);
  const [selectedViolation, setSelectedViolation] = useState<ViolationRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [latestViolation, setLatestViolation] = useState<ViolationRecord | null>(null);

  const fetchViolations = async () => {
    try {
      const [vRes, sRes] = await Promise.all([api.getViolations(), api.getViolationStats()]);
      if (vRes?.success) {
        setViolations(vRes.data);
        if (vRes.data.length > 0 && !latestViolation) {
          setLatestViolation(vRes.data[0]);
        }
      }
      if (sRes?.success) setStats(sRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchViolations();

    const socket = getSocket();
    socket.on('violation:new', (newV: ViolationRecord) => {
      setViolations((prev) => [newV, ...prev]);
      setLatestViolation(newV);
      fetchViolations();
    });

    socket.on('violation:paid', (paidV: ViolationRecord) => {
      setViolations((prev) => prev.map((v) => (v.id === paidV.id ? paidV : v)));
      if (selectedViolation?.id === paidV.id) {
        setSelectedViolation(paidV);
      }
      fetchViolations();
    });

    return () => {
      socket.off('violation:new');
      socket.off('violation:paid');
    };
  }, []);

  const handleTriggerViolation = async (direction: Direction, violationType: any, speedKmh?: number) => {
    try {
      soundEffects.playViolationPing();
      const res = await api.triggerViolation({
        direction,
        violationType,
        speedKmh,
      });

      if (res?.success) {
        setLatestViolation(res.data);
        setSelectedViolation(res.data);
        setIsModalOpen(true);
        fetchViolations();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePayViolation = async (id: string) => {
    try {
      soundEffects.playClick();
      const res = await api.payViolation(id);
      if (res?.success) {
        setSelectedViolation(res.data);
        fetchViolations();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 text-slate-900 dark:text-white transition-colors">
      {/* Header Banner */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Automated E-Challan &amp; ANPR Violation Engine
              </h1>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-[#141417] dark:text-zinc-400 dark:border-[#222226]">
                RLVD + OCR
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans mt-0.5">
              Real-time optical license plate recognition (ANPR), red light violation detection (RLVD), and digital e-challans.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            soundEffects.playClick();
            fetchViolations();
          }}
          className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Registry</span>
        </button>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
          <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Total Violations Logged</span>
            <Camera className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-300" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            {stats ? stats.totalViolations : violations.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono mt-0.5">
            OCR Accuracy: <span className="text-emerald-600 dark:text-emerald-400 font-bold">98.4%</span>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
          <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Total Fines Assessed</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            ₹{stats ? stats.totalFinesInr.toLocaleString('en-IN') : '34,500'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono mt-0.5">Under Motor Vehicles Act</div>
        </div>

        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
          <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>E-Challan Revenue</span>
            <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            ₹{stats ? stats.collectedFinesInr.toLocaleString('en-IN') : '18,500'}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 font-semibold">
            Collection: {stats ? `${stats.collectionRatePercent}%` : '54%'}
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
          <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Pending Citations</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            {stats ? stats.pendingViolations : 12}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono mt-0.5">SMS Dispatched to Owners</div>
        </div>
      </div>

      {/* Main Workspace: Left Column (Live Camera Feed) + Right Column (Violation Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Live ANPR Scanner */}
        <div className="lg:col-span-5 space-y-4">
          <AnprCameraFeedCard
            latestViolation={latestViolation}
            onTriggerViolation={handleTriggerViolation}
          />
        </div>

        {/* Right Column: Violation Table */}
        <div className="lg:col-span-7 space-y-4">
          <ViolationLogTable
            violations={violations}
            onSelectViolation={(v) => {
              setSelectedViolation(v);
              setIsModalOpen(true);
            }}
            onPayViolation={handlePayViolation}
          />
        </div>
      </div>

      {/* Official E-Challan Printable Modal */}
      <EChallanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        violation={selectedViolation}
        onPayViolation={handlePayViolation}
      />
    </div>
  );
};
