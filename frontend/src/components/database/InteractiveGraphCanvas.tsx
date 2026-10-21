import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Play,
  Pause,
  Filter,
  Layers,
  Database,
  Search,
  Eye,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Move,
} from 'lucide-react';
import { GraphNode, GraphLink } from '../../types';

interface InteractiveGraphCanvasProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onSelectNode: (node: GraphNode | null) => void;
  selectedNode: GraphNode | null;
}

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isFixed?: boolean;
}

export const InteractiveGraphCanvas: React.FC<InteractiveGraphCanvasProps> = ({
  nodes: initialNodes,
  links: initialLinks,
  onSelectNode,
  selectedNode,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);

  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const draggingNodeRef = useRef<SimNode | null>(null);
  const isPanningRef = useRef<boolean>(false);
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update nodes and links WITHOUT resetting positions on every 4s poll
  useEffect(() => {
    const rawNodes = initialNodes && initialNodes.length > 0 ? initialNodes : [];
    const rawLinks = initialLinks && initialLinks.length > 0 ? initialLinks : [];

    const existingMap = new Map<string, SimNode>();
    nodesRef.current.forEach((n) => existingMap.set(String(n.id), n));

    const width = 800;
    const height = 440;
    const centerX = width / 2;
    const centerY = height / 2;

    const updatedNodes: SimNode[] = rawNodes.map((n, i) => {
      const existing = existingMap.get(String(n.id));
      if (existing) {
        return {
          ...existing,
          ...n,
          properties: n.properties || existing.properties,
        };
      }

      // Initial placement for newly discovered nodes
      const angle = (i / Math.max(1, rawNodes.length)) * 2 * Math.PI;
      const radius = n.group?.toLowerCase() === 'junction' ? 0 : 130 + (i % 3) * 45;

      return {
        ...n,
        x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 20,
        y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
        radius: n.group?.toLowerCase() === 'junction' ? 22 : n.group?.toLowerCase() === 'road' ? 16 : 13,
      };
    });

    nodesRef.current = updatedNodes;
    linksRef.current = rawLinks;
  }, [initialNodes, initialLinks]);

  // Color mapping for Neo4j entities
  const getNodeTheme = (group: string = '') => {
    const g = group.toLowerCase();
    if (g.includes('junction')) return { fill: '#06b6d4', glow: '#22d3ee', border: '#083344', text: '#ecfeff' };
    if (g.includes('road')) return { fill: '#3b82f6', glow: '#60a5fa', border: '#1e3a8a', text: '#eff6ff' };
    if (g.includes('camera') || g.includes('sensor') || g.includes('irsensor'))
      return { fill: '#ef4444', glow: '#f87171', border: '#450a0a', text: '#fef2f2' };
    if (g.includes('vehiclecount') || g.includes('count'))
      return { fill: '#f59e0b', glow: '#fbbf24', border: '#451a03', text: '#fffbeb' };
    if (g.includes('emergency')) return { fill: '#f43f5e', glow: '#fb7185', border: '#4c0519', text: '#fff1f2' };
    if (g.includes('signal')) return { fill: '#10b981', glow: '#34d399', border: '#022c22', text: '#f0fdf4' };
    return { fill: '#64748b', glow: '#94a3b8', border: '#0f172a', text: '#f8fafc' };
  };

  // Main 60 FPS Physics & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);
      ctx.save();

      // Apply Zoom and Pan transform
      ctx.translate(pan.x + centerX, pan.y + centerY);
      ctx.scale(zoom, zoom);
      ctx.translate(-centerX, -centerY);

      const nodes = nodesRef.current;
      const links = linksRef.current;

      // 1. Force-Directed Physics Step
      if (isSimulating && nodes.length > 0) {
        // A. Repulsion between all pairs of nodes (Coulomb's Law)
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[j].x - nodes[i].x;
            const dy = nodes[j].y - nodes[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = (nodes[i].radius + nodes[j].radius) * 2.5;

            if (dist < 220) {
              const force = (220 - dist) / dist * 0.045;
              nodes[i].vx -= dx * force;
              nodes[i].vy -= dy * force;
              nodes[j].vx += dx * force;
              nodes[j].vy += dy * force;
            }
          }

          // B. Center gravitational pull
          const cdx = centerX - nodes[i].x;
          const cdy = centerY - nodes[i].y;
          nodes[i].vx += cdx * 0.0018;
          nodes[i].vy += cdy * 0.0018;
        }

        // C. Link Spring Attraction (Hooke's Law)
        links.forEach((l) => {
          const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
          const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;

          const sNode = nodes.find((n) => n.id === sId);
          const tNode = nodes.find((n) => n.id === tId);

          if (sNode && tNode) {
            const dx = tNode.x - sNode.x;
            const dy = tNode.y - sNode.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const targetLength = 110;
            const springForce = (dist - targetLength) * 0.0035;

            sNode.vx += (dx / dist) * springForce;
            sNode.vy += (dy / dist) * springForce;
            tNode.vx -= (dx / dist) * springForce;
            tNode.vy -= (dy / dist) * springForce;
          }
        });

        // D. Apply velocity & damping
        nodes.forEach((n) => {
          if (draggingNodeRef.current?.id !== n.id && !n.isFixed) {
            n.x += n.vx;
            n.y += n.vy;
            n.x = Math.max(30, Math.min(width - 30, n.x));
            n.y = Math.max(30, Math.min(height - 30, n.y));
          }
          n.vx *= 0.85;
          n.vy *= 0.85;
        });
      }

      // 2. Render Relationships (Edges)
      links.forEach((link) => {
        const sId = typeof link.source === 'object' ? (link.source as any).id : link.source;
        const tId = typeof link.target === 'object' ? (link.target as any).id : link.target;

        const sNode = nodes.find((n) => n.id === sId);
        const tNode = nodes.find((n) => n.id === tId);

        if (sNode && tNode) {
          const isHighlighted =
            hoveredNode?.id === sNode.id ||
            hoveredNode?.id === tNode.id ||
            selectedNode?.id === sNode.id ||
            selectedNode?.id === tNode.id;

          ctx.beginPath();
          ctx.moveTo(sNode.x, sNode.y);
          ctx.lineTo(tNode.x, tNode.y);
          ctx.strokeStyle = isHighlighted ? '#38bdf8' : 'rgba(71, 85, 105, 0.45)';
          ctx.lineWidth = isHighlighted ? 2.5 : 1.2;
          ctx.stroke();

          // Link relationship badge
          const midX = (sNode.x + tNode.x) / 2;
          const midY = (sNode.y + tNode.y) / 2;

          ctx.font = 'bold 8px monospace';
          ctx.fillStyle = isHighlighted ? '#38bdf8' : '#94a3b8';
          ctx.textAlign = 'center';
          ctx.fillText(`[:${link.type}]`, midX, midY - 4);
        }
      });

      // 3. Render Nodes
      nodes.forEach((node) => {
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode?.id === node.id;
        const isFilteredOut =
          selectedFilter !== 'ALL' &&
          !(node.group && node.group.toUpperCase().includes(selectedFilter.toUpperCase())) &&
          !(node.label && node.label.toUpperCase().includes(selectedFilter.toUpperCase()));

        const theme = getNodeTheme(node.group || node.label);

        ctx.save();
        ctx.globalAlpha = isFilteredOut ? 0.15 : 1.0;

        // Outer aura halo
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = theme.glow + '33';
          ctx.fill();
          ctx.strokeStyle = theme.glow;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Inner node body
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = theme.fill;
        ctx.fill();
        ctx.strokeStyle = '#0a0f1d';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Node ID label
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(String(node.id), node.x, node.y + node.radius + 12);

        // Subtitle (Name / Type)
        ctx.font = '8px sans-serif';
        ctx.fillStyle = theme.glow;
        ctx.fillText(node.name || `:${node.label}`, node.x, node.y + node.radius + 22);

        ctx.restore();
      });

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [isSimulating, zoom, pan, selectedFilter, selectedNode, hoveredNode]);

  // Mouse / Canvas coordinates converter
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Inverse transform of translate(pan) & scale(zoom)
    const worldX = (screenX - pan.x - centerX) / zoom + centerX;
    const worldY = (screenY - pan.y - centerY) / zoom + centerY;

    return { x: worldX, y: worldY, screenX, screenY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y, screenX, screenY } = getCanvasCoords(e);

    // Check if clicked a node
    const clicked = nodesRef.current.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4;
    });

    if (clicked) {
      draggingNodeRef.current = clicked;
      onSelectNode(clicked);
    } else {
      // Pan canvas
      isPanningRef.current = true;
      startPanRef.current = { x: screenX - pan.x, y: screenY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y, screenX, screenY } = getCanvasCoords(e);

    if (draggingNodeRef.current) {
      draggingNodeRef.current.x = x;
      draggingNodeRef.current.y = y;
      draggingNodeRef.current.vx = 0;
      draggingNodeRef.current.vy = 0;
    } else if (isPanningRef.current) {
      setPan({
        x: screenX - startPanRef.current.x,
        y: screenY - startPanRef.current.y,
      });
    } else {
      const hover = nodesRef.current.find((n) => {
        const dx = n.x - x;
        const dy = n.y - y;
        return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4;
      });
      setHoveredNode(hover || null);
    }
  };

  const handleMouseUp = () => {
    draggingNodeRef.current = null;
    isPanningRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(2.5, Math.max(0.4, prev * zoomFactor)));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsSimulating(true);
  };

  return (
    <div ref={containerRef} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-xl border border-slate-800 text-[10px] font-mono">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300 font-bold">Neo4j Force Graph Canvas</span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-black/80 p-1 rounded-xl border border-slate-800 text-[10px] font-mono">
          {['ALL', 'JUNCTION', 'ROAD', 'SENSOR', 'SIGNAL', 'COUNT'].map((flt) => (
            <button
              key={flt}
              onClick={() => setSelectedFilter(flt)}
              className={`px-2 py-0.5 rounded-lg font-bold transition cursor-pointer ${
                selectedFilter === flt
                  ? 'bg-cyan-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {flt}
            </button>
          ))}
        </div>

        {/* Zoom & Simulation Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
            className="p-1.5 rounded-lg bg-black/80 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
            className="p-1.5 rounded-lg bg-black/80 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              isSimulating
                ? 'bg-cyan-950 border-cyan-500/40 text-cyan-300'
                : 'bg-black/80 border-slate-800 text-slate-400'
            }`}
            title="Pause/Play physics"
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 rounded-lg bg-black/80 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Reset Zoom & Pan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Graph Canvas */}
      <div className="relative w-full h-[420px] bg-[#050811] rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={420}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />

        {/* Floating Interactive Legend */}
        <div className="absolute bottom-2.5 left-2.5 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-300 flex flex-wrap items-center gap-3 pointer-events-none shadow-lg">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Junction
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Road
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Sensor / Cam
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Count
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Signal
          </span>
        </div>

        {/* Zoom % Indicator */}
        <div className="absolute bottom-2.5 right-2.5 bg-black/85 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-800 text-[9px] font-mono text-slate-400 pointer-events-none">
          Zoom: {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
};

