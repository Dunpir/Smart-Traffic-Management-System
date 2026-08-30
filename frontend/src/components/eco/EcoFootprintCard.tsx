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
    <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#1f1f23] hover:border-[#333338] text-white transition">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[#1f1f23] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Leaf className="w-3.5 h-3.5 text-zinc-400" />
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Eco &amp; Carbon Footprint
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono">
              EPA Tier 3 standard idle emissions reduction vs 60s fixed cycle
            </p>
          </div>
        </div>

        {/* Eco Score Badge */}
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-[10px] text-zinc-500">GRADE</span>
          <span className="text-sm font-bold text-white">
            {ecoMetrics.ecoGrade}
          </span>
          <span className="text-xs text-zinc-500">
            ({ecoMetrics.ecoScore}/100)
          </span>
        </div>
      </div>

      {/* 4 Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
        <div className="p-2.5 rounded bg-black border border-[#1f1f23]">
          <span className="text-[10px] text-zinc-500 block font-sans">
            CO₂ Saved
          </span>
          <div className="text-lg font-bold text-white mt-0.5">
            {ecoMetrics.co2SavedKg} <span className="text-xs font-normal text-zinc-500">kg</span>
          </div>
          <span className="text-[10px] text-emerald-400 mt-0.5 block">
            -{ecoMetrics.idleReductionPercent}% Idle Cut
          </span>
        </div>

        <div className="p-2.5 rounded bg-black border border-[#1f1f23]">
          <span className="text-[10px] text-zinc-500 block font-sans">
            Fuel Conserved
          </span>
          <div className="text-lg font-bold text-white mt-0.5">
            {ecoMetrics.fuelSavedLiters} <span className="text-xs font-normal text-zinc-500">L</span>
          </div>
          <span className="text-[10px] text-zinc-400 mt-0.5 block">
            Direct Fuel Cut
          </span>
        </div>

        <div className="p-2.5 rounded bg-black border border-[#1f1f23]">
          <span className="text-[10px] text-zinc-500 block font-sans">
            Daily Offset
          </span>
          <div className="text-lg font-bold text-white mt-0.5">
            {ecoMetrics.co2SavedTodayKg} <span className="text-xs font-normal text-zinc-500">kg/d</span>
          </div>
          <span className="text-[10px] text-zinc-400 mt-0.5 block">
            Cumulative
          </span>
        </div>

        <div className="p-2.5 rounded bg-black border border-[#1f1f23]">
          <span className="text-[10px] text-zinc-500 block font-sans">
            Tree Equivalent
          </span>
          <div className="text-lg font-bold text-white mt-0.5">
            {ecoMetrics.treesEquivalent} <span className="text-xs font-normal text-zinc-500">trees</span>
          </div>
          <span className="text-[10px] text-emerald-400 mt-0.5 block">
            Annual Offset
          </span>
        </div>
      </div>

      {/* Expandable Explanation */}
      <div className="mt-3 pt-2 border-t border-[#1f1f23]">
        <button
          onClick={() => {
            soundEffects.playClick();
            setShowFormulaDetails(!showFormulaDetails);
          }}
          className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
        >
          <Info className="w-3 h-3" />
          <span>{showFormulaDetails ? 'Hide Model Details' : 'View EPA Model Details'}</span>
          {showFormulaDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showFormulaDetails && (
          <div className="mt-2 p-2.5 rounded bg-black border border-[#1f1f23] text-xs text-zinc-400 font-mono space-y-1">
            <p><strong>Baseline Idle Rate:</strong> 2.28 kg CO₂/hour (EPA Tier 3 standard vehicle)</p>
            <p><strong>Fuel Density:</strong> 0.84 L/hour consumed during stationary idling</p>
            <p><strong>Adaptive Benefit:</strong> Dynamic queue balancing cuts red light dwell time by 38%.</p>
          </div>
        )}
      </div>
    </div>
  );
};
