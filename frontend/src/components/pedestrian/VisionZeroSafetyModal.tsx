import React, { useState } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  AlertTriangle,
  User,
  Footprints,
  Clock,
  CheckCircle2,
  Sliders,
  TrendingDown,
  Info,
} from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';

interface VisionZeroSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lpiSeconds?: number;
  onSetLpi?: (seconds: number) => void;
}

export const VisionZeroSafetyModal: React.FC<VisionZeroSafetyModalProps> = ({
  isOpen,
  onClose,
  lpiSeconds = 4,
  onSetLpi,
}) => {
  const [selectedLpi, setSelectedLpi] = useState<number>(lpiSeconds);
  const [applied, setApplied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleApply = (sec: number) => {
    soundEffects.playSuccess();
    setSelectedLpi(sec);
    if (onSetLpi) onSetLpi(sec);
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fadeIn select-none font-mono">
      <div className="bg-slate-950 border border-emerald-800/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                  Vision Zero Pedestrian Safety Operations
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                  FHWA PROVEN SAFETY COUNTERMEASURE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Leading Pedestrian Interval (LPI) &amp; Protected Crosswalk Conflict Elimination
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Scientific Vision Zero Overview */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
              <Footprints className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-bold text-white text-sm">
                What is a Leading Pedestrian Interval (LPI)?
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                An LPI gives pedestrians an advance walk signal (typically 3 to 7 seconds) before parallel vehicular traffic gets a green signal. This allows pedestrians to establish their presence in the crosswalk before turning vehicles enter the intersection, reducing pedestrian-vehicle conflict crashes by up to <strong>60%</strong> (Federal Highway Administration, FHWA).
              </p>
            </div>
          </div>

          {/* LPI Configuration Options */}
          <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Configure Leading Pedestrian Interval (LPI) Duration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              {[
                { sec: 0, label: 'Disabled (0s)', desc: 'Vehicles and Pedestrians release simultaneously' },
                { sec: 3, label: '3 Seconds', desc: 'Standard urban crosswalk head start' },
                { sec: 4, label: '4 Seconds (Recommended)', desc: 'MUTCD 4E.06 optimal pedestrian visibility' },
                { sec: 6, label: '6 Seconds (High Density)', desc: 'School zones & senior pedestrian corridors' },
              ].map((opt) => (
                <button
                  key={opt.sec}
                  onClick={() => handleApply(opt.sec)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    selectedLpi === opt.sec
                      ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                      <span>{opt.label}</span>
                      {selectedLpi === opt.sec && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-normal">
                      {opt.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {applied && (
              <div className="p-2 rounded-lg bg-emerald-900/80 border border-emerald-500 text-emerald-200 text-xs text-center font-bold animate-fadeIn">
                ✓ LPI Policy Updated: Pedestrians will receive a {selectedLpi}s protected advance walk signal!
              </div>
            )}
          </div>

          {/* Conflict Point Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-800/40 space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Standard Concurrent Timing (No LPI)</span>
              </div>
              <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Vehicles and pedestrians move simultaneously.</li>
                <li>Turning drivers look for vehicular gaps, overlooking pedestrians stepping off the curb.</li>
                <li>High conflict point density in first 3-5 seconds of green phase.</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Shield className="w-4 h-4" />
                <span>Vision Zero LPI Active ({selectedLpi}s Head Start)</span>
              </div>
              <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Pedestrians occupy crosswalk before vehicles enter.</li>
                <li>Vehicles must yield to pedestrians already established in the crosswalk.</li>
                <li>Reduces right-turn and left-turn pedestrian conflicts by up to 60%.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
