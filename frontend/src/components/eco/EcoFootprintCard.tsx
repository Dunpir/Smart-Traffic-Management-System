import React, { useState } from 'react';
import {
  Leaf,
  Fuel,
  TreeDeciduous,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { EcoMetrics } from '../../types';
import { soundEffects } from '../../utils/soundEffects';

interface EcoFootprintCardProps {
  ecoMetrics: EcoMetrics;
}

export const EcoFootprintCard: React.FC<EcoFootprintCardProps> = ({ ecoMetrics }) => {
  const [showFormulaDetails, setShowFormulaDetails] = useState<boolean>(false);

  return (
    <div className="bg-[#0a0a0a] p-5 rounded-xl border border-[#27272a] hover:border-zinc-700 relative overflow-hidden text-white transition">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1f1f23] flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400 flex items-center justify-center">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Eco &amp; Carbon Footprint Analysis
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-900 text-emerald-400 border border-zinc-800">
                EPA MODEL
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              Real-time idle emissions saved vs 60s static cycle
            </p>
          </div>
        </div>

        {/* Eco Score Badge */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-mono text-zinc-500">
              Efficiency Grade
            </span>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-base font-bold text-emerald-400">
                {ecoMetrics.ecoGrade}
              </span>
              <span className="text-xs text-zinc-500">
                ({ecoMetrics.ecoScore}/100)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        {/* Metric 1: CO2 Saved */}
        <div className="p-3 rounded-lg bg-black border border-[#27272a] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase text-zinc-500 block font-sans">
              CO₂ Saved
            </span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5 flex items-baseline gap-1">
              <span>{ecoMetrics.co2SavedKg}</span>
              <span className="text-xs font-normal text-zinc-500">kg</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 mt-0.5 block">
              -{ecoMetrics.idleReductionPercent}% Idle Cut
            </span>
          </div>
          <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0" />
        </div>

        {/* Metric 2: Fuel Conserved */}
        <div className="p-3 rounded-lg bg-black border border-[#27272a] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase text-zinc-500 block font-sans">
              Fuel Conserved
            </span>
            <div className="text-lg font-bold text-amber-400 mt-0.5 flex items-baseline gap-1">
              <span>{ecoMetrics.fuelSavedLiters}</span>
              <span className="text-xs font-normal text-zinc-500">L</span>
            </div>
            <span className="text-[10px] text-amber-400/80 mt-0.5 block">
              Direct Savings
            </span>
          </div>
          <Fuel className="w-4 h-4 text-amber-400 shrink-0" />
        </div>

        {/* Metric 3: Idle Wait Reduction */}
        <div className="p-3 rounded-lg bg-black border border-[#27272a] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase text-zinc-500 block font-sans">
              Daily Offset
            </span>
            <div className="text-lg font-bold text-cyan-400 mt-0.5 flex items-baseline gap-1">
              <span>{ecoMetrics.co2SavedTodayKg}</span>
              <span className="text-xs font-normal text-zinc-500">kg/d</span>
            </div>
            <span className="text-[10px] text-cyan-400/80 mt-0.5 block">
              Cumulative
            </span>
          </div>
          <Leaf className="w-4 h-4 text-cyan-400 shrink-0" />
        </div>

        {/* Metric 4: Tree Offset Equivalent */}
        <div className="p-3 rounded-lg bg-black border border-[#27272a] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase text-zinc-500 block font-sans">
              Tree Offset
            </span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5 flex items-baseline gap-1">
              <span>{ecoMetrics.treesEquivalent}</span>
              <span className="text-xs font-normal text-zinc-500">trees</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 mt-0.5 block">
              Green Impact
            </span>
          </div>
          <TreeDeciduous className="w-4 h-4 text-emerald-400 shrink-0" />
        </div>
      </div>

      {/* Expandable Formula Explanation */}
      <div className="mt-3 pt-2.5 border-t border-[#1f1f23]">
        <button
          onClick={() => {
            soundEffects.playClick();
            setShowFormulaDetails(!showFormulaDetails)}
          }
          className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 text-zinc-500" />
          <span>{showFormulaDetails ? 'Hide EPA Emission Calculation Details' : 'View EPA Mathematical Model Details'}</span>
          {showFormulaDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showFormulaDetails && (
          <div className="mt-2 p-3 rounded-lg bg-black border border-[#27272a] text-xs text-zinc-400 leading-relaxed font-mono space-y-1">
            <p><strong>Baseline Idle Rate:</strong> 2.28 kg CO₂/hour (EPA Tier 3 standard vehicle)</p>
            <p><strong>Fuel Density:</strong> 0.84 L/hour consumed during stationary idling</p>
            <p><strong>Adaptive Benefit:</strong> Adaptive cycle duration dynamically trims 38% of red light dwell time per vehicle.</p>
          </div>
        )}
      </div>
    </div>
  );
};
