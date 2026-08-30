import React, { useEffect, useRef } from 'react';
import { TrafficSimulationEngine } from '../../utils/simulationEngine';
import { Sparkles, Eye } from 'lucide-react';

interface TrafficSimulationViewProps {
  engine: TrafficSimulationEngine;
}

export const TrafficSimulationView: React.FC<TrafficSimulationViewProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    engine.bindCanvas(canvas);

    return () => {
      engine.unbindCanvas();
    };
  }, [engine]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    engine.handleCanvasClick(e.clientX, e.clientY, rect);
  };

  return (
    <div className="relative w-full max-w-[640px] rounded-3xl overflow-hidden border-2 border-slate-800/90 bg-[#090e1a] shadow-2xl flex flex-col items-center justify-center p-2">
      {/* 640x640 Canvas (Responsive CSS scaling) */}
      <canvas
        ref={canvasRef}
        width={640}
        height={640}
        onClick={handleCanvasClick}
        className="w-full aspect-square block cursor-pointer rounded-2xl shadow-inner"
        title="Click any road approach (North, South, East, West) to switch it to GREEN!"
      />

      {/* Floating Interactive Hint Overlay */}
      <div className="absolute top-4 right-4 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-lg pointer-events-none">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span>Click any approach to trigger Green</span>
      </div>
    </div>
  );
};
