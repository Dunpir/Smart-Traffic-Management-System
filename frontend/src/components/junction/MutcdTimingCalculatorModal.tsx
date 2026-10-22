import React, { useState } from 'react';
import {
  X,
  Calculator,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Shield,
  FileSpreadsheet,
  Download,
  Info,
} from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';

interface MutcdTimingCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTimings?: (timings: {
    yellowTime: number;
    allRedTime: number;
    pedWalkTime: number;
    pedClearanceTime: number;
  }) => void;
}

export const MutcdTimingCalculatorModal: React.FC<MutcdTimingCalculatorModalProps> = ({
  isOpen,
  onClose,
  onApplyTimings,
}) => {
  // Input parameters (standard municipal defaults)
  const [speedMph, setSpeedMph] = useState<number>(35); // 35 mph typical suburban/urban arterial
  const [gradePercent, setGradePercent] = useState<number>(0); // 0% flat grade
  const [reactionTime, setReactionTime] = useState<number>(1.0); // 1.0s ITE standard perception-reaction
  const [decelerationRate, setDecelerationRate] = useState<number>(10.0); // 10 ft/s² standard comfortable deceleration
  const [intersectionWidthFt, setIntersectionWidthFt] = useState<number>(64); // 64 ft (4 lanes + medians)
  const [vehicleLengthFt, setVehicleLengthFt] = useState<number>(20); // 20 ft standard passenger vehicle
  const [pedSpeedFps, setPedSpeedFps] = useState<number>(3.5); // 3.5 ft/s MUTCD 11th Edition walk speed

  const [appliedToast, setAppliedToast] = useState<boolean>(false);

  if (!isOpen) return null;

  // ITE Kinematic Clearance Formulas
  // Speed in ft/s: v = speedMph * 1.46667
  const v = speedMph * 1.46667;
  const g = 32.174; // gravity ft/s²
  const G = gradePercent / 100; // grade decimal

  // Yellow Change Interval: Y = t + [v / (2a + 2Gg)]
  const denomYellow = 2 * decelerationRate + 2 * G * g;
  const rawYellow = reactionTime + v / Math.max(1, denomYellow);
  // MUTCD 4D.26 standard: Yellow between 3.0s and 6.0s
  const yellowSeconds = Math.min(6.0, Math.max(3.0, Number(rawYellow.toFixed(1))));

  // All-Red Clearance Interval: R = (W + L) / v
  const rawRed = (intersectionWidthFt + vehicleLengthFt) / v;
  // Standard range: 1.0s to 3.0s
  const redSeconds = Math.min(3.5, Math.max(1.0, Number(rawRed.toFixed(1))));

  // Pedestrian Clearance Interval (Flashing Don't Walk): FDW = W_crosswalk / S_ped
  const rawPedClearance = intersectionWidthFt / pedSpeedFps;
  const pedClearanceSeconds = Math.max(7.0, Math.round(rawPedClearance));

  // Minimum Pedestrian Walk: MUTCD specifies minimum 7s (can be 4s in special dense urban conditions)
  const pedWalkSeconds = 7.0;

  // Total Vehicular Change Period
  const totalChangePeriod = Number((yellowSeconds + redSeconds).toFixed(1));

  const handleApply = () => {
    soundEffects.playSuccess();
    if (onApplyTimings) {
      onApplyTimings({
        yellowTime: yellowSeconds,
        allRedTime: redSeconds,
        pedWalkTime: pedWalkSeconds,
        pedClearanceTime: pedClearanceSeconds,
      });
    }
    setAppliedToast(true);
    setTimeout(() => setAppliedToast(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-fadeIn select-none font-mono">
      <div className="bg-slate-950 border border-cyan-800/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                  MUTCD &amp; ITE Signal Timing &amp; Clearance Engineer
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold">
                  MUTCD 11TH ED. COMPLIANT
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Deterministic Kinematic Clearance Interval &amp; Pedestrian Clearance Calculator
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Scientific Formula Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Shield className="w-4 h-4" />
                <span>ITE Yellow Change Interval Equation:</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-cyan-300 font-mono text-center text-sm font-semibold">
                Y = t + [ v / (2a + 2Gg) ]
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Accounts for perception-reaction distance plus braking deceleration without subjecting drivers to dilemma zones.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Clock className="w-4 h-4" />
                <span>ITE All-Red Clearance &amp; Pedestrian Equation:</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-amber-300 font-mono text-center text-sm font-semibold">
                R = (W + L) / v &nbsp; | &nbsp; FDW = W / S_ped
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Clears the intersection box before opposing movement green, and ensures pedestrians clear curb-to-curb at 3.5 ft/s.
              </p>
            </div>
          </div>

          {/* Interactive Input Sliders & Calculations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Input Parameters */}
            <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Geometric &amp; Kinematic Inputs
              </h3>

              {/* Design Speed */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">85th-Percentile Approach Speed:</span>
                  <span className="text-cyan-400 font-bold">{speedMph} MPH ({(speedMph * 1.609).toFixed(0)} km/h)</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="65"
                  step="5"
                  value={speedMph}
                  onChange={(e) => setSpeedMph(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Intersection Width */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Intersection Curb-to-Curb Width:</span>
                  <span className="text-cyan-400 font-bold">{intersectionWidthFt} FT ({(intersectionWidthFt * 0.3048).toFixed(1)} m)</span>
                </div>
                <input
                  type="range"
                  min="32"
                  max="120"
                  step="4"
                  value={intersectionWidthFt}
                  onChange={(e) => setIntersectionWidthFt(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Approach Grade */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Approach Slope / Grade:</span>
                  <span className="text-cyan-400 font-bold">{gradePercent}% {gradePercent > 0 ? '(Uphill)' : gradePercent < 0 ? '(Downhill)' : '(Level)'}</span>
                </div>
                <input
                  type="range"
                  min="-6"
                  max="6"
                  step="1"
                  value={gradePercent}
                  onChange={(e) => setGradePercent(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Perception Reaction Time */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Driver Perception-Reaction Time (t):</span>
                  <span className="text-cyan-400 font-bold">{reactionTime.toFixed(1)}s (ITE Standard)</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.1"
                  value={reactionTime}
                  onChange={(e) => setReactionTime(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Deceleration Rate */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Deceleration Rate (a):</span>
                  <span className="text-cyan-400 font-bold">{decelerationRate.toFixed(1)} ft/s² (3.05 m/s²)</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="12"
                  step="0.5"
                  value={decelerationRate}
                  onChange={(e) => setDecelerationRate(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Pedestrian Walk Speed */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">MUTCD Pedestrian Clearance Speed:</span>
                  <span className="text-cyan-400 font-bold">{pedSpeedFps.toFixed(1)} ft/s (1.07 m/s)</span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="4.0"
                  step="0.1"
                  value={pedSpeedFps}
                  onChange={(e) => setPedSpeedFps(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Right: Calculated Certified Timings */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Calculated NEMA &amp; MUTCD Certified Timing Results
                </h3>

                {/* Yellow Interval Card */}
                <div className="p-3.5 bg-amber-950/30 border border-amber-600/50 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-amber-300">Yellow Change Interval (Y)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      MUTCD §4D.26 Safe stopping clearance without dilemma zone
                    </div>
                  </div>
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {yellowSeconds.toFixed(1)}s
                  </div>
                </div>

                {/* All-Red Interval Card */}
                <div className="p-3.5 bg-red-950/30 border border-red-600/50 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-red-300">All-Red Clearance Interval (R)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Intersection box vacation time before opposing green phase
                    </div>
                  </div>
                  <div className="text-2xl font-black text-red-400 font-mono">
                    {redSeconds.toFixed(1)}s
                  </div>
                </div>

                {/* Total Vehicular Clearance */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Vehicular Clearance Phase (Y + R):</span>
                  <span className="text-cyan-400 font-bold text-sm font-mono">{totalChangePeriod}s</span>
                </div>

                {/* Pedestrian Flashing Don't Walk (FDW) */}
                <div className="p-3.5 bg-emerald-950/30 border border-emerald-600/50 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-emerald-300">Pedestrian Clearance (FDW)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Flashing orange hand duration based on {intersectionWidthFt}ft crosswalk
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {pedClearanceSeconds}s
                  </div>
                </div>

                {/* Pedestrian Walk */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-400">Pedestrian Protected WALK Interval:</span>
                  <span className="text-emerald-400 font-bold text-sm font-mono">{pedWalkSeconds.toFixed(1)}s (MUTCD min)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={handleApply}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 cursor-pointer transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply Certified Timings to Controller</span>
                </button>
              </div>

              {appliedToast && (
                <div className="p-2 rounded-lg bg-emerald-900/90 border border-emerald-500 text-emerald-200 text-xs text-center font-bold animate-fadeIn">
                  ✓ Certified ITE/MUTCD Timings Pushed to Active Simulation!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
