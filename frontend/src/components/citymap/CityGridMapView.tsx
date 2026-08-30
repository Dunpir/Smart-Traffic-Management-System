import React, { useState } from 'react';
import {
  MapPin,
  Layers,
  Zap,
  Radio,
  Camera,
  ShieldAlert,
  Car,
  CheckCircle,
  Navigation,
  Compass,
  Sliders,
  Maximize2,
} from 'lucide-react';
import { CityIntersectionNode, CityCorridorRoute, Direction } from '../../types';

interface CityGridMapViewProps {
  intersections: CityIntersectionNode[];
  routes: CityCorridorRoute[];
  onSelectJunction?: (junctionId: string) => void;
  onInjectEmergency?: (junctionId: string) => void;
}

export const CityGridMapView: React.FC<CityGridMapViewProps> = ({
  intersections,
  routes,
  onSelectJunction,
  onInjectEmergency,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('J001');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showEmergencyOverlay, setShowEmergencyOverlay] = useState(true);
  const [showCctv, setShowCctv] = useState(true);

  const selectedNode = intersections.find((n) => n.id === selectedNodeId) || intersections[0];

  const getCongestionBadge = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'text-emerald-400 border-emerald-700 bg-emerald-950/80';
      case 'MEDIUM':
        return 'text-cyan-400 border-cyan-700 bg-cyan-950/80';
      case 'HIGH':
        return 'text-amber-400 border-amber-700 bg-amber-950/80';
      case 'CRITICAL':
        return 'text-rose-400 border-rose-700 bg-rose-950/80 animate-pulse';
      default:
        return 'text-cyan-400 border-cyan-700 bg-cyan-950/80';
    }
  };

  const getNodeGlow = (node: CityIntersectionNode) => {
    if (node.hasEmergency) return 'shadow-[0_0_20px_#f43f5e] border-rose-500 bg-rose-950 text-rose-300 animate-pulse';
    if (node.currentSignal === 'GREEN') return 'shadow-[0_0_15px_#10b981] border-emerald-500 bg-emerald-950 text-emerald-300';
    return 'shadow-[0_0_10px_#06b6d4] border-slate-700 bg-slate-900 text-slate-300';
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
      {/* Map Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '15s' }} />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Metropolitan Multi-Junction Command Map
            </h3>
            <div className="text-[11px] font-mono text-slate-400">
              Interactive Grid Topology | 7 Interconnected Intersections | Live Telemetry
            </div>
          </div>
        </div>

        {/* Map Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1.5 ${showHeatmap
                ? 'bg-cyan-950/80 text-cyan-400 border-cyan-700'
                : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Heatmap</span>
          </button>

          <button
            onClick={() => setShowEmergencyOverlay(!showEmergencyOverlay)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1.5 ${showEmergencyOverlay
                ? 'bg-rose-950/80 text-rose-400 border-rose-700'
                : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
          >
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>Emergency Routes</span>
          </button>

          <button
            onClick={() => setShowCctv(!showCctv)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1.5 ${showCctv
                ? 'bg-amber-950/80 text-amber-400 border-amber-700'
                : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
          >
            <Camera className="w-3 h-3 text-amber-400" />
            <span>CCTV Mesh</span>
          </button>
        </div>
      </div>

      {/* Main Map Canvas + Right Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Canvas (8 cols) */}
        <div className="lg:col-span-8 relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl bg-gradient-to-br from-[#060a14] via-[#091022] to-[#040812] border border-slate-800 overflow-hidden p-4 shadow-2xl">
          {/* Subtle Grid Lines & Roads */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
            <defs>
              <pattern id="city-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.75" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#city-grid)" />

            {/* Arterial Corridor Link Lines */}
            {intersections.map((node) =>
              node.connectedNodeIds.map((targetId) => {
                const target = intersections.find((n) => n.id === targetId);
                if (!target) return null;
                return (
                  <g key={`${node.id}-${target.id}`}>
                    <line
                      x1={`${node.x}%`}
                      y1={`${node.y}%`}
                      x2={`${target.x}%`}
                      y2={`${target.y}%`}
                      stroke="#0e7490"
                      strokeWidth="3"
                      strokeDasharray="6 4"
                      className="animate-[dash_20s_linear_infinite]"
                    />
                    <line
                      x1={`${node.x}%`}
                      y1={`${node.y}%`}
                      x2={`${target.x}%`}
                      y2={`${target.y}%`}
                      stroke="#22d3ee"
                      strokeWidth="1"
                      opacity="0.6"
                    />
                  </g>
                );
              })
            )}
          </svg>

          {/* Emergency Corridor Active Glow Line */}
          {showEmergencyOverlay && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line
                x1="22%"
                y1="80%"
                x2="48%"
                y2="72%"
                stroke="#f43f5e"
                strokeWidth="4"
                className="animate-pulse shadow-lg shadow-rose-500"
              />
              <line
                x1="48%"
                y1="72%"
                x2="50%"
                y2="42%"
                stroke="#f43f5e"
                strokeWidth="4"
                className="animate-pulse shadow-lg shadow-rose-500"
              />
            </svg>
          )}

          {/* Interactive Junction Pins */}
          {intersections.map((node) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <div
                key={node.id}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  if (onSelectJunction) onSelectJunction(node.id);
                }}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 group z-20 ${isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                  }`}
              >
                {/* Outer Congestion Halo */}
                {showHeatmap && (
                  <div
                    className={`absolute -inset-2.5 rounded-full blur-sm opacity-50 transition-all ${node.congestionLevel === 'CRITICAL'
                        ? 'bg-rose-500 animate-ping'
                        : node.congestionLevel === 'HIGH'
                          ? 'bg-amber-500'
                          : node.congestionLevel === 'MEDIUM'
                            ? 'bg-cyan-500'
                            : 'bg-emerald-500'
                      }`}
                  />
                )}

                {/* Node Pill */}
                <div
                  className={`relative px-2.5 py-1.5 rounded-xl border-2 font-mono flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all ${getNodeGlow(
                    node
                  )} ${isSelected ? 'border-cyan-400 ring-2 ring-cyan-400/40' : ''}`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${node.currentSignal === 'GREEN'
                        ? 'bg-emerald-400 shadow-md shadow-emerald-400'
                        : 'bg-rose-400 shadow-md shadow-rose-400'
                      }`}
                  />
                  <div className="text-[11px] font-extrabold">{node.code}</div>
                  <div className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-slate-300">
                    {node.vehicleCount}v
                  </div>
                </div>

                {/* Tooltip on Hover */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 hidden group-hover:block whitespace-nowrap px-2 py-1 rounded bg-slate-900/90 text-[10px] font-mono text-slate-200 border border-slate-700 shadow-xl z-30">
                  {node.name} ({node.efficiencyRating})
                </div>
              </div>
            );
          })}

          {/* Map Compass & Watermark */}
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-2">
            <span className="text-cyan-400 font-bold">DELHI-NCR METRO GRID</span>
            <span>|</span>
            <span>WGS84 COORDINATES</span>
          </div>
        </div>

        {/* Right Inspector Drawer (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {selectedNode && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              {/* Selected Node Header */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                    INTERSECTION TELEMETRY DRAWER
                  </div>
                  <h4 className="text-sm font-bold text-white font-sans mt-0.5">{selectedNode.name}</h4>
                  <div className="text-xs text-slate-400 font-mono">{selectedNode.locationName}</div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getCongestionBadge(selectedNode.congestionLevel)}`}>
                  {selectedNode.congestionLevel}
                </span>
              </div>

              {/* Real-time Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Active Phase</div>
                  <div className="text-emerald-400 font-bold text-sm mt-0.5">
                    {selectedNode.activeDirection} GREEN
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Live Queue</div>
                  <div className="text-white font-bold text-sm mt-0.5">
                    {selectedNode.vehicleCount} Vehicles
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Efficiency Rating</div>
                  <div className="text-cyan-400 font-bold text-sm mt-0.5">
                    {selectedNode.efficiencyRating}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Sensors</div>
                  <div className="text-slate-200 font-bold text-sm mt-0.5">4 CAM + 4 IR</div>
                </div>
              </div>

              {/* Connected Corridors List */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Synchronized Grid Links:</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.connectedNodeIds.map((cid) => {
                    const cnode = intersections.find((n) => n.id === cid);
                    return (
                      <span
                        key={cid}
                        className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px]"
                      >
                        Link → {cnode?.code || cid}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs font-mono">
                <button
                  onClick={() => onInjectEmergency && onInjectEmergency(selectedNode.id)}
                  className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-600/40 font-bold transition hover:scale-[1.02]"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Dispatch Emergency to this Node</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
