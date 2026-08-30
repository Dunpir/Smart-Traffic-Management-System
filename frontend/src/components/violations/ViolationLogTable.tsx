import React, { useState } from 'react';
import {
  Search,
  Filter,
  FileText,
  CreditCard,
  CheckCircle,
  Clock,
  Car,
  Eye,
} from 'lucide-react';
import { ViolationRecord, ViolationType } from '../../types';
import { soundEffects } from '../../utils/soundEffects';

interface ViolationLogTableProps {
  violations: ViolationRecord[];
  onSelectViolation: (violation: ViolationRecord) => void;
  onPayViolation: (id: string) => Promise<void>;
}

export const ViolationLogTable: React.FC<ViolationLogTableProps> = ({
  violations,
  onSelectViolation,
  onPayViolation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = violations.filter((v) => {
    const matchesSearch =
      v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.challanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.ownerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'ALL' || v.violationType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeBadge = (type: ViolationType) => {
    switch (type) {
      case 'RED_LIGHT_JUMP':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900';
      case 'SPEED_VIOLATION':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900';
      case 'ILLEGAL_TURN':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900';
      case 'ZEBRA_CROSSING_BLOCK':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-900';
      case 'NO_HELMET_SEATBELT':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800';
    }
  };

  return (
    <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs p-4 sm:p-5 space-y-3.5 text-slate-900 dark:text-white transition">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-200 dark:border-[#1f1f23]">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
            E-Challan Registry Log
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono">
            {filtered.length} of {violations.length} recorded traffic infractions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search plate or challan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 bg-slate-50 dark:bg-[#141418] border border-slate-200 dark:border-zinc-700 rounded text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2 py-1 bg-slate-50 dark:bg-[#141418] border border-slate-200 dark:border-zinc-700 rounded text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">All Violations</option>
            <option value="RED_LIGHT_JUMP">Red Light</option>
            <option value="SPEED_VIOLATION">Overspeed</option>
            <option value="ILLEGAL_TURN">Illegal Turn</option>
            <option value="ZEBRA_CROSSING_BLOCK">Crosswalk</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 text-left">
              <th className="pb-2">License Plate</th>
              <th className="pb-2">Violation</th>
              <th className="pb-2">Fine</th>
              <th className="pb-2">Timestamp</th>
              <th className="pb-2">Status</th>
              <th className="pb-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                    {v.plateNumber}
                  </span>
                </td>
                <td className="py-2.5">
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] ${getTypeBadge(v.violationType)}`}>
                    {v.violationType.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="py-2.5 font-bold text-slate-900 dark:text-white">₹{v.fineAmountInr}</td>
                <td className="py-2.5 text-slate-500 dark:text-zinc-400">{v.timestamp?.split('T')[1]?.slice(0, 8) || 'Just now'}</td>
                <td className="py-2.5">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      v.status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {v.status}
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      onSelectViolation(v);
                    }}
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 transition cursor-pointer text-[10px]"
                  >
                    View E-Challan
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
