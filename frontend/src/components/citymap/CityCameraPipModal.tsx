import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, ShieldAlert, Cpu, Eye, Radio, RefreshCw, ZoomIn } from 'lucide-react';
import { CityIntersectionNode } from '../../types';

interface CityCameraPipModalProps {
  node: CityIntersectionNode | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CityCameraPipModal: React.FC<CityCameraPipModalProps> = ({
  node,
  isOpen,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fps, setFps] = useState<number>(29.8);
  const [detectedCount, setDetectedCount] = useState<number>(node?.vehicleCount || 18);
  const [confidence, setConfidence] = useState<number>(97.4);

  useEffect(() => {
    if (!isOpen || !node) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    // Simulated bounding boxes moving on road
    const boxes = [
      { id: 'V1', type: 'Car', x: 80, y: 120, w: 75, h: 42, speed: 1.2, color: '#38bdf8', conf: '98.2%', plate: 'DL-03-CC-4190' },
      { id: 'V2', type: 'Bus', x: 220, y: 80, w: 120, h: 55, speed: 0.8, color: '#f59e0b', conf: '96.5%', plate: 'DL-01-P-8821' },
      { id: 'V3', type: 'SUV', x: 380, y: 140, w: 85, h: 46, speed: 1.4, color: '#34d399', conf: '99.1%', plate: 'HR-26-DK-1102' },
      { id: 'V4', type: 'Bike', x: 160, y: 180, w: 40, h: 28, speed: 1.6, color: '#a78bfa', conf: '94.8%', plate: 'DL-08-S-5532' },
      { id: 'V5', type: 'Auto', x: 490, y: 110, w: 55, h: 36, speed: 1.0, color: '#fbbf24', conf: '95.3%', plate: 'DL-1R-TA-7744' },
      { id: 'P1', type: 'Pedestrian', x: 40, y: 220, w: 22, h: 35, speed: 0.3, color: '#f43f5e', conf: '93.7%', plate: 'CROSSING' },
    ];

    const render = () => {
      t += 0.05;
      const w = canvas.width;
      const h = canvas.height;

      // Dark Asphalt CCTV Feed Surface
      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, w, h);

      // Perspective road grid lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.7)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + (x - w / 2) * 0.4, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 35) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Lane dividers
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.setLineDash([12, 10]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw moving simulated YOLO bounding boxes
      boxes.forEach((b) => {
        b.x += b.speed;
        if (b.x > w + 50) b.x = -100;

        // Bounding Box
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2;
        ctx.fillStyle = `${b.color}15`;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeRect(b.x, b.y, b.w, b.h);

        // Corner brackets
        const crn = 6;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Top-left
        ctx.moveTo(b.x, b.y + crn); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x + crn, b.y);
        // Top-right
        ctx.moveTo(b.x + b.w - crn, b.y); ctx.lineTo(b.x + b.w, b.y); ctx.lineTo(b.x + b.w, b.y + crn);
        // Bottom-left
        ctx.moveTo(b.x, b.y + b.h - crn); ctx.lineTo(b.x, b.y + b.h); ctx.lineTo(b.x + crn, b.y + b.h);
        // Bottom-right
        ctx.moveTo(b.x + b.w - crn, b.y + b.h); ctx.lineTo(b.x + b.w, b.y + b.h); ctx.lineTo(b.x + b.w, b.y + b.h - crn);
        ctx.stroke();

        // Label Tag
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y - 16, b.w > 65 ? b.w : 65, 15);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`${b.type} ${b.conf}`, b.x + 3, b.y - 4);

        // Plate Tag
        if (b.plate !== 'CROSSING') {
          ctx.fillStyle = 'rgba(0,0,0,0.75)';
          ctx.fillRect(b.x, b.y + b.h + 2, 74, 12);
          ctx.fillStyle = '#38bdf8';
          ctx.font = '8px monospace';
          ctx.fillText(`OCR: ${b.plate}`, b.x + 3, b.y + b.h + 11);
        }
      });

      // HUD Optical Scanline
      const scanY = (Math.sin(t) * 0.5 + 0.5) * h;
      const grad = ctx.createLinearGradient(0, scanY - 15, 0, scanY + 15);
      grad.addColorStop(0, 'rgba(34, 211, 238, 0)');
      grad.addColorStop(0.5, 'rgba(34, 211, 238, 0.25)');
      grad.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 15, w, 30);

      // HUD Crosshairs & Safe Zone
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(20, 20, w - 40, h - 40);

      // Corner Reticles
      const s = 14;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      // TL
      ctx.beginPath(); ctx.moveTo(20, 20 + s); ctx.lineTo(20, 20); ctx.lineTo(20 + s, 20); ctx.stroke();
      // TR
      ctx.beginPath(); ctx.moveTo(w - 20 - s, 20); ctx.lineTo(w - 20, 20); ctx.lineTo(w - 20, 20 + s); ctx.stroke();
      // BL
      ctx.beginPath(); ctx.moveTo(20, h - 20 - s); ctx.lineTo(20, h - 20); ctx.lineTo(20 + s, h - 20); ctx.stroke();
      // BR
      ctx.beginPath(); ctx.moveTo(w - 20 - s, h - 20); ctx.lineTo(w - 20, h - 20); ctx.lineTo(w - 20, h - 20 - s); ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();

    const fpsTimer = setInterval(() => {
      setFps(Number((29.2 + Math.random() * 1.4).toFixed(1)));
      setConfidence(Number((96.8 + Math.random() * 2.5).toFixed(1)));
    }, 1500);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(fpsTimer);
    };
  }, [isOpen, node]);

  if (!isOpen || !node) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/60 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
              <Camera className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  LIVE CCTV AI VISION STREAM
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-700 animate-pulse">
                  REC • LIVE
                </span>
              </div>
              <div className="text-[11px] font-mono text-cyan-400">
                {node.name} [{node.code}] — {node.locationName}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Canvas Feed */}
        <div className="relative bg-black aspect-[16/9] w-full overflow-hidden">
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="w-full h-full object-cover"
          />

          {/* Top-Left OSD Telemetry */}
          <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300 space-y-0.5 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-bold">MODEL:</span>
              <span>YOLOv8-TRAFFIC-METRO-v2.4</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">INFERENCE:</span>
              <span>12.4ms • {fps} FPS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">ACCURACY:</span>
              <span>{confidence}% mAP@0.5</span>
            </div>
          </div>

          {/* Top-Right Signal Phase OSD */}
          <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300 flex items-center gap-2 pointer-events-none">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                node.currentSignal === 'GREEN'
                  ? 'bg-emerald-400 shadow-md shadow-emerald-400'
                  : 'bg-rose-400 shadow-md shadow-rose-400'
              }`}
            />
            <span className="font-bold text-white">PHASE: {node.activeDirection}</span>
            <span className="text-cyan-400">({node.secondsRemaining || 18}s)</span>
          </div>

          {/* Bottom OSD Bar */}
          <div className="absolute bottom-3 inset-x-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-[10px] flex items-center justify-between text-slate-300 pointer-events-none">
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-bold">OBJECTS: {node.vehicleCount} DETECTED</span>
              <span>•</span>
              <span className="text-slate-400">LAT: {node.lat}° N, LNG: {node.lng}° E</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Eye className="w-3 h-3" />
              <span>EDGE AI COMPUTE ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Footer Metrics Breakdown */}
        <div className="grid grid-cols-4 p-3 bg-slate-900 border-t border-slate-800 text-center font-mono text-xs">
          <div className="border-r border-slate-800 pr-2">
            <div className="text-[10px] text-slate-500 uppercase">Live Density</div>
            <div className="text-white font-bold mt-0.5">{node.congestionLevel}</div>
          </div>
          <div className="border-r border-slate-800 px-2">
            <div className="text-[10px] text-slate-500 uppercase">Throughput</div>
            <div className="text-emerald-400 font-bold mt-0.5">{node.vehicleCount * 14} veh/hr</div>
          </div>
          <div className="border-r border-slate-800 px-2">
            <div className="text-[10px] text-slate-500 uppercase">Speed Index</div>
            <div className="text-cyan-400 font-bold mt-0.5">{node.speedKmh || 45} km/h</div>
          </div>
          <div className="pl-2">
            <div className="text-[10px] text-slate-500 uppercase">Pedestrians</div>
            <div className="text-amber-400 font-bold mt-0.5">{node.pedestrianWaiting || 6} in queue</div>
          </div>
        </div>
      </div>
    </div>
  );
};
