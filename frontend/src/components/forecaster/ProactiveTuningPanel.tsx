import React, { useState } from 'react';
import { AlertCircle, Sliders, CheckCircle, Zap, ArrowRight, Clock, ShieldAlert } from 'lucide-react';
import { ProactiveTuningPlan } from '../../types';
import { soundEffects } from '../../utils/soundEffects';

interface ProactiveTuningPanelProps {
  plan: ProactiveTuningPlan | null;
  onApplyPlan: () => Promise<void>;
}

export const ProactiveTuningPanel: React.FC<ProactiveTuningPanelProps> = ({
  plan,
  onApplyPlan,
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(plan?.isApplied || false);

  const handleApply = async () => {
    soundEffects.playClick();
    setIsApplying(true);
    try {
      await onApplyPlan();
      setApplied(true);
    } finally {
      setIsApplying(false);
    }
  };

  if (!plan) return null;

  return (
    <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] space-y-3.5 text-slate-900 dark:text-white transition shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-[#1f1f23]">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Proactive Signal Timing Dispatch
            </h3>
            <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500">
              Surge Wave Anticipation: {plan.surgeTimeHorizon}
            </div>
          </div>
        </div>

        {applied ? (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-mono font-bold">
            <CheckCircle className="w-3 h-3" />
            <span>APPLIED</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 text-[10px] font-mono font-bold">
            <AlertCircle className="w-3 h-3" />
            <span>RECOMMENDED</span>
          </span>
        )}
      </div>

      {/* Rationale and Strategy */}
      <div className="p-3 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] text-xs font-mono">
        <div className="text-[10px] uppercase text-slate-500 dark:text-zinc-500 mb-1">Forecast Rationale</div>
        <p className="text-slate-700 dark:text-zinc-300 leading-relaxed font-sans">{plan.reason}</p>
      </div>

      {/* Recommended Green Split Modifications */}
      <div className="space-y-1.5 font-mono text-xs">
        <div className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase">Recommended Adjustments</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23]">
            <div className="text-[9px] text-slate-500 dark:text-zinc-500 uppercase">Surge Direction</div>
            <div className="font-bold text-slate-900 dark:text-white">{plan.detectedSurgeDirection} (+{plan.surgeVehicleIncreasePercent}%)</div>
          </div>

          <div className="p-2 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23]">
            <div className="text-[9px] text-slate-500 dark:text-zinc-500 uppercase">Recommended Green</div>
            <div className="font-bold text-emerald-600 dark:text-emerald-400">
              {plan.recommendedPhaseDuration}s (from {plan.currentPhaseDuration}s)
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2 border-t border-slate-200 dark:border-[#1f1f23]">
        <button
          onClick={handleApply}
          disabled={isApplying || applied}
          className={`w-full py-2 px-3 rounded text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
            applied
              ? 'bg-slate-100 text-slate-500 dark:bg-zinc-900 dark:text-zinc-500 cursor-default'
              : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{applied ? 'Proactive Timing Plan In Effect' : 'Deploy Proactive Timing Plan'}</span>
        </button>
      </div>
    </div>
  );
};
