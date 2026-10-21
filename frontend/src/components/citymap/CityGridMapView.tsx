import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Minimize2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  AlertTriangle,
  Flame,
  CloudRain,
  Eye,
  Activity,
  Sparkles,
  Search,
  Filter,
  SlidersHorizontal,
  Wrench,
  Clock,
  Gauge,
} from 'lucide-react';
import { CityIntersectionNode, CityCorridorRoute, CityIncident, Direction, LightState } from '../../types';
import { CityCameraPipModal } from './CityCameraPipModal';
import { CityRoutePlannerModal } from './CityRoutePlannerModal';
import { CityIncidentDispatcher } from './CityIncidentDispatcher';
import { soundEffects } from '../../utils/soundEffects';

interface CityGridMapViewProps {
  intersections: CityIntersectionNode[];
  routes: CityCorridorRoute[];
  activeIncidents?: CityIncident[];
  onSelectJunction?: (junctionId: string) => void;
  onInjectEmergency?: (junctionId: string) => void;
  onOverrideJunction?: (data: { junctionId: string; signal?: LightState; direction?: Direction; cycleLength?: number }) => void;
  onInjectIncident?: (incident: any) => void;
  onResolveIncident?: (incidentId: string) => void;
}

type MapTheme = 'CYBER' | 'SATELLITE' | 'BLUEPRINT';

export const CityGridMapView: React.FC<CityGridMapViewProps> = ({
  intersections,
  routes,
  activeIncidents = [],
  onSelectJunction,
  onInjectEmergency,
  onOverrideJunction,
  onInjectIncident,
  onResolveIncident,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Active Selected Node & Navigation State
  const [selectedNodeId, setSelectedNodeId] = useState<string>('J001');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Map Theme & Visual Layer Toggles
  const [mapTheme, setMapTheme] = useState<MapTheme>('CYBER');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showEmergencyOverlay, setShowEmergencyOverlay] = useState<boolean>(true);
  const [showCctvMesh, setShowCctvMesh] = useState<boolean>(true);
  const [showGreenWave, setShowGreenWave] = useState<boolean>(true);
  const [showFlowVectors, setShowFlowVectors] = useState<boolean>(true);
  const [showWeatherOverlay, setShowWeatherOverlay] = useState<boolean>(false);

  // Active Green Wave Path Nodes (for route highlight)
  const [activeGreenWavePath, setActiveGreenWavePath] = useState<string[]>(['J003', 'J008', 'J001', 'J004']);

  // Modals State
  const [isCameraPipOpen, setIsCameraPipOpen] = useState<boolean>(false);
  const [cameraNode, setCameraNode] = useState<CityIntersectionNode | null>(null);
  const [isRoutePlannerOpen, setIsRoutePlannerOpen] = useState<boolean>(false);
  const [isIncidentDispatcherOpen, setIsIncidentDispatcherOpen] = useState<boolean>(false);

  // Local override state for instant UI responsiveness
  const [cycleSliderVal, setCycleSliderVal] = useState<number>(60);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);

  const selectedNode = intersections.find((n) => n.id === selectedNodeId) || intersections[0];

  // Update slider value when selected node changes
  useEffect(() => {
    if (selectedNode?.cycleLength) {
      setCycleSliderVal(selectedNode.cycleLength);
    }
  }, [selectedNodeId]);

  // Handle Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  // Canvas Vehicle Particle Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // Generate vehicle particles along existing graph links
    const linkPairs: Array<{ from: CityIntersectionNode; to: CityIntersectionNode; isGreenWave: boolean }> = [];
    intersections.forEach((fromNode) => {
      fromNode.connectedNodeIds.forEach((targetId) => {
        const toNode = intersections.find((n) => n.id === targetId);
        if (toNode) {
          const isGreenWave =
            activeGreenWavePath.includes(fromNode.id) && activeGreenWavePath.includes(toNode.id);
          linkPairs.push({ from: fromNode, to: toNode, isGreenWave });
        }
      });
    });

    interface ParticleVehicle {
      linkIdx: number;
      progress: number; // 0 to 1
      speed: number;
      type: 'CAR' | 'BUS' | 'AMBULANCE' | 'BIKE';
      color: string;
      size: number;
      laneOffset: number;
      isEmergency: boolean;
    }

    const particles: ParticleVehicle[] = [];
    const colors = ['#38bdf8', '#34d399', '#f59e0b', '#a78bfa', '#f43f5e', '#e2e8f0'];

    for (let i = 0; i < 48; i++) {
      const linkIdx = Math.floor(Math.random() * linkPairs.length);
      const isAmbulance = i % 12 === 0;
      particles.push({
        linkIdx,
        progress: Math.random(),
        speed: isAmbulance ? 0.0035 : 0.0012 + Math.random() * 0.0018,
        type: isAmbulance ? 'AMBULANCE' : i % 5 === 0 ? 'BUS' : i % 3 === 0 ? 'BIKE' : 'CAR',
        color: isAmbulance ? '#f43f5e' : colors[i % colors.length],
        size: isAmbulance ? 4.5 : i % 5 === 0 ? 4 : 3,
        laneOffset: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2),
        isEmergency: isAmbulance,
      });
    }

    const render = () => {
      time += 0.03;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // 1. Map Canvas Background & Grid based on theme
      if (mapTheme === 'CYBER') {
        ctx.fillStyle = '#05070e';
        ctx.fillRect(0, 0, w, h);

        // Cyber Grid Lines
        ctx.strokeStyle = 'rgba(14, 116, 144, 0.12)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < w; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Radar sweep circular pulse from CP-01 (Center)
        const cpNode = intersections.find((n) => n.id === 'J001') || intersections[0];
        if (cpNode) {
          const cpX = (cpNode.x / 100) * w;
          const cpY = (cpNode.y / 100) * h;
          const radarRadius = ((time * 30) % Math.max(w, h)) * 0.6;
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.15)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cpX, cpY, radarRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (mapTheme === 'SATELLITE') {
        ctx.fillStyle = '#0a101d';
        ctx.fillRect(0, 0, w, h);

        // Satellite Radar Circles
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
        ctx.lineWidth = 1;
        for (let r = 80; r < Math.max(w, h); r += 90) {
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        // BLUEPRINT THEME
        ctx.fillStyle = '#031a2f';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.lineWidth = 0.8;
        for (let x = 0; x < w; x += 25) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += 25) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }

      // 2. Render Arterial Corridor Road Segments
      linkPairs.forEach(({ from, to, isGreenWave }) => {
        const x1 = (from.x / 100) * w;
        const y1 = (from.y / 100) * h;
        const x2 = (to.x / 100) * w;
        const y2 = (to.y / 100) * h;

        // Base Road Track
        ctx.strokeStyle = isGreenWave && showGreenWave ? 'rgba(16, 185, 129, 0.4)' : 'rgba(30, 41, 59, 0.8)';
        ctx.lineWidth = isGreenWave && showGreenWave ? 6 : 4;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Inner Glowing Corridor Wire
        ctx.strokeStyle = isGreenWave && showGreenWave ? '#10b981' : '#0891b2';
        ctx.lineWidth = isGreenWave && showGreenWave ? 2 : 1;
        ctx.setLineDash(isGreenWave ? [] : [6, 4]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Green Wave Moving Pulse Packets
        if (isGreenWave && showGreenWave) {
          const waveT = (time * 0.4) % 1;
          const waveX = x1 + (x2 - x1) * waveT;
          const waveY = y1 + (y2 - y1) * waveT;

          const grad = ctx.createRadialGradient(waveX, waveY, 0, waveX, waveY, 16);
          grad.addColorStop(0, 'rgba(52, 211, 153, 0.9)');
          grad.addColorStop(0.6, 'rgba(16, 185, 129, 0.3)');
          grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(waveX, waveY, 16, 0, Math.PI * 2);
          ctx.fill();
        }

        // Flow Speed Vectors Arrows
        if (showFlowVectors) {
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const arrowLen = 6;

          ctx.fillStyle = isGreenWave ? '#34d399' : '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(
            midX + Math.cos(angle) * arrowLen,
            midY + Math.sin(angle) * arrowLen
          );
          ctx.lineTo(
            midX + Math.cos(angle + (Math.PI * 3) / 4) * arrowLen,
            midY + Math.sin(angle + (Math.PI * 3) / 4) * arrowLen
          );
          ctx.lineTo(
            midX + Math.cos(angle - (Math.PI * 3) / 4) * arrowLen,
            midY + Math.sin(angle - (Math.PI * 3) / 4) * arrowLen
          );
          ctx.closePath();
          ctx.fill();
        }
      });

      // 3. Render Vehicle Particles
      if (linkPairs.length > 0) {
        particles.forEach((p) => {
          const link = linkPairs[p.linkIdx % linkPairs.length];
          const x1 = (link.from.x / 100) * w;
          const y1 = (link.from.y / 100) * h;
          const x2 = (link.to.x / 100) * w;
          const y2 = (link.to.y / 100) * h;

          // Check if destination junction is RED for stopping physics
          const isDestRed = link.to.currentSignal === 'RED' && !p.isEmergency && !link.isGreenWave;

          // Slow down or stop near destination if red
          if (isDestRed && p.progress > 0.85) {
            // Queue near red intersection
            p.progress = Math.min(p.progress + p.speed * 0.15, 0.92);
          } else {
            p.progress += p.speed;
          }

          if (p.progress >= 1) {
            p.progress = 0;
            p.linkIdx = Math.floor(Math.random() * linkPairs.length);
          }

          const angle = Math.atan2(y2 - y1, x2 - x1);
          const perpAngle = angle + Math.PI / 2;

          const baseX = x1 + (x2 - x1) * p.progress;
          const baseY = y1 + (y2 - y1) * p.progress;

          const posX = baseX + Math.cos(perpAngle) * p.laneOffset;
          const posY = baseY + Math.sin(perpAngle) * p.laneOffset;

          // Draw Vehicle Body
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(posX, posY, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Vehicle Headlight Beam Glow
          ctx.strokeStyle = p.isEmergency ? 'rgba(244, 63, 94, 0.6)' : 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(posX, posY);
          ctx.lineTo(posX + Math.cos(angle) * (p.size * 2), posY + Math.sin(angle) * (p.size * 2));
          ctx.stroke();

          // Emergency Ambulance Strobe Siren
          if (p.isEmergency) {
            const strobe = Math.sin(time * 12) > 0;
            ctx.fillStyle = strobe ? 'rgba(244, 63, 94, 0.8)' : 'rgba(59, 130, 246, 0.8)';
            ctx.beginPath();
            ctx.arc(posX, posY, p.size * 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // 4. Simulated Weather / Monsoon Rain Overlay
      if (showWeatherOverlay) {
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.25)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 35; i++) {
          const rx = (Math.sin(i * 99 + time) * 0.5 + 0.5) * w;
          const ry = ((i * 37 + time * 180) % h);
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 4, ry + 14);
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [intersections, activeGreenWavePath, mapTheme, showGreenWave, showFlowVectors, showWeatherOverlay]);

  // Handle Congestion Badging
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
    if (node.hasEmergency || node.activeIncident)
      return 'shadow-[0_0_20px_#f43f5e] border-rose-500 bg-rose-950/90 text-rose-300 animate-pulse';
    if (activeGreenWavePath.includes(node.id))
      return 'shadow-[0_0_18px_#10b981] border-emerald-400 bg-emerald-950/90 text-emerald-300';
    if (node.currentSignal === 'GREEN')
      return 'shadow-[0_0_14px_#10b981] border-emerald-500 bg-emerald-950/80 text-emerald-300';
    return 'shadow-[0_0_10px_#06b6d4] border-slate-700 bg-slate-900/90 text-slate-300';
  };

  // Node Override Handler
  const handleForceGreen = (direction: Direction) => {
    soundEffects.playSuccess();
    if (onOverrideJunction) {
      onOverrideJunction({
        junctionId: selectedNode.id,
        signal: 'GREEN',
        direction,
        cycleLength: cycleSliderVal,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto' : ''
      }`}
    >
      {/* Top Map Control Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-400 flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '20s' }} />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Metropolitan Multi-Junction Command Grid
              </h3>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-700">
                DELHI-NCR • 9 NODES
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
              60 FPS Kinetic Particle Flow | Dijkstra Green Wave Bandwidth | Real-time Adaptive Control
            </div>
          </div>
        </div>

        {/* Action Modals Launchers & Theme Selector */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Route Planner Button */}
          <button
            onClick={() => {
              soundEffects.playClick();
              setIsRoutePlannerOpen(true);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span>Green Wave Route Solver</span>
          </button>

          {/* Incident Dispatcher Button */}
          <button
            onClick={() => {
              soundEffects.playClick();
              setIsIncidentDispatcherOpen(true);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700 font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Tactical Incidents ({activeIncidents.length})</span>
          </button>

          {/* Map Theme Toggle */}
          <select
            value={mapTheme}
            onChange={(e) => setMapTheme(e.target.value as MapTheme)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs font-mono focus:border-cyan-400 focus:outline-none"
          >
            <option value="CYBER">⚡ Cyber HUD Theme</option>
            <option value="SATELLITE">🛰️ Satellite Radar</option>
            <option value="BLUEPRINT">📐 CAD Blueprint</option>
          </select>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
            title="Toggle Fullscreen Command Canvas"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Layer Filters Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-slate-500 uppercase font-bold mr-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>Layers:</span>
          </span>

          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border ${
              showHeatmap
                ? 'bg-cyan-950 text-cyan-400 border-cyan-700'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Density Heatmap</span>
          </button>

          <button
            onClick={() => setShowGreenWave(!showGreenWave)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border ${
              showGreenWave
                ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>Green Wave Arterials</span>
          </button>

          <button
            onClick={() => setShowEmergencyOverlay(!showEmergencyOverlay)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border ${
              showEmergencyOverlay
                ? 'bg-rose-950 text-rose-400 border-rose-700'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>Emergency Routes</span>
          </button>

          <button
            onClick={() => setShowCctvMesh(!showCctvMesh)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border ${
              showCctvMesh
                ? 'bg-amber-950 text-amber-400 border-amber-700'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <Camera className="w-3 h-3 text-amber-400" />
            <span>CCTV Mesh</span>
          </button>

          <button
            onClick={() => setShowFlowVectors(!showFlowVectors)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border ${
              showFlowVectors
                ? 'bg-purple-950 text-purple-400 border-purple-700'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <Navigation className="w-3 h-3 text-purple-400" />
            <span>Flow Vectors</span>
          </button>

          <button
            onClick={() => setShowWeatherOverlay(!showWeatherOverlay)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border ${
              showWeatherOverlay
                ? 'bg-blue-950 text-blue-400 border-blue-700'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <CloudRain className="w-3 h-3 text-blue-400" />
            <span>Monsoon Weather FX</span>
          </button>
        </div>

        {/* Zoom & Reset Canvas Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.8))}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.7))}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoomLevel(1);
              setPanOffset({ x: 0, y: 0 });
            }}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-[10px] cursor-pointer"
            title="Reset View"
          >
            Reset (100%)
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Canvas + Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Canvas Viewport (8 cols) */}
        <div
          className="lg:col-span-8 relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl bg-gradient-to-br from-[#05070e] via-[#091122] to-[#040813] border border-slate-800 overflow-hidden shadow-2xl select-none"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={(e) => {
            setIsDragging(true);
            setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
          }}
          onMouseMove={(e) => {
            if (!isDragging) return;
            setPanOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          {/* Kinetic Canvas Vehicle Animation */}
          <div
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${
                panOffset.y / zoomLevel
              }px)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            }}
            className="relative w-full h-full"
          >
            <canvas
              ref={canvasRef}
              width={960}
              height={540}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {/* Interactive Node Markers Overlay */}
            {intersections.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const isGreenWave = activeGreenWavePath.includes(node.id);
              const hasActiveIncident = node.activeIncident || node.hasEmergency;

              return (
                <div
                  key={node.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    soundEffects.playClick();
                    setSelectedNodeId(node.id);
                    if (onSelectJunction) onSelectJunction(node.id);
                  }}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 group z-20 ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                  }`}
                >
                  {/* Heatmap Glow Ring */}
                  {showHeatmap && (
                    <div
                      className={`absolute -inset-3 rounded-full blur-md opacity-60 transition-all ${
                        node.congestionLevel === 'CRITICAL'
                          ? 'bg-rose-500 animate-ping'
                          : node.congestionLevel === 'HIGH'
                          ? 'bg-amber-500'
                          : node.congestionLevel === 'MEDIUM'
                          ? 'bg-cyan-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                  )}

                  {/* Incident Icon Floating Badge */}
                  {hasActiveIncident && (
                    <div className="absolute -top-3.5 -right-3.5 z-30 p-1 rounded-full bg-rose-950 border border-rose-500 text-rose-300 animate-bounce shadow-lg shadow-rose-900/60">
                      <ShieldAlert className="w-3 h-3" />
                    </div>
                  )}

                  {/* CCTV Quick Camera Click Trigger */}
                  {showCctvMesh && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        soundEffects.playClick();
                        setCameraNode(node);
                        setIsCameraPipOpen(true);
                      }}
                      className="absolute -top-3 -left-3 z-30 p-1 rounded-full bg-slate-900 border border-cyan-500 text-cyan-400 hover:scale-125 transition shadow-lg cursor-pointer"
                      title="Open Live CCTV Stream"
                    >
                      <Camera className="w-2.5 h-2.5" />
                    </button>
                  )}

                  {/* Node Badge Pill */}
                  <div
                    className={`relative px-2.5 py-1.5 rounded-xl border-2 font-mono flex items-center gap-1.5 shadow-xl backdrop-blur-md transition-all ${getNodeGlow(
                      node
                    )} ${isSelected ? 'border-cyan-400 ring-2 ring-cyan-400/50' : ''}`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        node.currentSignal === 'GREEN'
                          ? 'bg-emerald-400 shadow-md shadow-emerald-400'
                          : 'bg-rose-400 shadow-md shadow-rose-400'
                      }`}
                    />
                    <div className="text-[11px] font-extrabold tracking-tight">{node.code}</div>
                    <div className="text-[9px] px-1.5 py-0.2 rounded bg-black/50 text-slate-200 font-bold">
                      {node.vehicleCount}v
                    </div>
                  </div>

                  {/* Rich Tooltip on Hover */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block whitespace-nowrap px-3 py-2 rounded-xl bg-slate-950/95 text-[11px] font-mono text-slate-200 border border-cyan-500/40 shadow-2xl z-40 pointer-events-none">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{node.name}</span>
                      <span className="text-[9px] text-cyan-400 font-normal">[{node.efficiencyRating}]</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{node.locationName}</div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-300 pt-1 border-t border-slate-800">
                      <span>Signal: <strong className="text-emerald-400">{node.activeDirection} GREEN</strong></span>
                      <span>•</span>
                      <span>Phase: <strong>{node.secondsRemaining || 18}s</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom HUD Bar & Coordinates Watermark */}
          <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none">
            <div className="bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-2">
              <span className="text-cyan-400 font-bold">DELHI-NCR METRO GRID TOPOLOGY</span>
              <span>|</span>
              <span>WGS84 GPS • {intersections.length} NODES ONLINE</span>
            </div>

            <div className="bg-black/75 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE 60 FPS MESH</span>
            </div>
          </div>
        </div>

        {/* Right Inspector Drawer (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {selectedNode && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              {/* Selected Node Header */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                    <Radio className="w-3 h-3 animate-pulse text-cyan-400" />
                    <span>INTERSECTION TELEMETRY & CONTROLLER</span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-sans mt-0.5">{selectedNode.name}</h4>
                  <div className="text-xs text-slate-400 font-mono">{selectedNode.locationName}</div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getCongestionBadge(
                    selectedNode.congestionLevel
                  )}`}
                >
                  {selectedNode.congestionLevel}
                </span>
              </div>

              {/* 4-Arm Directional Queue Breakdown */}
              <div className="space-y-1.5 font-mono">
                <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                  <span>Directional Queue Telemetry:</span>
                  <span className="text-cyan-400">Total: {selectedNode.vehicleCount} veh</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as Direction[]).map((dir) => {
                    const count = selectedNode.queues ? selectedNode.queues[dir] : Math.floor(selectedNode.vehicleCount / 4);
                    const isGreen = selectedNode.activeDirection === dir && selectedNode.currentSignal === 'GREEN';
                    const maxQ = 25;
                    const percent = Math.min((count / maxQ) * 100, 100);

                    return (
                      <div key={dir} className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-bold">{dir}</span>
                          <span className={isGreen ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
                            {count} veh {isGreen && '🟢'}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${percent}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${
                              isGreen ? 'bg-emerald-400' : 'bg-cyan-500'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Signal Phase & Efficiency Stats */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[9px] text-slate-500 uppercase">Phase Timer</div>
                  <div className="text-emerald-400 font-bold text-sm mt-0.5">
                    {selectedNode.secondsRemaining || 18}s REM
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[9px] text-slate-500 uppercase">Speed Index</div>
                  <div className="text-cyan-400 font-bold text-sm mt-0.5">
                    {selectedNode.speedKmh || 46} km/h
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[9px] text-slate-500 uppercase">Pedestrians</div>
                  <div className="text-amber-400 font-bold text-sm mt-0.5">
                    {selectedNode.pedestrianWaiting || 8} waiting
                  </div>
                </div>
              </div>

              {/* Remote Override Control Section */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800 font-mono text-xs">
                <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Sliders className="w-3 h-3" />
                    <span>Remote Signal Phase Controller:</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Autonomous</span>
                </div>

                {/* Force Phase Green Buttons */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleForceGreen('NORTH')}
                    className="px-2 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-bold text-[11px] transition cursor-pointer"
                  >
                    🟢 Force N-S Green
                  </button>
                  <button
                    onClick={() => handleForceGreen('EAST')}
                    className="px-2 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-bold text-[11px] transition cursor-pointer"
                  >
                    🟢 Force E-W Green
                  </button>
                </div>

                {/* Cycle Length Adjustment Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>Cycle Duration:</span>
                    <strong className="text-cyan-400">{cycleSliderVal} seconds</strong>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={120}
                    step={5}
                    value={cycleSliderVal}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCycleSliderVal(val);
                      if (onOverrideJunction) {
                        onOverrideJunction({
                          junctionId: selectedNode.id,
                          cycleLength: val,
                        });
                      }
                    }}
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>30s (Rapid)</span>
                    <span>60s (Standard)</span>
                    <span>120s (Peak)</span>
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs font-mono">
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setCameraNode(selectedNode);
                    setIsCameraPipOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-600/50 font-bold transition hover:scale-[1.01] cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Launch Live AI CCTV Stream</span>
                </button>

                <button
                  onClick={() => onInjectEmergency && onInjectEmergency(selectedNode.id)}
                  className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-600/40 font-bold transition hover:scale-[1.01] cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Dispatch Emergency Corridor to this Node</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Camera Live PIP Modal */}
      <CityCameraPipModal
        isOpen={isCameraPipOpen}
        onClose={() => setIsCameraPipOpen(false)}
        node={cameraNode}
      />

      {/* Route Planner & Green Wave Modal */}
      <CityRoutePlannerModal
        isOpen={isRoutePlannerOpen}
        onClose={() => setIsRoutePlannerOpen(false)}
        intersections={intersections}
        onActivateGreenWave={(path) => {
          setActiveGreenWavePath(path);
          soundEffects.playSuccess();
        }}
      />

      {/* Incident Dispatcher Modal */}
      <CityIncidentDispatcher
        isOpen={isIncidentDispatcherOpen}
        onClose={() => setIsIncidentDispatcherOpen(false)}
        intersections={intersections}
        activeIncidents={activeIncidents}
        onInjectIncident={(inc) => {
          if (onInjectIncident) onInjectIncident(inc);
          setIsIncidentDispatcherOpen(false);
        }}
        onResolveIncident={(incId) => {
          if (onResolveIncident) onResolveIncident(incId);
        }}
      />
    </div>
  );
};
