import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { GraphNode, GraphLink } from '../../types';

interface InteractiveGraphCanvasProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onSelectNode: (node: GraphNode | null) => void;
  selectedNode: GraphNode | null;
}

export const InteractiveGraphCanvas: React.FC<InteractiveGraphCanvasProps> = ({
  nodes: initialNodes,
  links: initialLinks,
  onSelectNode,
  selectedNode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const draggingNodeRef = useRef<GraphNode | null>(null);

  // Initialize nodes with positions in a circular/force layout
  useEffect(() => {
    if (!initialNodes || initialNodes.length === 0) {
      // Fallback sample graph if backend returns empty
      const sampleNodes: GraphNode[] = [
        { id: 'J001', label: 'Junction', name: 'Central Junction', group: 'Junction', properties: { junctionId: 'J001', location: 'Grand Ave & Tech Blvd', lanes: 4 } },
        { id: 'R_NORTH', label: 'Road', name: 'North Road', group: 'Road', properties: { roadId: 'R01', direction: 'NORTH', speedLimit: 50 } },
        { id: 'R_SOUTH', label: 'Road', name: 'South Road', group: 'Road', properties: { roadId: 'R02', direction: 'SOUTH', speedLimit: 50 } },
        { id: 'R_EAST', label: 'Road', name: 'East Road', group: 'Road', properties: { roadId: 'R03', direction: 'EAST', speedLimit: 60 } },
        { id: 'R_WEST', label: 'Road', name: 'West Road', group: 'Road', properties: { roadId: 'R04', direction: 'WEST', speedLimit: 50 } },
        { id: 'CAM_01', label: 'Camera', name: 'Optical Cam N1', group: 'Sensor', properties: { sensorId: 'CAM_N', resolution: '1080p', fps: 30 } },
        { id: 'IR_01', label: 'IRSensor', name: 'Stopline IR N1', group: 'Sensor', properties: { sensorId: 'IR_N', pin: 'A0', rangeCm: 450 } },
        { id: 'VC_01', label: 'VehicleCount', name: 'Density Telemetry', group: 'VehicleCount', properties: { count: 32, density: 'HIGH' } },
        { id: 'EMG_01', label: 'EmergencyEvent', name: 'Ambulance Unit A-14', group: 'EmergencyEvent', properties: { priority: 'CRITICAL', vehicle: 'AMBULANCE' } },
        { id: 'SIG_01', label: 'Signal', name: '12-Ch LED Head', group: 'Signal', properties: { currentSignal: 'GREEN', pins: 'D2-D4' } },
      ];

      const sampleLinks: GraphLink[] = [
        { source: 'J001', target: 'R_NORTH', type: 'HAS_ROAD' },
        { source: 'J001', target: 'R_SOUTH', type: 'HAS_ROAD' },
        { source: 'J001', target: 'R_EAST', type: 'HAS_ROAD' },
        { source: 'J001', target: 'R_WEST', type: 'HAS_ROAD' },
        { source: 'R_NORTH', target: 'CAM_01', type: 'HAS_CAMERA' },
        { source: 'R_NORTH', target: 'IR_01', type: 'HAS_IR_SENSOR' },
        { source: 'R_NORTH', target: 'VC_01', type: 'RECORDED_AT' },
        { source: 'R_NORTH', target: 'SIG_01', type: 'CONTROLS_SIGNAL' },
        { source: 'J001', target: 'EMG_01', type: 'ACTIVE_EMERGENCY' },
      ];

      setupLayout(sampleNodes, sampleLinks);
    } else {
      setupLayout(initialNodes, initialLinks);
    }
  }, [initialNodes, initialLinks]);

  const setupLayout = (rawNodes: GraphNode[], rawLinks: GraphLink[]) => {
    const width = 600;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;

    const initializedNodes = rawNodes.map((node, i) => {
      const angle = (i / rawNodes.length) * 2 * Math.PI;
      const radius = node.group === 'Junction' ? 0 : 120 + (i % 3) * 40;
      return {
        ...node,
        x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 20,
        y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
      };
    });

    setNodes(initializedNodes);
    setLinks(rawLinks);
  };

  // Color mapping based on Neo4j Node label
  const getNodeColor = (group: string) => {
    switch (group) {
      case 'Junction':
        return '#06b6d4'; // Cyan
      case 'Road':
        return '#3b82f6'; // Blue
      case 'Sensor':
      case 'Camera':
      case 'IRSensor':
        return '#ef4444'; // Red
      case 'VehicleCount':
        return '#eab308'; // Amber
      case 'EmergencyEvent':
        return '#f43f5e'; // Rose
      case 'Signal':
        return '#10b981'; // Emerald
      default:
        return '#64748b'; // Slate
    }
  };

  // Canvas render and physics tick
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Physics update step
      if (isSimulating && nodes.length > 0) {
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // Node repulsion
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = (nodes[j].x || 0) - (nodes[i].x || 0);
            const dy = (nodes[j].y || 0) - (nodes[i].y || 0);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (dist < 180) {
              const force = (180 - dist) / dist * 0.08;
              nodes[i].vx = (nodes[i].vx || 0) - dx * force;
              nodes[i].vy = (nodes[i].vy || 0) - dy * force;
              nodes[j].vx = (nodes[j].vx || 0) + dx * force;
              nodes[j].vy = (nodes[j].vy || 0) + dy * force;
            }
          }

          // Center gravitational pull
          const cdx = centerX - (nodes[i].x || 0);
          const cdy = centerY - (nodes[i].y || 0);
          nodes[i].vx = (nodes[i].vx || 0) + cdx * 0.003;
          nodes[i].vy = (nodes[i].vy || 0) + cdy * 0.003;

          // Apply velocity with damping
          if (draggingNodeRef.current?.id !== nodes[i].id) {
            nodes[i].x = Math.max(30, Math.min(width - 30, (nodes[i].x || 0) + (nodes[i].vx || 0)));
            nodes[i].y = Math.max(30, Math.min(height - 30, (nodes[i].y || 0) + (nodes[i].vy || 0)));
          }

          nodes[i].vx = (nodes[i].vx || 0) * 0.88;
          nodes[i].vy = (nodes[i].vy || 0) * 0.88;
        }
      }

      // 2. Draw Edges
      links.forEach((link) => {
        const sourceNode = nodes.find((n) => n.id === link.source || n.id === link.source?.id);
        const targetNode = nodes.find((n) => n.id === link.target || n.id === link.target?.id);

        if (sourceNode && targetNode && sourceNode.x && sourceNode.y && targetNode.x && targetNode.y) {
          ctx.beginPath();
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.strokeStyle =
            hoveredNode?.id === sourceNode.id || hoveredNode?.id === targetNode.id
              ? '#06b6d4'
              : 'rgba(51, 65, 85, 0.4)';
          ctx.lineWidth =
            hoveredNode?.id === sourceNode.id || hoveredNode?.id === targetNode.id ? 2 : 1;
          ctx.stroke();

          // Draw relationship type text
          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;
          ctx.font = '8px monospace';
          ctx.fillStyle = '#64748b';
          ctx.textAlign = 'center';
          ctx.fillText(link.type, midX, midY - 3);
        }
      });

      // 3. Draw Nodes
      nodes.forEach((node) => {
        if (!node.x || !node.y) return;

        const isFiltered =
          selectedFilter !== 'ALL' &&
          node.group.toUpperCase() !== selectedFilter.toUpperCase() &&
          node.label.toUpperCase() !== selectedFilter.toUpperCase();

        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode?.id === node.id;
        const color = getNodeColor(node.group || node.label);

        ctx.save();
        ctx.globalAlpha = isFiltered ? 0.2 : 1.0;

        // Outer glow on hover/selection
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 22, 0, 2 * Math.PI);
          ctx.fillStyle = color + '33';
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Inner Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.group === 'Junction' ? 18 : 14, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#0a0f1d';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Node Label Text
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(node.name || String(node.id), node.x, node.y + 26);

        // Group Tag
        ctx.font = '8px monospace';
        ctx.fillStyle = color;
        ctx.fillText(`:${node.label || node.group}`, node.x, node.y + 36);

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [nodes, links, isSimulating, selectedFilter, selectedNode, hoveredNode]);

  // Mouse Handlers for Dragging and Selection
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const clickedNode = nodes.find((n) => {
      const dx = (n.x || 0) - mouseX;
      const dy = (n.y || 0) - mouseY;
      return Math.sqrt(dx * dx + dy * dy) < 20;
    });

    if (clickedNode) {
      draggingNodeRef.current = clickedNode;
      onSelectNode(clickedNode);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (draggingNodeRef.current) {
      draggingNodeRef.current.x = mouseX;
      draggingNodeRef.current.y = mouseY;
    } else {
      const hoverNode = nodes.find((n) => {
        const dx = (n.x || 0) - mouseX;
        const dy = (n.y || 0) - mouseY;
        return Math.sqrt(dx * dx + dy * dy) < 20;
      });
      setHoveredNode(hoverNode || null);
    }
  };

  const handleMouseUp = () => {
    draggingNodeRef.current = null;
  };

  return (
    <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-[#090e1a]/95 flex flex-col gap-3">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide">
              Interactive Force-Directed Neo4j Graph Canvas
            </h3>
            <p className="text-[10px] font-mono text-slate-400">
              Drag nodes • Click node to inspect properties • Physics simulation
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
          {['ALL', 'JUNCTION', 'ROAD', 'SENSOR', 'VEHICLECOUNT', 'EMERGENCYEVENT'].map((flt) => (
            <button
              key={flt}
              onClick={() => setSelectedFilter(flt)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                selectedFilter === flt
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {flt}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`p-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-1 ${
              isSimulating
                ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle physics simulation"
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setupLayout(initialNodes, initialLinks)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Reset layout"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full h-[380px] bg-[#050811] rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={380}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-300 flex flex-wrap items-center gap-3 pointer-events-none">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Junction
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Road
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Sensor / Cam
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> VehicleCount
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Emergency
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Signal
          </span>
        </div>
      </div>
    </div>
  );
};
