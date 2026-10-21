import React, { useState } from 'react';
import {
  X,
  Send,
  Check,
  CheckCheck,
  Smartphone,
  ShieldCheck,
  Share2,
  ExternalLink,
  Camera,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { ViolationRecord } from '../../types';
import { soundEffects } from '../../utils/soundEffects';

interface WhatsAppNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  violation: ViolationRecord | null;
}

export const WhatsAppNotificationModal: React.FC<WhatsAppNotificationModalProps> = ({
  isOpen,
  onClose,
  violation,
}) => {
  const [phoneNumber, setPhoneNumber] = useState<string>('+91 98765 43210');
  const [deliveryStatus, setDeliveryStatus] = useState<'IDLE' | 'SENDING' | 'SENT' | 'READ'>('READ');

  if (!isOpen || !violation) return null;

  const fineAmount = violation.fineAmountInr || 2000;

  const handleSend = () => {
    soundEffects.playClick();
    setDeliveryStatus('SENDING');
    setTimeout(() => {
      setDeliveryStatus('SENT');
      soundEffects.playSuccess();
      setTimeout(() => {
        setDeliveryStatus('READ');
      }, 1200);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-md bg-slate-950 border border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-950/60 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#075e54] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-400">
              🚔
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold font-sans">Delhi Traffic Police E-Challan</span>
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 text-[#075e54] flex items-center justify-center text-[9px] font-bold">
                  ✓
                </span>
              </div>
              <div className="text-[10px] text-emerald-200">Official Automated Dispatcher Bot</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-emerald-800 text-emerald-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* WhatsApp Chat Wallpaper Body */}
        <div className="p-4 bg-[#0b141a] min-h-[380px] space-y-3 font-sans overflow-y-auto">
          {/* Encryption Notice */}
          <div className="px-3 py-1.5 rounded-lg bg-[#182229] text-[#ffd279] text-[10px] text-center max-w-[85%] mx-auto border border-yellow-900/30">
            🔒 Messages are end-to-end encrypted. Sent directly from Delhi Traffic Police Automated ANPR Engine.
          </div>

          {/* Incoming WhatsApp Notice Bubble */}
          <div className="bg-[#1f2c34] text-slate-200 rounded-2xl rounded-tl-none p-3.5 max-w-[92%] space-y-2 border border-slate-700/60 shadow-md">
            {/* Header Badge */}
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 border-b border-slate-700/80 pb-1.5">
              <span>🚨 OFFICIAL TRAFFIC VIOLATION NOTICE</span>
              <span className="text-slate-400 text-[9px]">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            {/* Vehicle Number & Info */}
            <div className="space-y-1 text-xs">
              <div>
                Dear Vehicle Owner, your vehicle <strong className="text-white font-mono bg-[#111b21] px-1 py-0.5 rounded border border-slate-700">{violation.plateNumber}</strong> has been captured by AI ANPR Smart Cameras.
              </div>

              <div className="p-2 rounded-xl bg-[#111b21] border border-slate-800 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Challan No:</span>
                  <span className="text-cyan-400 font-bold">{violation.challanNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Violation:</span>
                  <span className="text-rose-400 font-bold">{violation.violationType.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Speed / Loc:</span>
                  <span className="text-slate-300">{violation.speedKmh ? `${violation.speedKmh} km/h` : 'Red Light Intercept'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fine Amount:</span>
                  <span className="text-emerald-400 font-bold">₹{fineAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Pay Now Button Link */}
            <div className="pt-1">
              <a
                href={`https://echallan.parivahan.gov.in/notice/${violation.challanNumber}`}
                target="_blank"
                rel="noreferrer"
                className="block text-center py-2 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold tracking-wide transition shadow-sm"
              >
                Pay Challan Online (VAHAN / UPI) →
              </a>
            </div>

            {/* Bubble Footer & Blue Ticks */}
            <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-0.5">
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {deliveryStatus === 'READ' ? (
                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
              ) : deliveryStatus === 'SENT' ? (
                <Check className="w-3.5 h-3.5 text-slate-400" />
              ) : null}
            </div>
          </div>
        </div>

        {/* Dispatch Controls Footer */}
        <div className="p-3 bg-[#111b21] border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-[#2a3942] border border-slate-700 text-white text-xs font-mono focus:outline-none"
              placeholder="+91 Phone Number"
            />
            <button
              onClick={handleSend}
              className="px-3 py-1.5 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold font-mono flex items-center gap-1.5 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simulate Re-send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
