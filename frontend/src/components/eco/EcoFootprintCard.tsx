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

interface EcoFootprintCardProps {
  ecoMetrics: EcoMetrics;
}

export const EcoFootprintCard: React.FC<EcoFootprintCardProps> = ({ ecoMetrics }) => {
  const [showFormulaDetails, setShowFormulaDetails] = useState<boolean>(false);

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                Eco &amp; Carbon Footprint Analysis
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                EPA MODEL
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Real-time idle emissions saved vs 60s static cycle
            </p>
          </div>
        </div>

        {/* Eco Score Badge */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
              Efficiency Grade
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-emerald-700 font-sans">
                {ecoMetrics.ecoGrade}
              </span>
              <span className="text-xs text-emerald-700 font-bold font-sans">
                ({ecoMetrics.ecoScore}/100)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-sans">
        {/* Metric 1: CO2 Saved */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              CO₂ Emissions Saved
            </span>
            <div className="text-lg lg:text-xl font-extrabold text-emerald-800 mt-0.5 flex items-baseline gap-1">
              <span>{ecoMetrics.co2SavedKg}</span>
              <span className="text-xs font-normal text-slate-500">kg CO₂</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 mt-0.5 block">
              -{ecoMetrics.idleReductionPercent}% Idle Cut
            </span>
          </div>
          <TrendingDown className="w-5 h-5 text-emerald-600 shrink-0" />
        </div>

        {/* Metric 2: Fuel Conserved */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Fuel Conserved
            </span>
            <div className="text-lg lg:text-xl font-extrabold text-amber-900 mt-0.5 flex items-baseline gap-1">
              <span>{ecoMetrics.fuelSavedLiters}</span>
              <span className="text-xs font-normal text-slate-500">liters</span>
            </div>
            <span className="text-[10px] font-bold text-amber-700 mt-0.5 block">
              Direct Fuel Savings
            </span>
          </div>
          <Fuel className="w-5 h-5 text-amber-600 shrink-0" />
        </div>

        {/* Metric 3: Idle Wait Reduction */}
        <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Today's Carbon Offset
            </span>
            <div className="text-lg lg:text-xl font-extrabold text-teal-900 mt-0.5 flex items-baseline gap-1">
              <span>{ecoMetrics.co2SavedTodayKg}</span>
              <span className="text-xs font-normal text-slate-500">kg/day</span>
            </div>
            <span className="text-[10px] font-bold text-teal-700 mt-0.5 block">
              Cumulative Saved
            </span>
          </div>
          <Leaf className="w-5 h-5 text-teal-600 shrink-0" />
        </div>

        {/* Metric 4: Tree Offset Equivalent */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Tree Offset Eq.
            </span>
            <div className="text-lg lg:text-xl font-extrabold text-emerald-900 mt-0.5 flex items-baseline gap-1">
              <span>{ecoMetrics.treesEquivalent}</span>
              <span className="text-xs font-normal text-slate-500">trees/yr</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 mt-0.5 block">
              Green Impact
            </span>
          </div>
          <TreeDeciduous className="w-5 h-5 text-emerald-600 shrink-0" />
        </div>
      </div>

      {/* Expandable Formula Explanation */}
      <div className="mt-3 pt-2 border-t border-slate-100">
        <button
          onClick={() => setShowFormulaDetails(!showFormulaDetails)}
          className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition"
        >
          <Info className="w-3.5 h-3.5" />
          <span>{showFormulaDetails ? 'Hide EPA Emission Calculation Details' : 'View EPA Mathematical Model Details'}</span>
          {showFormulaDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showFormulaDetails && (
          <div className="mt-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed font-mono">
            <p><strong>Baseline Idle Rate:</strong> 2.28 kg CO₂/hour (EPA Tier 3 standard vehicle)</p>
            <p><strong>Fuel Density:</strong> 0.84 L/hour consumed during stationary idling</p>
            <p><strong>Adaptive Benefit:</strong> Adaptive cycle duration dynamically trims 38% of red light dwell time per vehicle.</p>
          </div>
        )}
      </div>
    </div>
  );
};
