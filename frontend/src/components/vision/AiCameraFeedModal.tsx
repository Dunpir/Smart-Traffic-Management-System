import React, { useState, useEffect } from 'react';
import {
  Camera,
  X,
  Radio,
  Eye,
  CloudRain,
  Sun,
  CloudFog,
  Moon,
  Zap,
  Activity,
  Layers,
  Cpu,
  ShieldAlert,
  Car,
  Truck,
  Bus,
  RefreshCw,
} from 'lucide-react';
import { Direction, WeatherCondition, CameraBoundingBox } from '../../types';

interface AiCameraFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDirection?: Direction;
}

export const AiCameraFeedModal: React.FC<AiCameraFeedModalProps> = ({
  isOpen,
  onClose,
  initialDirection = 'NORTH',
}) => {
  const [activeDirection, setActiveDirection] = useState<Direction>(initialDirection);
  const [weather, setWeather] = useState<WeatherCondition>('CLEAR');
  const [fps, setFps] = useState<number>(30);
  const [latency, setLatency] = useState<number>(14);

  // Simulated bounding boxes moving dynamically
  const [boxes, setBoxes] = useState<CameraBoundingBox[]>([
    { id: 'b1', label: 'CAR', confidence: 96, x: 28, y: 35, w: 18, h: 22, speed: 44, lane: 1 },
    { id: 'b2', label: 'BUS', confidence: 92, x: 60, y: 55, w: 24, h: 32, speed: 32, lane: 2 },
    { id: 'b3', label: 'CAR', confidence: 95, x: 22, y: 70, w: 20, h: 24, speed: 41, lane: 1 },
    { id: 'b4', label: 'MOTORCYCLE', confidence: 88, x: 74, y: 25, w: 12, h: 16, speed: 48, lane: 2 },
  ]);

  // Jitter and vehicle movement simulation
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      // Small FPS/latency jitter
      setFps(Math.floor(29 + Math.random() * 2));
      setLatency(Math.floor(13 + Math.random() * 3));

      // Move bounding boxes down the road
      setBoxes((prev) =>
        prev.map((box) => {
          let nextY = box.y + (box.speed / 20);
          if (nextY > 85) nextY = 15;
          return {
            ...box,
            y: parseFloat(nextY.toFixed(1)),
            confidence: Math.min(
              99,
              Math.max(
                75,
                box.confidence + (Math.random() > 0.5 ? 1 : -1) - (weather === 'RAIN' ? 6 : weather === 'FOG' ? 12 : 0)
              )
            ),
          };
        })
      );
    }, 400);

    return () => clearInterval(interval);
  }, [isOpen, weather]);

  if (!isOpen) return null;

  const getWeatherParams = () => {
    switch (weather) {
      case 'CLEAR':
        return {
          title: 'Nominal Daytime Clear',
          confidenceBonus: '100% Optical Clarity',
          friction: '1.0 (Dry Asphalt)',
          brakingDist: '24.5 meters',
          filterStyle: 'none',
        };
      case 'RAIN':
        return {
          title: 'Heavy Rain Storm',
          confidenceBonus: '-18% Optical Attenuation',
          friction: '0.65 (Wet Pavement)',
          brakingDist: '36.8 meters (+50% Safety Yellow)',
          filterStyle: 'backdrop-blur-[1px] brightness-90',
        };
      case 'FOG':
        return {
          title: 'Dense Fog & Low Contrast',
          confidenceBonus: '-32% Contrast Degradation',
          friction: '0.80 (Damp Surface)',
          brakingDist: '31.2 meters (IR Sensor Backup Active)',
          filterStyle: 'backdrop-blur-[3px] brightness-110 contrast-75',
        };
      case 'NIGHT_RUSH':
        return {
          title: 'Night Rush Hour (Headlight Glare Filter)',
          confidenceBonus: 'Adaptive IR High-Contrast Mode',
          friction: '0.95 (Cool Asphalt)',
          brakingDist: '26.0 meters',
          filterStyle: 'brightness-75 contrast-125',
        };
    }
  };

  const currentParams = getWeatherParams();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#080d1a] border border-cyan-500/30 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/90 border border-cyan-500/50 text-cyan-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Edge AI Optical Vision Stream & YOLO Detector
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE STREAM
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Neural Object Detection Feed: Camera Edge Unit #{activeDirection}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Direction & Weather Switcher Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          {/* 4 Approaches */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as Direction[]).map((dir) => (
              <button
                key={dir}
                onClick={() => setActiveDirection(dir)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeDirection === dir
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {dir} Approach
              </button>
            ))}
          </div>

          {/* Weather Simulator Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-[10px] text-slate-400 px-2">Environment:</span>
            {[
              { id: 'CLEAR', label: 'Clear', icon: Sun },
              { id: 'RAIN', label: 'Rain', icon: CloudRain },
              { id: 'FOG', label: 'Fog', icon: CloudFog },
              { id: 'NIGHT_RUSH', label: 'Night', icon: Moon },
            ].map((w) => {
              const Icon = w.icon;
              const isSelected = weather === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => setWeather(w.id as WeatherCondition)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{w.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Video Canvas & Optical HUD */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="relative aspect-video max-h-[460px] w-full rounded-2xl bg-black border-2 border-slate-800 overflow-hidden flex items-center justify-center group shadow-2xl">
            {/* Simulated Road Texture Background */}
            <div
              className={`absolute inset-0 bg-gradient-to-b from-[#10141f] via-[#0b0e17] to-[#151a28] flex items-center justify-center transition-all ${currentParams.filterStyle}`}
            >
              {/* Road Lanes */}
              <div className="w-2/3 h-full border-x-4 border-slate-600 relative overflow-hidden bg-[#0e121c]">
                {/* Dashed Center Stripe */}
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 border-r-2 border-dashed border-amber-400/50" />
                {/* Lane numbers */}
                <div className="absolute bottom-3 left-1/4 -translate-x-1/2 text-[10px] font-mono font-bold text-slate-600">
                  LANE 1
                </div>
                <div className="absolute bottom-3 right-1/4 translate-x-1/2 text-[10px] font-mono font-bold text-slate-600">
                  LANE 2
                </div>
              </div>

              {/* Rain particle overlay if rain */}
              {weather === 'RAIN' && (
                <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-25 animate-pulse" />
              )}
            </div>

            {/* Live Optical HUD Overlay */}
            <div className="absolute top-4 left-4 font-mono text-[11px] text-cyan-400 bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl border border-cyan-500/30 flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                REC 1080p
              </span>
              <span>•</span>
              <span>{fps} FPS</span>
              <span>•</span>
              <span>{latency}ms Latency</span>
              <span>•</span>
              <span className="text-white font-bold">YOLOv8-Traffic-Edge</span>
            </div>

            <div className="absolute top-4 right-4 font-mono text-[11px] text-slate-300 bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800">
              <span>Approach: </span>
              <strong className="text-cyan-400">{activeDirection} ROADWAY</strong>
            </div>

            {/* Simulated AI Object Bounding Boxes */}
            <div className="absolute inset-0 pointer-events-none">
              {boxes.map((box) => (
                <div
                  key={box.id}
                  className="absolute border-2 border-emerald-400 bg-emerald-500/10 rounded transition-all duration-300 flex flex-col justify-between p-1"
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.w}%`,
                    height: `${box.h}%`,
                  }}
                >
                  {/* Bounding Box Label Tag */}
                  <div className="bg-emerald-500 text-slate-950 text-[9px] font-mono font-black px-1.5 py-0.5 rounded -mt-3.5 -ml-1 self-start shadow flex items-center gap-1">
                    <span>{box.label}</span>
                    <span>{box.confidence}%</span>
                  </div>

                  {/* Speed Tag */}
                  <div className="bg-black/80 text-emerald-300 text-[8px] font-mono px-1 rounded self-end">
                    {box.speed} km/h
                  </div>
                </div>
              ))}
            </div>

            {/* Stop-Line Sensor Beam Overlay */}
            <div className="absolute bottom-16 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent border-t border-cyan-400/80 flex items-center justify-center">
              <span className="bg-black/90 text-cyan-400 text-[9px] font-mono px-2 py-0.5 rounded border border-cyan-500/50 -translate-y-1/2">
                IR STOP-LINE DETECTION THRESHOLD
              </span>
            </div>
          </div>

          {/* Environmental Adaptation Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[9px] font-mono text-slate-500 uppercase block">
                Condition Profile
              </span>
              <div className="text-xs font-bold text-white mt-0.5">{currentParams.title}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[9px] font-mono text-slate-500 uppercase block">
                Optical Attenuation
              </span>
              <div className="text-xs font-bold text-emerald-400 mt-0.5">
                {currentParams.confidenceBonus}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[9px] font-mono text-slate-500 uppercase block">
                Pavement Friction Multiplier
              </span>
              <div className="text-xs font-bold text-cyan-400 mt-0.5">{currentParams.friction}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[9px] font-mono text-slate-500 uppercase block">
                Safe Braking Distance
              </span>
              <div className="text-xs font-bold text-amber-400 mt-0.5">
                {currentParams.brakingDist}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
