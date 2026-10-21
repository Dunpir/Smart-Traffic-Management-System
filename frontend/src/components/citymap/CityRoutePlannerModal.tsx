import React, { useState, useMemo } from 'react';
import {
  Navigation,
  X,
  Zap,
  ArrowRight,
  Clock,
  Flame,
  TrendingDown,
  CheckCircle2,
  Gauge,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CityIntersectionNode, RoutePathfindResult } from '../../types';
import { soundEffects } from '../../utils/soundEffects';

interface CityRoutePlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  intersections: CityIntersectionNode[];
  onActivateGreenWave: (pathNodeIds: string[]) => void;
}

export const CityRoutePlannerModal: React.FC<CityRoutePlannerModalProps> = ({
  isOpen,
  onClose,
  intersections,
  onActivateGreenWave,
}) => {
  const [originId, setOriginId] = useState<string>('J003'); // Cyber City
  const [destId, setDestId] = useState<string>('J004'); // Sector 62 Noida
  const [isActivated, setIsActivated] = useState<boolean>(false);

  // Pathfinding algorithm over graph of intersections
  const routeResult = useMemo<RoutePathfindResult | null>(() => {
    if (!originId || !destId || originId === destId || intersections.length === 0) {
      return null;
    }

    // BFS / Dijkstra shortest path
    const queue: { id: string; path: string[] }[] = [{ id: originId, path: [originId] }];
    const visited = new Set<string>([originId]);
    let bestPath: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.id === destId) {
        bestPath = current.path;
        break;
      }

      const node = intersections.find((n) => n.id === current.id);
      if (node) {
        for (const neighborId of node.connectedNodeIds) {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            queue.push({ id: neighborId, path: [...current.path, neighborId] });
          }
        }
      }
    }

    if (bestPath.length === 0) {
      bestPath = [originId, destId];
    }

    const pathNodes = bestPath.map((id) => intersections.find((n) => n.id === id)!).filter(Boolean);

    // Calculate realistic distance based on coordinates
    let distKm = 0;
    for (let i = 0; i < pathNodes.length - 1; i++) {
      const a = pathNodes[i];
      const b = pathNodes[i + 1];
      const dx = (a.x - b.x) * 0.45;
      const dy = (a.y - b.y) * 0.55;
      distKm += Math.sqrt(dx * dx + dy * dy) * 1.6 + 3.2;
    }
    distKm = Number(distKm.toFixed(1));

    const avgSpeed = 54;
    const greenWaveEtaMin = Number(((distKm / avgSpeed) * 60).toFixed(1));
    const delayPerRedLight = (pathNodes.length - 1) * 2.8;
    const standardEtaMin = Number((greenWaveEtaMin + delayPerRedLight).toFixed(1));
    const timeSavedMin = Number((standardEtaMin - greenWaveEtaMin).toFixed(1));
    const fuelSavedLiters = Number((timeSavedMin * 0.085 * (distKm / 10)).toFixed(2));
    const co2AvoidedKg = Number((fuelSavedLiters * 2.31).toFixed(2));

    return {
      path: bestPath,
      pathNodes,
      totalDistanceKm: distKm,
      standardEtaMin,
      greenWaveEtaMin,
      timeSavedMin,
      fuelSavedLiters,
      co2AvoidedKg,
      averageSpeedKmh: avgSpeed,
      corridorBandwidthSec: 45,
    };
  }, [originId, destId, intersections]);

  if (!isOpen) return null;

  const handleActivate = () => {
    if (!routeResult) return;
    soundEffects.playSuccess();
    setIsActivated(true);
    onActivateGreenWave(routeResult.path);
    setTimeout(() => {
      setIsActivated(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/60 overflow-hidden font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-400 flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Arterial Green Wave Corridor Planner
              </h3>
              <p className="text-xs text-slate-400">
                Multi-hop Dijkstra route solver with AI offset synchronization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {/* Origin and Destination Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 font-mono">
              <label className="text-xs text-slate-400 uppercase flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Origin Intersection:</span>
              </label>
              <select
                value={originId}
                onChange={(e) => setOriginId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-cyan-400 focus:outline-none"
              >
                {intersections.map((n) => (
                  <option key={n.id} value={n.id} disabled={n.id === destId}>
                    {n.code} — {n.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 font-mono">
              <label className="text-xs text-slate-400 uppercase flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Destination Intersection:</span>
              </label>
              <select
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-cyan-400 focus:outline-none"
              >
                {intersections.map((n) => (
                  <option key={n.id} value={n.id} disabled={n.id === originId}>
                    {n.code} — {n.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Route Progression Road Map */}
          {routeResult && (
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="text-[11px] font-mono text-cyan-400 uppercase font-bold flex items-center justify-between">
                <span>Calculated Corridor Path ({routeResult.pathNodes.length} Nodes)</span>
                <span className="text-slate-400 font-normal">
                  Distance: <strong className="text-white">{routeResult.totalDistanceKm} km</strong>
                </span>
              </div>

              {/* Node Sequence Flow */}
              <div className="flex items-center flex-wrap gap-2 pt-1">
                {routeResult.pathNodes.map((n, idx) => (
                  <React.Fragment key={n.id}>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 font-mono text-xs">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          n.currentSignal === 'GREEN' ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                      <span className="font-bold text-white">{n.code}</span>
                      <span className="text-[10px] text-slate-400">({n.vehicleCount}v)</span>
                    </div>
                    {idx < routeResult.pathNodes.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Comparison Cards: Standard vs AI Green Wave */}
          {routeResult && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-center">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Standard ETA</span>
                </div>
                <div className="text-lg font-bold text-slate-300 mt-1">
                  {routeResult.standardEtaMin} min
                </div>
                <div className="text-[10px] text-slate-500">Stop & Go delays</div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-700/60">
                <div className="text-[10px] text-emerald-400 uppercase flex items-center justify-center gap-1 font-bold">
                  <Zap className="w-3 h-3" />
                  <span>AI Green Wave</span>
                </div>
                <div className="text-lg font-bold text-emerald-300 mt-1">
                  {routeResult.greenWaveEtaMin} min
                </div>
                <div className="text-[10px] text-emerald-400 font-bold">
                  -{routeResult.timeSavedMin} min saved
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase flex items-center justify-center gap-1">
                  <Gauge className="w-3 h-3 text-amber-400" />
                  <span>Corridor Band</span>
                </div>
                <div className="text-lg font-bold text-amber-300 mt-1">
                  {routeResult.averageSpeedKmh} km/h
                </div>
                <div className="text-[10px] text-slate-500">Target Progression</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase flex items-center justify-center gap-1">
                  <TrendingDown className="w-3 h-3 text-cyan-400" />
                  <span>Eco Savings</span>
                </div>
                <div className="text-lg font-bold text-cyan-300 mt-1">
                  -{routeResult.co2AvoidedKg} kg
                </div>
                <div className="text-[10px] text-cyan-500">CO2 emissions</div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={handleActivate}
              disabled={!routeResult || isActivated}
              className={`w-full py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg cursor-pointer ${
                isActivated
                  ? 'bg-emerald-600 text-white shadow-emerald-600/40 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-cyan-600/30 hover:scale-[1.01]'
              }`}
            >
              {isActivated ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Corridor Green Wave Synchronized!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Activate Arterial Green Wave ({routeResult?.pathNodes.length || 0} Signals)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
