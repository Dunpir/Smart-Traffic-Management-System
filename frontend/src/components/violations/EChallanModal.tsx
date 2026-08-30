import React, { useState } from 'react';
import {
  X,
  Printer,
  CheckCircle,
  CreditCard,
  QrCode,
  ShieldAlert,
  Car,
  Smartphone,
  Share2,
  Calendar,
  MapPin,
  FileText,
} from 'lucide-react';
import { ViolationRecord } from '../../types';

interface EChallanModalProps {
  isOpen: boolean;
  onClose: () => void;
  violation: ViolationRecord | null;
  onPayViolation: (id: string) => Promise<void>;
}

export const EChallanModal: React.FC<EChallanModalProps> = ({
  isOpen,
  onClose,
  violation,
  onPayViolation,
}) => {
  const [isPaying, setIsPaying] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !violation) return null;

  const handlePay = async () => {
    setIsPaying(true);
    try {
      await onPayViolation(violation.id);
    } finally {
      setIsPaying(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `https://echallan.parivahan.gov.in/notice/${violation.challanNumber}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const isPaid = violation.status === 'PAID';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Action Header (Non-printable) */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Official Digital E-Challan Receipt
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 transition"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5 text-teal-600" />
              <span>Print</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 transition"
            >
              <Share2 className="w-3.5 h-3.5 text-teal-600" />
              <span>{copied ? 'Copied!' : 'Copy Notice'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official E-Challan Printable Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-white text-slate-800 font-sans">
          {/* Government / Police Masthead */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
            <div className="text-[10px] font-mono tracking-widest text-teal-800 font-bold uppercase">
              MINISTRY OF ROAD TRANSPORT &amp; HIGHWAYS | PARIVAHAN E-CHALLAN
            </div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-wide uppercase">
              METROPOLITAN TRAFFIC POLICE DEPARTMENT
            </h3>
            <div className="text-xs text-slate-500 font-mono">
              Automated Number Plate Recognition (ANPR) &amp; Traffic Violation Notice
            </div>
          </div>

          {/* Challan Notice Status Badge */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase font-mono">CHALLAN NUMBER</div>
              <div className="text-sm font-mono font-bold text-teal-700">{violation.challanNumber}</div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase font-mono">PAYMENT STATUS</div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isPaid
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {isPaid ? <CheckCircle className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                {violation.status}
              </span>
            </div>
          </div>

          {/* Violator & Vehicle Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Vehicle Plate Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-teal-600" />
                <span>Vehicle Registration</span>
              </div>
              <div className="inline-block px-3 py-1 bg-amber-300 text-black font-black text-base rounded-lg border border-black font-mono">
                {violation.plateNumber}
              </div>
              <div className="text-slate-700 flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Owner Name:</span>
                <span className="font-bold">{violation.ownerName}</span>
              </div>
              <div className="text-slate-700 flex justify-between">
                <span className="text-slate-500">Vehicle Type:</span>
                <span>{violation.vehicleType}</span>
              </div>
            </div>

            {/* Offense Date & Location Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>Location &amp; Timestamp</span>
              </div>
              <div className="text-sm font-bold text-slate-800">
                {violation.junctionId} ({violation.direction} Approach)
              </div>
              <div className="text-slate-700 flex justify-between pt-1 border-t border-slate-200 font-mono text-[11px]">
                <span className="text-slate-500">Date/Time:</span>
                <span>{new Date(violation.timestamp).toLocaleString()}</span>
              </div>
              <div className="text-slate-700 flex justify-between font-mono text-[11px]">
                <span className="text-slate-500">OCR Accuracy:</span>
                <span className="text-emerald-700 font-bold">{violation.anprConfidence}%</span>
              </div>
            </div>
          </div>

          {/* Offense Details & Section Breakdown */}
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
            <div className="text-xs font-bold text-rose-900 flex items-center justify-between">
              <span>Offense: {violation.violationType.replace(/_/g, ' ')}</span>
              <span className="text-base font-black font-mono text-rose-700">₹{violation.fineAmountInr}</span>
            </div>
            <p className="text-xs text-rose-800 font-mono leading-relaxed">
              {violation.motorVehiclesActSection}
            </p>
            {violation.speedKmh && violation.speedLimitKmh && (
              <div className="text-[11px] font-mono text-rose-700 flex gap-4 pt-1 border-t border-rose-200">
                <span>Recorded Speed: <strong>{violation.speedKmh} km/h</strong></span>
                <span>Speed Limit: <strong>{violation.speedLimitKmh} km/h</strong></span>
              </div>
            )}
          </div>

          {/* Evidence QR & SMS Confirmation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <QrCode className="w-12 h-12 text-slate-800" />
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-slate-800">Parivahan QR Verification</div>
                <div className="text-[11px] text-slate-500 font-mono">Scan to verify authenticity</div>
                <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  <span>SMS Dispatched to {violation.smsRecipient}</span>
                </div>
              </div>
            </div>

            {/* Payment Action Button */}
            {!isPaid && (
              <button
                onClick={handlePay}
                disabled={isPaying}
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isPaying ? 'Processing...' : 'Pay Challan (₹' + violation.fineAmountInr + ')'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
