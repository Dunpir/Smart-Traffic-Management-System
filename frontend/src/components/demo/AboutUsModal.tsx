import React from 'react';
import { X, User, Phone, Mail, Sparkles } from 'lucide-react';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-lg cursor-pointer overflow-y-auto"
    >
      {/* Modal Dialog Container - High Contrast Midnight Navy */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0d1527] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-indigo-500/40 cursor-default my-auto"
      >
        {/* Prominent Circular Cross Button in Top-Right Corner */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 hover:bg-rose-600 text-white flex items-center justify-center transition-all shadow-md border border-white/30 cursor-pointer z-50"
          aria-label="Close modal"
          title="Close"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Modal Header */}
        <div className="text-center pt-2 pb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600/30 border border-indigo-400/50 text-[11px] font-mono font-bold text-indigo-300 mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>SMART CITY TRAFFIC ENGINE</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white font-sans tracking-tight">
            About Us – Trafix
          </h2>
          <div className="mt-2 space-y-1">
            <h3 className="text-base font-extrabold text-indigo-300">
              A Project by Team DigiX
            </h3>
            <p className="text-xs font-mono font-bold text-slate-300">
              Established: 27-08-2026
            </p>
          </div>
        </div>

        {/* Section 1: DEVELOPED BY */}
        <div className="mt-3 pt-3 border-t border-white/15">
          <span className="block text-xs font-black tracking-wider text-indigo-300 uppercase mb-2">
            DEVELOPED BY
          </span>
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-indigo-950/70 border-2 border-indigo-500/50 shadow-md">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-950 shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-black text-white tracking-wide">
                LAKSHYA PUNDIR
              </div>
              <div className="text-xs font-bold text-indigo-300 font-mono mt-0.5">
                Lead System Architect &amp; Developer
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Contact Us */}
        <div className="mt-4 pt-3 border-t border-white/15 space-y-2.5">
          <span className="block text-xs font-black tracking-wider text-indigo-300 uppercase mb-1">
            Contact Us
          </span>

          {/* Phone */}
          <a
            href="tel:+917340441973"
            className="flex items-center gap-3 text-sm font-bold text-white hover:text-indigo-200 transition p-3 rounded-2xl bg-slate-900 border border-white/15 hover:border-indigo-400"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Phone className="w-4 h-4" />
            </div>
            <span className="font-mono text-sm">+91 7340441973</span>
          </a>

          {/* Email */}
          <a
            href="mailto:lpmarshall1107@gmail.com"
            className="flex items-center gap-3 text-sm font-bold text-white hover:text-indigo-200 transition p-3 rounded-2xl bg-slate-900 border border-white/15 hover:border-indigo-400"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Mail className="w-4 h-4" />
            </div>
            <span className="font-mono text-sm">lpmarshall1107@gmail.com</span>
          </a>
        </div>

        {/* Bottom Close Button */}
        <div className="mt-6 pt-3 border-t border-white/15">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-indigo-950 cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
