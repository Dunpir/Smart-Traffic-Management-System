import React, { useEffect, useRef, useState } from 'react';
import { TrafficSimulationEngine } from '../../utils/simulationEngine';
import {
  Sparkles,
  Sun,
  Moon,
  CloudRain,
  Eye,
  Radio,
  Flame,
  Footprints,
  Play,
  Pause,
  FastForward,
  Maximize2,
  Minimize2,
  Zap,
} from 'lucide-react';
import { SimulationTelemetryState, SimWeather } from '../../types/simulation';
import { soundEffects } from '../../utils/soundEffects';

interface TrafficSimulationViewProps {
  engine: TrafficSimulationEngine;
  state?: SimulationTelemetryState;
}

export const TrafficSimulationView: React.FC<TrafficSimulationViewProps> = ({
  engine,
  state: externalState,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const state = externalState || engine.getState();
  const weather = state.weather || 'NIGHT';
  const showRadar = state.showRadar ?? true;
  const showHeatmap = state.showHeatmap ?? false;
  const showBboxes = state.showCameraBboxes ?? true;
  const pedestrianActive = state.pedestrianActive ?? false;
  const pedestrianTimer = state.pedestrianTimeRemaining ?? 0;
  const simSpeed = state.simSpeed || 1;

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
    soundEffects.playClick();
    engine.handleCanvasClick(e.clientX, e.clientY, rect);
  };

  const handleSetWeather = (w: SimWeather) => {
    soundEffects.playClick();
    engine.setWeather(w);
  };

  const handleToggleRadar = () => {
    soundEffects.playClick();
    engine.toggleRadar();
  };

  const handleToggleHeatmap = () => {
    soundEffects.playClick();
    engine.toggleHeatmap();
  };

  const handleToggleBboxes = () => {
    soundEffects.playClick();
    engine.toggleCameraBboxes();
  };

  const handlePedestrianCall = () => {
    soundEffects.playVoiceAck();
    engine.triggerPedestrianCall();
  };

  const handleSetSpeed = (s: number) => {
    soundEffects.playClick();
    engine.setSimSpeed(s);
  };

  // Full Screen Toggle
  const handleToggleFullscreen = () => {
    soundEffects.playClick();
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    if (!document.fullscreenElement && !isFullscreen) {
      setIsFullscreen(true);
      if (wrapper.requestFullscreen) {
        wrapper.requestFullscreen().catch(() => {});
      }
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    const handleExternalToggle = () => {
      handleToggleFullscreen();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'KeyF') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.code === 'Escape' && isFullscreen) {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    window.addEventListener('trafix:sim:toggle-fullscreen', handleExternalToggle);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      window.removeEventListener('trafix:sim:toggle-fullscreen', handleExternalToggle);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Approach signal dots helper
  const getSignalDot = (dir: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST') => {
    const sig = state.signals?.[dir] || 'RED';
    if (sig === 'GREEN') return 'bg-emerald-400 shadow-[0_0_8px_#10b981]';
    if (sig === 'YELLOW') return 'bg-amber-400 shadow-[0_0_8px_#f59e0b]';
    return 'bg-rose-500 shadow-[0_0_8px_#f43f5e]';
  };

  return (
    <div
      ref={wrapperRef}
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-[99999] bg-slate-950 w-screen h-screen max-w-none justify-between items-center p-4'
          : 'relative w-full max-w-[640px] rounded-2xl border border-slate-700/80 bg-slate-950 shadow-2xl p-2 space-y-2'
      } overflow-hidden font-mono select-none flex flex-col`}
      style={
        isFullscreen
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 999999,
            }
          : undefined
      }
    >
      {/* Top Vision & Environment Tool Ribbon */}
      <div className="w-full flex flex-wrap items-center justify-between gap-1.5 px-2 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono">
        {/* Weather Controls */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold mr-1">Env:</span>
          <button
            onClick={() => handleSetWeather('DAY')}
            title="Sunny Daylight Mode"
            className={`px-2 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
              weather === 'DAY'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Day</span>
          </button>
          <button
            onClick={() => handleSetWeather('NIGHT')}
            title="Cyberpunk Night Mode with Dynamic Headlights"
            className={`px-2 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
              weather === 'NIGHT'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Night</span>
          </button>
          <button
            onClick={() => handleSetWeather('RAIN')}
            title="Monsoon Rain with Wet Asphalt Reflections"
            className={`px-2 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
              weather === 'RAIN'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rain</span>
          </button>
        </div>

        {/* AI Perception Overlays */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold mr-1">AI Vision:</span>
          <button
            onClick={handleToggleBboxes}
            title="Toggle YOLO Bounding Boxes"
            className={`px-2 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
              showBboxes
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-500 hover:text-white hover:bg-slate-800 line-through opacity-70'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>YOLO</span>
          </button>
          <button
            onClick={handleToggleRadar}
            title="Toggle Doppler Speed Radar Tags"
            className={`px-2 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
              showRadar
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-500 hover:text-white hover:bg-slate-800 line-through opacity-70'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Radar</span>
          </button>
          <button
            onClick={handleToggleHeatmap}
            title="Toggle Queue Density Heatmap"
            className={`px-2 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
              showHeatmap
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                : 'text-slate-500 hover:text-white hover:bg-slate-800 line-through opacity-70'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Heatmap</span>
          </button>
        </div>
      </div>

      {/* Main Simulation 640x640 Canvas Container */}
      <div className={`relative rounded-xl overflow-hidden border border-slate-800/90 bg-[#060911] ${
        isFullscreen
          ? 'flex-1 min-h-0 aspect-square max-h-[calc(100vh-140px)] w-auto flex items-center justify-center'
          : 'w-full aspect-square'
      }`}>
        <canvas
          ref={canvasRef}
          width={640}
          height={640}
          onClick={handleCanvasClick}
          className="w-full h-full block cursor-crosshair rounded-xl shadow-inner"
          title="Click any road approach (North, South, East, West) to switch it to GREEN!"
        />

        {/* 4 Interactive Road Approach Quick Indicators */}
        {/* North */}
        <button
          onClick={() => {
            soundEffects.playClick();
            engine.setManualDirection('NORTH');
          }}
          className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/80 hover:bg-black/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/80 text-[10px] font-mono text-white flex items-center gap-1.5 shadow-md cursor-pointer transition hover:scale-105"
          title="Click to force North approach Green"
        >
          <span className={`w-2 h-2 rounded-full ${getSignalDot('NORTH')}`} />
          <span className="font-bold">NORTH</span>
          <span className="text-slate-400">({state.cameraDetectionCounts?.NORTH || 0})</span>
        </button>

        {/* South */}
        <button
          onClick={() => {
            soundEffects.playClick();
            engine.setManualDirection('SOUTH');
          }}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 hover:bg-black/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/80 text-[10px] font-mono text-white flex items-center gap-1.5 shadow-md cursor-pointer transition hover:scale-105"
          title="Click to force South approach Green"
        >
          <span className={`w-2 h-2 rounded-full ${getSignalDot('SOUTH')}`} />
          <span className="font-bold">SOUTH</span>
          <span className="text-slate-400">({state.cameraDetectionCounts?.SOUTH || 0})</span>
        </button>

        {/* West */}
        <button
          onClick={() => {
            soundEffects.playClick();
            engine.setManualDirection('WEST');
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/80 hover:bg-black/95 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-700/80 text-[10px] font-mono text-white flex items-center gap-1.5 shadow-md cursor-pointer transition hover:scale-105"
          title="Click to force West approach Green"
        >
          <span className={`w-2 h-2 rounded-full ${getSignalDot('WEST')}`} />
          <span className="font-bold">WEST</span>
          <span className="text-slate-400">({state.cameraDetectionCounts?.WEST || 0})</span>
        </button>

        {/* East */}
        <button
          onClick={() => {
            soundEffects.playClick();
            engine.setManualDirection('EAST');
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/80 hover:bg-black/95 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-700/80 text-[10px] font-mono text-white flex items-center gap-1.5 shadow-md cursor-pointer transition hover:scale-105"
          title="Click to force East approach Green"
        >
          <span className={`w-2 h-2 rounded-full ${getSignalDot('EAST')}`} />
          <span className="font-bold">EAST</span>
          <span className="text-slate-400">({state.cameraDetectionCounts?.EAST || 0})</span>
        </button>

        {/* Live Pedestrian Crossing Badge overlay if active */}
        {pedestrianActive && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-emerald-950/90 border border-emerald-500 text-emerald-300 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-mono font-bold animate-bounce shadow-xl">
            <Footprints className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>PEDESTRIAN WALK ACTIVE ({Math.ceil(pedestrianTimer)}s)</span>
          </div>
        )}

        {/* Subtle Canvas Hint */}
        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-mono text-slate-400 pointer-events-none">
          Click quadrant to switch phase
        </div>
      </div>

      {/* Bottom Controls Bar: Pedestrian Button + Speed Multipliers */}
      <div className="w-full flex items-center justify-between gap-2 px-1 pt-1 font-mono text-xs">
        {/* Pedestrian Actuator Button */}
        <button
          onClick={handlePedestrianCall}
          className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
            pedestrianActive
              ? 'bg-emerald-600 text-white border-emerald-400 animate-pulse'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-cyan-500'
          }`}
          title="Actuate Pedestrian Demand Button for Safe Zebra Crossing"
        >
          <Footprints className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-[11px]">
            {pedestrianActive ? `Crossing Active (${Math.ceil(pedestrianTimer)}s)` : 'Call Pedestrian Phase'}
          </span>
        </button>

        {/* Simulation Speed Pills */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <span className="text-[10px] text-slate-500 uppercase px-1.5 font-bold">Speed:</span>
          {[1, 2, 4].map((spd) => (
            <button
              key={spd}
              onClick={() => handleSetSpeed(spd)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                simSpeed === spd
                  ? 'bg-cyan-500 text-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Clean Black Exit Fullscreen Button */}
      {isFullscreen && (
        <button
          onClick={handleToggleFullscreen}
          className="absolute top-3 right-3 z-30 bg-black/90 hover:bg-neutral-900 text-white border border-neutral-800 px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer shadow-xl transition"
          title="Exit Full Screen (ESC)"
        >
          <Minimize2 className="w-3.5 h-3.5 text-neutral-300" />
          <span>Exit Full Screen</span>
        </button>
      )}
    </div>
  );
};

