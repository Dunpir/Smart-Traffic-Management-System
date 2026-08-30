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
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'SPEED_VIOLATION':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ILLEGAL_TURN':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'ZEBRA_CROSSING_BLOCK':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'NO_HELMET_SEATBELT':
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-5 space-y-4">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            ANPR Violation Registry &amp; E-Challans
          </h3>
          <div className="text-xs text-slate-400">
            {filtered.length} Citations matching filters
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search plate / challan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-bold focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="RED_LIGHT_JUMP">Red Light Jump</option>
            <option value="SPEED_VIOLATION">Speed Violation</option>
            <option value="ILLEGAL_TURN">Illegal Turn</option>
            <option value="ZEBRA_CROSSING_BLOCK">Zebra Block</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-bold focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-3">Plate &amp; Challan</th>
              <th className="p-3">Violation Type</th>
              <th className="p-3">Direction</th>
              <th className="p-3">Fine (INR)</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                  No violation records match your current filter.
                </td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3">
                    <div className="font-bold text-slate-800 font-mono text-xs">{v.plateNumber}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{v.challanNumber}</div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTypeBadge(v.violationType)}`}>
                      {v.violationType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-600 text-xs">
                    {v.direction} ({v.roadId})
                  </td>
                  <td className="p-3 font-bold text-slate-900 font-mono text-xs">
                    ₹{v.fineAmountInr}
                  </td>
                  <td className="p-3">
                    {v.status === 'PAID' ? (
                      <span className="flex items-center gap-1 text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 w-fit">
                        <CheckCircle className="w-3 h-3" /> PAID
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-700 font-bold text-[10px] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 w-fit">
                        <Clock className="w-3 h-3" /> PENDING
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectViolation(v)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>

                      {v.status === 'PENDING' && (
                        <button
                          onClick={() => onPayViolation(v.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition shadow-2xs"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Pay</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
