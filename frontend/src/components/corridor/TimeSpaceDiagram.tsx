import React, { useState, useMemo } from 'react';
import {
  Sliders,
  TrendingUp,
  Activity,
  CheckCircle2,
  RefreshCw,
  Zap,
  Info,
  Car,
} from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';

interface TimeSpaceDiagramProps {
  corridorName?: string;
}

export const TimeSpaceDiagram: React.FC<TimeSpaceDiagramProps> = ({
  corridorName = 'Grand Avenue Arterial Corridor',
}) => {
  // Cycle length in seconds
  const cycleLength = 90; // 90 second arterial cycle
  const designSpeedKmh = 45; // 45 km/h design progression speed
  const speedMps = (designSpeedKmh * 1000) / 3600; // 12.5 m/s

  // Junction positions along corridor (meters)
  const junctions = useMemo(
    () => [
      { id: 'JUNC-001', name: 'Grand & 1st St', dist: 0, greenSplit: 0.55 },
      { id: 'JUNC-002', name: 'Grand & Central Blvd', dist: 320, greenSplit: 0.50 },
      { id: 'JUNC-003', name: 'Grand & Harbor Way', dist: 750, greenSplit: 0.52 },
    ],
    []
  );

  // Offsets (seconds delay relative to JUNC-001)
  // Ideal offset for JUNC-002: dist / speed = 320 / 12.5 = 25.6s
  // Ideal offset for JUNC-003: dist / speed = 750 / 12.5 = 60s
  const [offset2, setOffset2] = useState<number>(26);
  const [offset3, setOffset3] = useState<number>(60);

  // Optimal offset calculations
  const idealOffset2 = Math.round(320 / speedMps);
  const idealOffset3 = Math.round(750 / speedMps);

  // Bandwidth calculation (how many continuous seconds vehicles can progress without stopping)
  // Deviation from ideal offset reduces the green wave bandwidth
  const dev2 = Math.abs(offset2 - idealOffset2);
  const dev3 = Math.abs(offset3 - idealOffset3);
  const maxGreenTime = cycleLength * 0.5; // 45s maximum green
  const effectiveBandwidth = Math.max(0, Math.round(maxGreenTime - dev2 * 0.8 - dev3 * 0.7));
  const bandwidthEfficiency = Math.round((effectiveBandwidth / cycleLength) * 100);

  const handleAutoOptimize = () => {
    soundEffects.playSuccess();
    setOffset2(idealOffset2);
    setOffset3(idealOffset3);
  };

  // Canvas drawing for Time-Space Diagram
  const svgWidth = 720;
  const svgHeight = 280;
  const paddingLeft = 140;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const totalTime = 180; // 2 cycles

  const getX = (timeSec: number) => paddingLeft + (timeSec / totalTime) * chartWidth;
  const getY = (distMeters: number) => paddingTop + (distMeters / 750) * chartHeight;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white font-mono shadow-xl space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-600 flex items-center justify-center text-white shadow-md">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Arterial Progression Time-Space Diagram (TSD)
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                GREEN WAVE COORDINATION
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Corridor Platoon Bandwidth &amp; Multi-Junction Offset Optimization ({designSpeedKmh} km/h Design Speed)
            </p>
          </div>
        </div>

        {/* Efficiency Badge & Auto-Tune */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs">
            <span className="text-slate-400">Progression Bandwidth:</span>
            <span
              className={`font-black ${
                bandwidthEfficiency >= 40
                  ? 'text-emerald-400'
                  : bandwidthEfficiency >= 25
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {effectiveBandwidth}s ({bandwidthEfficiency}%)
            </span>
          </div>

          <button
            onClick={handleAutoOptimize}
            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-cyan-600/30"
            title="Automatically compute mathematical offsets for zero-stop green wave progression"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Auto-Optimize</span>
          </button>
        </div>
      </div>

      {/* SVG Time-Space Chart */}
      <div className="w-full overflow-x-auto no-scrollbar bg-slate-900/60 rounded-xl border border-slate-800/80 p-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[620px]"
        >
          {/* Horizontal Grid lines for each junction */}
          {junctions.map((j) => {
            const y = getY(j.dist);
            return (
              <g key={j.id}>
                {/* Junction label on left */}
                <text
                  x={paddingLeft - 12}
                  y={y + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {j.id} ({j.dist}m)
                </text>
                <text
                  x={paddingLeft - 12}
                  y={y + 15}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="8"
                >
                  {j.name}
                </text>
                {/* Horizontal reference line */}
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="3 3"
                />
              </g>
            );
          })}

          {/* Time axis labels at bottom */}
          {[0, 30, 60, 90, 120, 150, 180].map((t) => {
            const x = getX(t);
            return (
              <g key={t}>
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={svgHeight - paddingBottom}
                  stroke="#1e293b"
                />
                <text
                  x={x}
                  y={svgHeight - paddingBottom + 16}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="9"
                >
                  {t}s
                </text>
              </g>
            );
          })}
          <text
            x={paddingLeft + chartWidth / 2}
            y={svgHeight - 8}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="10"
            fontWeight="bold"
          >
            Time Progression (Seconds) → [Cycle = 90s]
          </text>

          {/* Signal phases for each junction (Red vs Green bands) */}
          {junctions.map((j) => {
            const y = getY(j.dist);
            const offset = j.id === 'JUNC-001' ? 0 : j.id === 'JUNC-002' ? offset2 : offset3;
            const greenDuration = cycleLength * j.greenSplit;

            // Draw 2 cycles of signal phases
            return [0, 1].map((cycleIdx) => {
              const startT = cycleIdx * cycleLength + offset;
              const xStart = getX(startT);
              const xEnd = getX(startT + greenDuration);
              const barWidth = Math.max(2, xEnd - xStart);

              return (
                <rect
                  key={`${j.id}-cycle-${cycleIdx}`}
                  x={xStart}
                  y={y - 6}
                  width={barWidth}
                  height="12"
                  rx="3"
                  fill="#10b981"
                  opacity="0.8"
                />
              );
            });
          })}

          {/* GREEN WAVE PLATOON BAND (Diagonal Green Progression Corridor) */}
          {effectiveBandwidth > 0 && (
            <polygon
              points={`
                ${getX(0)},${getY(0)}
                ${getX(effectiveBandwidth)},${getY(0)}
                ${getX(effectiveBandwidth + (750 / speedMps))},${getY(750)}
                ${getX(750 / speedMps)},${getY(750)}
              `}
              fill="#10b981"
              fillOpacity="0.22"
              stroke="#34d399"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
          )}

          {/* Vehicle Platoon Path Line */}
          <line
            x1={getX(effectiveBandwidth / 2)}
            y1={getY(0)}
            x2={getX(effectiveBandwidth / 2 + (750 / speedMps))}
            y2={getY(750)}
            stroke="#10b981"
            strokeWidth="2.5"
          />
        </svg>
      </div>

      {/* Interactive Sliders for Offset Tuning */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
        {/* JUNC-002 Offset */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">JUNC-002 (Central Blvd, 320m) Offset:</span>
            <span className="text-cyan-400 font-bold font-mono">
              {offset2}s {offset2 === idealOffset2 ? '(OPTIMAL)' : `(Ideal: ${idealOffset2}s)`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            value={offset2}
            onChange={(e) => setOffset2(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>

        {/* JUNC-003 Offset */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">JUNC-003 (Harbor Way, 750m) Offset:</span>
            <span className="text-cyan-400 font-bold font-mono">
              {offset3}s {offset3 === idealOffset3 ? '(OPTIMAL)' : `(Ideal: ${idealOffset3}s)`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            value={offset3}
            onChange={(e) => setOffset3(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
