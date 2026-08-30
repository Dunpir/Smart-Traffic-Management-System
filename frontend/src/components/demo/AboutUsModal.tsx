import React from 'react';
import { X, User, Phone, Mail, Sparkles } from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md cursor-pointer overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-white rounded-lg p-5 sm:p-6 shadow-xl border border-slate-200 dark:border-[#1f1f23] cursor-default my-auto"
      >
        {/* Circular Cross Button in Top-Right Corner */}
        <button
          type="button"
          onClick={() => {
            soundEffects.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white flex items-center justify-center transition cursor-pointer z-50"
          aria-label="Close modal"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center pb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 mb-2">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>SMART CITY TRAFFIC ENGINE</span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white font-sans tracking-tight">
            About Us – Trafix
          </h2>
          <div className="mt-1 space-y-0.5">
            <h3 className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
              A Project by Team DigiX
            </h3>
            <p className="text-[10px] font-mono text-slate-500 dark:text-zinc-500">
              Established: 27-08-2026
            </p>
          </div>
        </div>

        {/* Section 1: DEVELOPED BY */}
        <div className="mt-2 pt-3 border-t border-slate-200 dark:border-[#1f1f23]">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-1.5">
            DEVELOPED BY
          </span>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23]">
            <div className="w-9 h-9 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                LAKSHYA PUNDIR
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                Lead System Architect &amp; Developer
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Contact Us */}
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#1f1f23] space-y-2">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-1">
            Contact Us
          </span>

          {/* Phone */}
          <a
            href="tel:+917340441973"
            className="flex items-center gap-2.5 text-xs font-mono font-medium text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition p-2.5 rounded-lg bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23]"
          >
            <div className="w-7 h-7 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
              <Phone className="w-3.5 h-3.5" />
            </div>
            <span>+91 7340441973</span>
          </a>

          {/* Email */}
          <a
            href="mailto:lpmarshall1107@gmail.com"
            className="flex items-center gap-2.5 text-xs font-mono font-medium text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition p-2.5 rounded-lg bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23]"
          >
            <div className="w-7 h-7 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <span>lpmarshall1107@gmail.com</span>
          </a>
        </div>

        {/* Bottom Close Button */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#1f1f23]">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="w-full py-2 rounded bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-semibold text-xs transition cursor-pointer shadow-xs"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
