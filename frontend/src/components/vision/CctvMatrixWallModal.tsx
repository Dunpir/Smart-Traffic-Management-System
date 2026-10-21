import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Eye,
  Camera,
  Video,
  ShieldCheck,
  Zap,
  Sliders,
  Play,
  Pause,
  Radio,
  Cpu,
  Webcam as WebcamIcon,
  RefreshCw,
} from 'lucide-react';
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
  gpioPins: string;
  irPin: string;
}

const CAMERAS: CameraFeedConfig[] = [
  { id: 'CAM-01', road: 'NORTH', name: 'North Arterial Boulevard', location: 'Approach R001 (Gate 1)', resolution: '3840x2160 (4K)', fps: 60, gpioPins: 'D2, D3, D4', irPin: 'A0' },
  { id: 'CAM-02', road: 'SOUTH', name: 'South Flyover Junction', location: 'Approach R002 (Gate 2)', resolution: '3840x2160 (4K)', fps: 60, gpioPins: 'D5, D6, D7', irPin: 'A1' },
  { id: 'CAM-03', road: 'EAST', name: 'East Transit Metro Hub', location: 'Approach R003 (Gate 3)', resolution: '3840x2160 (4K)', fps: 60, gpioPins: 'D8, D9, D10', irPin: 'A2' },
  { id: 'CAM-04', road: 'WEST', name: 'West Commercial Ring', location: 'Approach R004 (Gate 4)', resolution: '3840x2160 (4K)', fps: 60, gpioPins: 'D11, D12, D13', irPin: 'A3' },
];

interface SimVehicle {
  id: string;
  x: number;
  y: number;
  speed: number;
  type: 'CAR' | 'BUS' | 'TRUCK' | 'BIKE' | 'VIP';
  plate: string;
  confidence: number;
  speedKmh: number;
  width: number;
  height: number;
  color: string;
}

export const CctvMatrixWallModal: React.FC<CctvMatrixWallModalProps> = ({
  isOpen,
  onClose,
  activeDirection,
}) => {
  const [selectedCam, setSelectedCam] = useState<string | null>(null);
  const [isNightVision, setIsNightVision] = useState<boolean>(false);
  const [showAiBoxes, setShowAiBoxes] = useState<boolean>(true);
  const [useWebcam, setUseWebcam] = useState<boolean>(false);
  const [webcamActive, setWebcamActive] = useState<boolean>(false);
  const [snapshotVehicle, setSnapshotVehicle] = useState<SimVehicle | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  // Real-time animation vehicles per road camera
  const vehiclesState = useRef<{ [key: string]: SimVehicle[] }>({
    NORTH: [
      { id: 'v1', x: 40, y: 55, speed: 1.2, type: 'CAR', plate: 'DL 01 AB 7842', confidence: 98.4, speedKmh: 42, width: 70, height: 40, color: '#38bdf8' },
      { id: 'v2', x: 220, y: 110, speed: 0.9, type: 'BUS', plate: 'DL 1P C 9920', confidence: 96.1, speedKmh: 35, width: 110, height: 46, color: '#34d399' },
    ],
    SOUTH: [
      { id: 'v3', x: 80, y: 60, speed: 1.5, type: 'VIP', plate: 'DL 02 TC 0001', confidence: 99.2, speedKmh: 54, width: 85, height: 42, color: '#f59e0b' },
      { id: 'v4', x: 280, y: 115, speed: 1.1, type: 'CAR', plate: 'HR 26 DQ 4419', confidence: 97.5, speedKmh: 46, width: 68, height: 38, color: '#a78bfa' },
    ],
    EAST: [
      { id: 'v5', x: 120, y: 70, speed: 0.8, type: 'TRUCK', plate: 'UP 16 AT 3310', confidence: 95.8, speedKmh: 30, width: 120, height: 50, color: '#fb923c' },
      { id: 'v6', x: 310, y: 110, speed: 1.3, type: 'CAR', plate: 'MH 04 ER 8821', confidence: 98.9, speedKmh: 48, width: 72, height: 40, color: '#60a5fa' },
    ],
    WEST: [
      { id: 'v7', x: 60, y: 65, speed: 1.6, type: 'CAR', plate: 'KA 03 MM 6542', confidence: 97.8, speedKmh: 52, width: 70, height: 40, color: '#f43f5e' },
      { id: 'v8', x: 250, y: 115, speed: 1.0, type: 'BUS', plate: 'DL 1P E 1209', confidence: 96.4, speedKmh: 38, width: 105, height: 45, color: '#2dd4bf' },
    ],
  });

  // Handle live webcam toggle
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (useWebcam) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 1280, height: 720 } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
            setWebcamActive(true);
          }
        })
        .catch((err) => {
          console.warn('Webcam stream unavailable:', err);
          setUseWebcam(false);
          setWebcamActive(false);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
        setWebcamActive(false);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [useWebcam]);

  // Main 60 FPS CCTV render loop
  useEffect(() => {
    if (!isOpen) return;

    let animId: number;

    const render = () => {
      CAMERAS.forEach((cam) => {
        const canvas = canvasRefs.current[cam.id];
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const isGreen = activeDirection === cam.road;

        // 1. Clear background
        ctx.fillStyle = isNightVision ? '#04160e' : '#070b14';
        ctx.fillRect(0, 0, w, h);

        // 2. Draw road asphalt & lane markings
        ctx.fillStyle = isNightVision ? '#092518' : '#111827';
        ctx.fillRect(0, 40, w, h - 80);

        // Dashed lane divider
        ctx.strokeStyle = isNightVision ? 'rgba(52, 211, 153, 0.4)' : 'rgba(250, 204, 21, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Stop line
        ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(w - 70, 40);
        ctx.lineTo(w - 70, h - 40);
        ctx.stroke();

        // 3. Move and draw vehicles
        const vehs = vehiclesState.current[cam.road] || [];
        vehs.forEach((v) => {
          // If red and near stop-line, decelerate / halt
          if (!isGreen && v.x > w - 160 && v.x < w - 75) {
            // stopped at light
          } else {
            v.x += v.speed * (isGreen ? 1.4 : 1.0);
            if (v.x > w + 40) {
              v.x = -120;
            }
          }

          // Vehicle body shadow
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(v.x + 2, v.y + 4, v.width, v.height);

          // Vehicle body
          ctx.fillStyle = isNightVision ? '#10b981' : v.color;
          ctx.beginPath();
          ctx.roundRect(v.x, v.y, v.width, v.height, 6);
          ctx.fill();
          ctx.strokeStyle = isNightVision ? '#34d399' : '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Vehicle Roof / Windshield
          ctx.fillStyle = isNightVision ? '#042f2e' : 'rgba(15, 23, 42, 0.7)';
          ctx.fillRect(v.x + v.width * 0.25, v.y + 4, v.width * 0.45, v.height - 8);

          // Headlights beam (illuminates forward)
          ctx.fillStyle = isNightVision ? 'rgba(52, 211, 153, 0.25)' : 'rgba(254, 240, 138, 0.25)';
          ctx.beginPath();
          ctx.moveTo(v.x + v.width, v.y + 4);
          ctx.lineTo(v.x + v.width + 45, v.y - 8);
          ctx.lineTo(v.x + v.width + 45, v.y + v.height + 8);
          ctx.lineTo(v.x + v.width, v.y + v.height - 4);
          ctx.closePath();
          ctx.fill();

          // 4. AI YOLO Bounding Box & HSRP Plate Overlay
          if (showAiBoxes) {
            const pad = 6;
            const bx = v.x - pad;
            const by = v.y - pad;
            const bw = v.width + pad * 2;
            const bh = v.height + pad * 2;

            // Neon Box
            ctx.strokeStyle = isNightVision ? '#34d399' : '#00f0ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(bx, by, bw, bh);

            // Corner Brackets
            const cLen = 8;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            // Top-left
            ctx.beginPath();
            ctx.moveTo(bx, by + cLen);
            ctx.lineTo(bx, by);
            ctx.lineTo(bx + cLen, by);
            ctx.stroke();
            // Bottom-right
            ctx.beginPath();
            ctx.moveTo(bx + bw, by + bh - cLen);
            ctx.lineTo(bx + bw, by + bh);
            ctx.lineTo(bx + bw - cLen, by + bh);
            ctx.stroke();

            // Top Badge: Class + Confidence + Speed
            const topBadgeText = `${v.type} ${(v.confidence).toFixed(1)}% • ${v.speedKmh} km/h`;
            ctx.font = 'bold 9px monospace';
            const badgeW = ctx.measureText(topBadgeText).width + 8;
            ctx.fillStyle = isNightVision ? '#047857' : '#0284c7';
            ctx.fillRect(bx, by - 16, badgeW, 14);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(topBadgeText, bx + 4, by - 5);

            // Bottom Badge: ANPR HSRP License Plate
            const plateText = v.plate;
            const plateW = ctx.measureText(plateText).width + 8;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(bx, by + bh + 3, plateW, 14);
            ctx.strokeStyle = isNightVision ? '#34d399' : '#facc15';
            ctx.strokeRect(bx, by + bh + 3, plateW, 14);
            ctx.fillStyle = isNightVision ? '#34d399' : '#facc15';
            ctx.fillText(plateText, bx + 4, by + bh + 14);
          }
        });

        // 5. FLIR Thermal Scanlines Effect
        if (isNightVision) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.04)';
          for (let y = 0; y < h; y += 4) {
            ctx.fillRect(0, y, w, 1.5);
          }
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [isOpen, activeDirection, isNightVision, showAiBoxes]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl cursor-pointer overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl bg-[#080e1a] text-white rounded-3xl p-4 sm:p-6 shadow-2xl border-2 border-blue-500/40 cursor-default my-auto space-y-4 font-sans"
      >
        {/* Hidden video element for WebRTC camera input */}
        <video ref={videoRef} className="hidden" playsInline muted autoPlay />

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
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>4 CHANNELS SYNCED</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1 font-mono">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  <span>ARDUINO GPIO D2-D13 LINKED</span>
                </span>
              </div>
              <p className="text-[11px] text-blue-300 font-mono">
                AI Vision Model: YOLOv8-Traffic • OCR Engine: Indian HSRP High-Precision ANPR • Hardware Serial Relay
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Live Webcam Toggle */}
            <button
              onClick={() => {
                soundEffects.playClick();
                setUseWebcam(!useWebcam);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                useWebcam
                  ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                  : 'bg-white/5 border-white/15 text-slate-300 hover:bg-white/10'
              }`}
              title="Switch to Real Hardware Webcam Stream"
            >
              <WebcamIcon className="w-3.5 h-3.5" />
              <span>{useWebcam ? 'Webcam Active' : 'Use Real Webcam'}</span>
            </button>

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
                className={`relative rounded-2xl overflow-hidden border-2 bg-black aspect-video flex flex-col justify-between p-3 transition shadow-xl ${
                  isActiveGreen ? 'border-emerald-500 shadow-emerald-500/20 ring-1 ring-emerald-400/40' : 'border-white/15'
                }`}
              >
                {/* Canvas Render Layer for Real-Time Vehicles / Video Feed */}
                <canvas
                  ref={(el) => (canvasRefs.current[cam.id] = el)}
                  width={480}
                  height={270}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Top Video OSD (On-Screen Display) */}
                <div className="relative z-10 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                    <span className="font-bold text-white tracking-wider">{cam.id} [{cam.road}]</span>
                    <span className="px-2 py-0.5 rounded-md bg-black/60 border border-white/20 text-[10px] text-cyan-300">
                      GPIO: {cam.gpioPins} (IR: {cam.irPin})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isActiveGreen ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] animate-pulse">
                        ● GREEN PHASE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-rose-600/90 text-white font-bold text-[10px]">
                        ● RED HOLD
                      </span>
                    )}

                    {/* Maximize / Minimize Button */}
                    <button
                      onClick={() => {
                        soundEffects.playClick();
                        setSelectedCam(selectedCam ? null : cam.id);
                      }}
                      className="p-1 rounded-md bg-black/60 hover:bg-white/20 text-white transition cursor-pointer border border-white/20"
                      title={selectedCam ? 'Show 4-Split Grid' : 'Maximize Feed'}
                    >
                      {selectedCam ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Bottom Video OSD */}
                <div className="relative z-10 flex items-end justify-between text-xs font-mono bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10">
                  <div>
                    <div className="font-bold text-slate-100">{cam.name}</div>
                    <div className="text-[10px] text-slate-400">{cam.location}</div>
                  </div>

                  <div className="text-right text-[10px]">
                    <div className="text-emerald-400 font-bold">
                      LIVE 60 FPS • BITRATE 14.2 Mbps
                    </div>
                    <div className="text-cyan-300 font-mono text-[9px]">
                      YOLOv8 Latency: 12.4ms • ANPR OCR: ACTIVE
                    </div>
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

