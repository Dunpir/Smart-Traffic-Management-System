import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, Eye, Camera, Video, ShieldCheck, Zap, Sliders, Play, Pause } from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';

interface CctvMatrixWallModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDirection: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
}

interface CameraFeedConfig {
  id: string;
  road: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
  name: string;
  location: string;
  resolution: string;
  fps: number;
}

const CAMERAS: CameraFeedConfig[] = [
  { id: 'CAM-01', road: 'NORTH', name: 'North Arterial Boulevard', location: 'Approach R001 (Gate 1)', resolution: '3840x2160 (4K)', fps: 60 },
  { id: 'CAM-02', road: 'SOUTH', name: 'South Flyover Junction', location: 'Approach R002 (Gate 2)', resolution: '3840x2160 (4K)', fps: 60 },
  { id: 'CAM-03', road: 'EAST', name: 'East Transit Metro Hub', location: 'Approach R003 (Gate 3)', resolution: '3840x2160 (4K)', fps: 60 },
  { id: 'CAM-04', road: 'WEST', name: 'West Commercial Ring', location: 'Approach R004 (Gate 4)', resolution: '3840x2160 (4K)', fps: 60 },
];

export const CctvMatrixWallModal: React.FC<CctvMatrixWallModalProps> = ({
  isOpen,
  onClose,
  activeDirection,
}) => {
  const [selectedCam, setSelectedCam] = useState<string | null>(null);
  const [isNightVision, setIsNightVision] = useState<boolean>(false);
  const [showAiBoxes, setShowAiBoxes] = useState<boolean>(true);
  const [showRadar, setShowRadar] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl cursor-pointer overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl bg-[#080e1a] text-white rounded-3xl p-5 sm:p-6 shadow-2xl border-2 border-blue-500/40 cursor-default my-auto space-y-4"
      >
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase tracking-wider text-white">
                  Metropolitan CCTV 4-Screen Matrix Wall
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>4 CHANNELS SYNCED</span>
                </span>
              </div>
              <p className="text-[11px] text-blue-300 font-mono">
                AI Vision Model: YOLOv8-Traffic • OCR Engine: Indian HSRP High-Precision ANPR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* FLIR Night Vision Toggle */}
            <button
              onClick={() => {
                soundEffects.playClick();
                setIsNightVision(!isNightVision);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isNightVision
                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
                  : 'bg-white/5 border-white/15 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>FLIR Night Vision</span>
            </button>

            {/* AI Bounding Boxes Toggle */}
            <button
              onClick={() => {
                soundEffects.playClick();
                setShowAiBoxes(!showAiBoxes);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                showAiBoxes
                  ? 'bg-blue-600/30 border-blue-400 text-blue-300'
                  : 'bg-white/5 border-white/15 text-slate-300 hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AI Bounding Boxes</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* 2x2 CCTV Feeds Grid */}
        <div
          className={`grid gap-3.5 ${
            selectedCam ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
          }`}
        >
          {CAMERAS.filter((cam) => (selectedCam ? cam.id === selectedCam : true)).map((cam) => {
            const isActiveGreen = activeDirection === cam.road;

            return (
              <div
                key={cam.id}
                className={`relative rounded-2xl overflow-hidden border-2 bg-black aspect-video flex flex-col justify-between p-3 transition shadow-lg ${
                  isActiveGreen ? 'border-emerald-500 shadow-emerald-500/10' : 'border-white/15'
                } ${isNightVision ? 'filter hue-rotate-90 contrast-125' : ''}`}
              >
                {/* Simulated Camera Video Feed Layer */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center pointer-events-none">
                  {/* Road Canvas Visual Mock */}
                  <div className="w-full h-full relative overflow-hidden opacity-60">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-20 bg-slate-800 border-y border-dashed border-white/30" />
                    {/* Simulated Vehicles Passing */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-10 w-24 h-12 rounded-lg bg-blue-600/80 border border-blue-300 animate-pulse flex items-center justify-center text-[10px] font-bold">
                      SEDAN
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 right-20 w-36 h-14 rounded-lg bg-emerald-600/80 border border-emerald-300 flex items-center justify-center text-[10px] font-bold">
                      EV-BUS
                    </div>
                  </div>
                </div>

                {/* AI Bounding Boxes Simulation Overlay */}
                {showAiBoxes && (
                  <div className="absolute inset-0 pointer-events-none p-6">
                    {/* Box 1 */}
                    <div className="absolute top-12 left-16 w-36 h-24 border-2 border-emerald-400 bg-emerald-500/10 rounded-sm">
                      <span className="absolute -top-5 left-0 px-1.5 py-0.5 bg-emerald-600 text-white font-mono text-[9px] font-bold rounded-xs shadow-xs">
                        CAR 98.4% • 42 km/h
                      </span>
                      <span className="absolute -bottom-5 left-0 px-1.5 py-0.5 bg-black/80 text-emerald-300 font-mono text-[9px] font-bold rounded-xs">
                        DL 01 AB 7842
                      </span>
                    </div>

                    {/* Box 2 */}
                    <div className="absolute bottom-12 right-24 w-44 h-28 border-2 border-blue-400 bg-blue-500/10 rounded-sm">
                      <span className="absolute -top-5 left-0 px-1.5 py-0.5 bg-blue-600 text-white font-mono text-[9px] font-bold rounded-xs shadow-xs">
                        BUS 96.1% • 35 km/h
                      </span>
                      <span className="absolute -bottom-5 left-0 px-1.5 py-0.5 bg-black/80 text-blue-300 font-mono text-[9px] font-bold rounded-xs">
                        DL 1P C 9920
                      </span>
                    </div>
                  </div>
                )}

                {/* Top Video OSD (On-Screen Display) */}
                <div className="relative z-10 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                    <span className="font-bold text-white tracking-wider">{cam.id} [{cam.road}]</span>
                    <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px]">{cam.resolution}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isActiveGreen ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] animate-pulse">
                        ● GREEN PHASE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/80 text-white font-bold text-[10px]">
                        ● RED HOLD
                      </span>
                    )}

                    {/* Maximize / Minimize Button */}
                    <button
                      onClick={() => {
                        soundEffects.playClick();
                        setSelectedCam(selectedCam ? null : cam.id);
                      }}
                      className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                      title={selectedCam ? 'Show 4-Split Grid' : 'Maximize Feed'}
                    >
                      {selectedCam ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Bottom Video OSD */}
                <div className="relative z-10 flex items-end justify-between text-xs font-mono">
                  <div>
                    <div className="font-bold text-slate-200">{cam.name}</div>
                    <div className="text-[10px] text-slate-400">{cam.location}</div>
                  </div>

                  <div className="text-right text-[10px] text-emerald-400 font-bold">
                    <span>LIVE 60 FPS • BITRATE 14.2 Mbps</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
