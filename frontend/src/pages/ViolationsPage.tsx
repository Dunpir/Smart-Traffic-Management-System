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
import { Button } from '@/components/ui/button';

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
    <div className="space-y-5 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="eyebrow-pill flex items-center gap-1.5 text-slate-700">
              <span>ANPR ENFORCEMENT &amp; REVENUE ENGINE</span>
              <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight bg-gradient-to-br from-slate-900 from-30% to-slate-600 bg-clip-text text-transparent mt-1">
            Automated E-Challan &amp; ANPR Traffic Violation System
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time optical license plate recognition (ANPR), red light violation detection (RLVD), and digital law-enforcement e-challans.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchViolations}
          className="rounded-2xl text-xs font-bold border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 gap-1.5 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
          <span>Refresh Registry</span>
        </Button>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Violations Logged</span>
            <Camera className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-sans">
            {stats ? stats.totalViolations : violations.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            ANPR OCR Accuracy: <span className="text-emerald-700 font-bold">98.4%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Fines Assessed</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1 font-mono">
            ₹{stats ? stats.totalFinesInr.toLocaleString('en-IN') : '34,500'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Under Motor Vehicles Act</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>E-Challan Revenue Collected</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
            ₹{stats ? stats.collectedFinesInr.toLocaleString('en-IN') : '18,500'}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-semibold">
            Collection Rate: {stats ? `${stats.collectionRatePercent}%` : '54%'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Pending Citations</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1 font-sans">
            {stats ? stats.pendingViolations : 12}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">SMS Dispatched to Owners</div>
        </div>
      </div>

      {/* Main Workspace: Left Column (Live Camera Feed) + Right Column (Violation Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
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
