import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Calculator,
  Layers,
  Award,
  Sparkles,
  CheckCircle2,
  Sliders,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';

interface SimulationTheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulationTheoryModal: React.FC<SimulationTheoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Interactive Webster Calculator inputs
  const [flowNorth, setFlowNorth] = useState<number>(450);
  const [flowEast, setFlowEast] = useState<number>(380);
  const [flowSouth, setFlowSouth] = useState<number>(220);
  const [flowWest, setFlowWest] = useState<number>(160);
  const [saturationFlow, setSaturationFlow] = useState<number>(1800); // veh/hr/lane
  const [lostTimeSec, setLostTimeSec] = useState<number>(12); // seconds (3s yellow + 1s all-red per phase)

  if (!isOpen) return null;

  // Webster calculations
  const yNorth = flowNorth / saturationFlow;
  const yEast = flowEast / saturationFlow;
  const ySouth = flowSouth / saturationFlow;
  const yWest = flowWest / saturationFlow;
  const Y = Math.min(0.92, Math.max(0.2, yNorth + yEast + ySouth + yWest));

  // Webster's Optimum Cycle Length formula: C0 = (1.5*L + 5) / (1 - Y)
  const optimumCycleC0 = Math.round((1.5 * lostTimeSec + 5) / (1 - Y));
  const effectiveGreenSec = Math.max(0, optimumCycleC0 - lostTimeSec);

  const greenNorth = Math.round((yNorth / Y) * effectiveGreenSec);
  const greenEast = Math.round((yEast / Y) * effectiveGreenSec);
  const greenSouth = Math.round((ySouth / Y) * effectiveGreenSec);
  const greenWest = Math.round((yWest / Y) * effectiveGreenSec);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden font-sans">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-mono text-white uppercase tracking-wider">
                  Academic Engineering Foundations &amp; Queue Theory
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                  HCM 2020 &bull; WEBSTER &bull; GREENSHIELDS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mathematical modeling of discrete traffic events, saturation flow rates, and dynamic green allocation.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Section 1: Webster's Optimum Cycle Length Interactive Calculator */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                  1. Webster's Delay &amp; Optimum Cycle Length Formulation
                </h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                Formula: C₀ = (1.5L + 5) / (1 - Y)
              </span>
            </div>

            <p className="text-slate-300 font-sans leading-relaxed">
              F.V. Webster demonstrated that minimizing total vehicle delay at an isolated signalized intersection requires an optimum cycle time $C_0$ based on the sum of critical volume-to-saturation flow ratios $Y = \sum y_i$:
            </p>

            {/* Interactive Calculator Inputs */}
            <div className="p-3 rounded-lg bg-black/60 border border-slate-800 space-y-3 font-mono">
              <div className="text-[11px] font-bold text-slate-300 uppercase">
                Interactive Webster Parameters (Adjust to inspect theoretical optimums):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <label className="text-slate-400 block mb-1">North Flow ($q_N$): {flowNorth} vph</label>
                  <input
                    type="range"
                    min="100"
                    max="900"
                    step="20"
                    value={flowNorth}
                    onChange={(e) => setFlowNorth(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">East Flow ($q_E$): {flowEast} vph</label>
                  <input
                    type="range"
                    min="100"
                    max="900"
                    step="20"
                    value={flowEast}
                    onChange={(e) => setFlowEast(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">South Flow ($q_S$): {flowSouth} vph</label>
                  <input
                    type="range"
                    min="50"
                    max="700"
                    step="20"
                    value={flowSouth}
                    onChange={(e) => setFlowSouth(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">West Flow ($q_W$): {flowWest} vph</label>
                  <input
                    type="range"
                    min="50"
                    max="700"
                    step="20"
                    value={flowWest}
                    onChange={(e) => setFlowWest(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>

              {/* Calculated Outputs */}
              <div className="p-3 rounded bg-cyan-950/40 border border-cyan-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Critical Ratio (Y)</div>
                  <div className="text-lg font-black text-cyan-300 font-mono">{Y.toFixed(3)}</div>
                  <div className="text-[9px] text-slate-400">&Sigma;(q / s)</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Webster Optimum C₀</div>
                  <div className="text-lg font-black text-emerald-400 font-mono">{optimumCycleC0}s</div>
                  <div className="text-[9px] text-slate-400">Total Cycle Length</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">North Split ($g_N$)</div>
                  <div className="text-lg font-black text-cyan-300 font-mono">{greenNorth}s</div>
                  <div className="text-[9px] text-slate-400">STMS Alloc: {greenNorth > 30 ? '60s' : greenNorth > 10 ? '30s' : '20s'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">East Split ($g_E$)</div>
                  <div className="text-lg font-black text-cyan-300 font-mono">{greenEast}s</div>
                  <div className="text-[9px] text-slate-400">STMS Alloc: {greenEast > 30 ? '60s' : greenEast > 10 ? '30s' : '20s'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Greenshields Traffic Flow Model */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                2. Greenshields Macroscopic Traffic Stream Model
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
              <div className="p-3 rounded bg-black/50 border border-slate-800">
                <div className="text-emerald-400 font-bold mb-1">Fundamental Relationship</div>
                <div className="text-base font-bold text-white mb-1">q = k &times; v</div>
                <p className="text-slate-400 text-[10px] font-sans">
                  Traffic Flow ($q$ veh/hr) is the product of vehicular density ($k$ veh/km) and mean space velocity ($v$ km/h).
                </p>
              </div>

              <div className="p-3 rounded bg-black/50 border border-slate-800">
                <div className="text-emerald-400 font-bold mb-1">Linear Speed-Density</div>
                <div className="text-base font-bold text-white mb-1">v = v_f &times; (1 - k/k_j)</div>
                <p className="text-slate-400 text-[10px] font-sans">
                  Velocity decreases linearly from free-flow speed ($v_f = 60$ km/h) to zero at jam density ($k_j = 140$ veh/km).
                </p>
              </div>

              <div className="p-3 rounded bg-black/50 border border-slate-800">
                <div className="text-emerald-400 font-bold mb-1">Maximum Road Capacity</div>
                <div className="text-base font-bold text-white mb-1">q_max = (v_f &times; k_j) / 4</div>
                <p className="text-slate-400 text-[10px] font-sans">
                  Peak discharge capacity of each lane is $2,100$ veh/hr at critical density $k_c = k_j / 2$.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Highway Capacity Manual (HCM 2020) Level of Service (LOS) Standards */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                  3. Highway Capacity Manual (HCM 2020) Level of Service (LOS)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Standard Signalized Intersection LOS Criteria</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-3">LOS</th>
                    <th className="py-2 px-3">Control Delay / Vehicle</th>
                    <th className="py-2 px-3">Operational Status</th>
                    <th className="py-2 px-3">STMS vs Baseline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr className="text-emerald-400 bg-emerald-950/20">
                    <td className="py-2 px-3 font-bold">LOS A</td>
                    <td className="py-2 px-3">&le; 10.0 sec</td>
                    <td className="py-2 px-3 font-sans">Extremely favorable progression, minimal stopped delay.</td>
                    <td className="py-2 px-3 font-bold">STMS Off-Peak</td>
                  </tr>
                  <tr className="text-emerald-300 bg-emerald-950/10">
                    <td className="py-2 px-3 font-bold">LOS B</td>
                    <td className="py-2 px-3">10.1 &ndash; 20.0 sec</td>
                    <td className="py-2 px-3 font-sans">Good progression, occasional platoon stops.</td>
                    <td className="py-2 px-3 font-bold">STMS Peak Nominal</td>
                  </tr>
                  <tr className="text-cyan-300">
                    <td className="py-2 px-3 font-bold">LOS C</td>
                    <td className="py-2 px-3">20.1 &ndash; 35.0 sec</td>
                    <td className="py-2 px-3 font-sans">Fair progression, individual cycle failures begin.</td>
                    <td className="py-2 px-3">Acceptable Flow</td>
                  </tr>
                  <tr className="text-amber-400">
                    <td className="py-2 px-3 font-bold">LOS D</td>
                    <td className="py-2 px-3">35.1 &ndash; 55.0 sec</td>
                    <td className="py-2 px-3 font-sans">Congestion noticeable, high volume-to-capacity ratio.</td>
                    <td className="py-2 px-3">Fixed Off-Peak</td>
                  </tr>
                  <tr className="text-orange-400 bg-rose-950/10">
                    <td className="py-2 px-3 font-bold">LOS E</td>
                    <td className="py-2 px-3">55.1 &ndash; 80.0 sec</td>
                    <td className="py-2 px-3 font-sans">Poor progression, severe queue delays, geometric limits.</td>
                    <td className="py-2 px-3 text-rose-400 font-bold">Conventional Fixed Baseline</td>
                  </tr>
                  <tr className="text-rose-500 bg-rose-950/20">
                    <td className="py-2 px-3 font-bold">LOS F</td>
                    <td className="py-2 px-3">&gt; 80.0 sec</td>
                    <td className="py-2 px-3 font-sans">Breakdown, intersection gridlock, queue spillback.</td>
                    <td className="py-2 px-3 text-rose-500 font-bold">Fixed Peak Gridlock</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">
            Formulation Reference &bull; STMS Adaptive Signal Scheduling Algorithm
          </span>
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
          >
            Close Reference
          </button>
        </div>
      </div>
    </div>
  );
};
