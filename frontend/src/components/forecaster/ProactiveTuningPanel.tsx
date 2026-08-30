import React, { useState } from 'react';
import { AlertCircle, Sliders, CheckCircle, Zap, ArrowRight, Clock, ShieldAlert } from 'lucide-react';
import { ProactiveTuningPlan } from '../../types';

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
    <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 space-y-4 relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Proactive AI Signal Timing Dispatch (Congestion Prevention)
            </h3>
            <div className="text-[11px] font-mono text-cyan-400">
              Surge Wave Anticipation: {plan.surgeTimeHorizon}
            </div>
          </div>
        </div>

        {applied ? (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-600 text-xs font-mono font-bold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>TIMING APPLIED</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-600 text-xs font-mono font-bold animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>ACTION RECOMMENDED</span>
          </span>
        )}
      </div>

      {/* Surge Wave Analysis Card */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Target Approach Road</span>
            <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-extrabold">
                {plan.detectedSurgeDirection} ROAD
              </span>
              <span>(North Boulevard)</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Forecasted Influx Surge</span>
            <div className="text-base font-extrabold text-rose-400 font-mono">
              +{plan.surgeVehicleIncreasePercent}% Volume
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-300 font-mono leading-relaxed bg-black/40 p-2.5 rounded-lg border border-slate-800/80">
          {plan.reason}
        </div>

        {/* Phase Split Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Current Timing */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Current Green Split</div>
              <div className="text-xl font-extrabold text-slate-300 font-mono mt-0.5">
                {plan.currentPhaseDuration}s
              </div>
            </div>
            <Clock className="w-5 h-5 text-slate-500" />
          </div>

          {/* Recommended Proactive Timing */}
          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/50 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                AI Proactive Allocation
              </div>
              <div className="text-xl font-extrabold text-cyan-300 font-mono mt-0.5 flex items-center gap-1.5">
                <span>{plan.recommendedPhaseDuration}s</span>
                <span className="text-xs text-emerald-400 font-semibold">(+20s Boost)</span>
              </div>
            </div>
            <Zap className="w-5 h-5 text-cyan-400 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Action Dispatch Deck */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <p className="text-[11px] text-slate-400 font-mono">
          Pre-allocating green splits prevents downstream bottleneck accumulation before the rush peak hits.
        </p>

        <button
          onClick={handleApply}
          disabled={isApplying || applied}
          className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all shadow-lg flex items-center gap-2 shrink-0 ${applied
              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600/60 cursor-default'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-950/50 hover:scale-105 active:scale-95'
            }`}
        >
          {applied ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Proactive Green Applied</span>
            </>
          ) : (
            <>
              <Sliders className="w-4 h-4" />
              <span>{isApplying ? 'Applying...' : 'Apply Proactive Green Timing'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
