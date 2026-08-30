import React, { useEffect, useRef } from 'react';

interface TrafficAmbientBackgroundProps {
  intensity?: number;
  speed?: number;
  variant?: 'cyber' | 'light' | 'midnight';
}

export const TrafficAmbientBackground: React.FC<TrafficAmbientBackgroundProps> = ({
  intensity = 1.0,
  speed = 1.0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number = 0;
    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;

    // Multi-lane Arterial Highway paths
    const roads: {
      startX: number;
      startY: number;
      cp1x: number;
      cp1y: number;
      cp2x: number;
      cp2y: number;
      endX: number;
      endY: number;
      width: number;
      direction: 1 | -1;
    }[] = [];

    const buildRoads = () => {
      roads.length = 0;
      const w = width;
      const h = height;

      // 1. Main Arterial Highway West -> East
      roads.push({
        startX: -60,
        startY: h * 0.78,
        cp1x: w * 0.3,
        cp1y: h * 0.72,
        cp2x: w * 0.7,
        cp2y: h * 0.28,
        endX: w + 60,
        endY: h * 0.22,
        width: 44,
        direction: 1,
      });

      // 2. East -> West Returning Highway
      roads.push({
        startX: w + 60,
        startY: h * 0.2,
        cp1x: w * 0.7,
        cp1y: h * 0.26,
        cp2x: w * 0.3,
        cp2y: h * 0.7,
        endX: -60,
        endY: h * 0.76,
        width: 44,
        direction: -1,
      });

      // 3. Diagonal North-West -> South-East Arterial
      roads.push({
        startX: w * 0.1,
        startY: -60,
        cp1x: w * 0.25,
        cp1y: h * 0.45,
        cp2x: w * 0.65,
        cp2y: h * 0.55,
        endX: w * 0.95,
        endY: h + 60,
        width: 36,
        direction: 1,
      });

      // 4. Secondary Cross Connector
      roads.push({
        startX: w * 0.35,
        startY: h + 60,
        cp1x: w * 0.45,
        cp1y: h * 0.45,
        cp2x: w * 0.8,
        cp2y: h * 0.4,
        endX: w + 60,
        endY: h * 0.6,
        width: 30,
        direction: 1,
      });
    };

    // Vehicles with light trails
    const vehicles: {
      roadIdx: number;
      t: number;
      speed: number;
      length: number;
      isEmergency: boolean;
      color: string;
      glow: string;
      trail: { x: number; y: number }[];
    }[] = [];

    const initVehicles = () => {
      vehicles.length = 0;
      const count = 52;
      for (let i = 0; i < count; i++) {
        const roadIdx = i % Math.max(roads.length, 1);
        const isEmergency = i === 2 || i === 16 || i === 34;
        const isForward = roadIdx % 2 === 0;

        vehicles.push({
          roadIdx,
          t: Math.random(),
          speed: (0.0012 + Math.random() * 0.002) * speed * (isEmergency ? 1.9 : 1),
          length: isEmergency ? 16 : 8 + Math.random() * 10,
          isEmergency,
          color: isEmergency ? '#38bdf8' : isForward ? '#ffffff' : '#ef4444',
          glow: isEmergency
            ? 'rgba(56, 189, 248, 0.95)'
            : isForward
            ? 'rgba(254, 215, 170, 0.85)'
            : 'rgba(239, 68, 68, 0.85)',
          trail: [],
        });
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      dpr = window.devicePixelRatio || 1;
      width = window.innerWidth || document.documentElement.clientWidth || 1200;
      height = window.innerHeight || document.documentElement.clientHeight || 800;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      buildRoads();
      if (vehicles.length === 0) {
        initVehicles();
      }
    };

    handleResize();
    initVehicles();
    window.addEventListener('resize', handleResize);

    // Smart Junction Nodes
    const junctions = [
      { x: 0.36, y: 0.62, name: 'J001 Central', timer: 0 },
      { x: 0.64, y: 0.32, name: 'CP02 Connaught', timer: 120 },
      { x: 0.82, y: 0.58, name: 'EX04 Ring', timer: 240 },
    ];

    const getBezier = (t: number, p0: number, p1: number, p2: number, p3: number) => {
      const c = 3 * (p1 - p0);
      const b = 3 * (p2 - p1) - c;
      const a = p3 - p0 - c - b;
      return a * t * t * t + b * t * t + c * t + p0;
    };

    const getAngle = (
      t: number,
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      x3: number,
      y3: number
    ) => {
      const dx = 3 * (1 - t) * (1 - t) * (x1 - x0) + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (x3 - x2);
      const dy = 3 * (1 - t) * (1 - t) * (y1 - y0) + 6 * (1 - t) * t * (y2 - y1) + 3 * t * t * (y3 - y2);
      return Math.atan2(dy, dx);
    };

    let tick = 0;
    let isRunning = true;

    const render = () => {
      if (!isRunning) return;
      tick++;

      try {
        if (width <= 0 || height <= 0) {
          handleResize();
        }

        // 1. Deep Cyber Background Gradient
        const radius = Math.max(width, height, 400) * 0.8;
        const bgGrad = ctx.createRadialGradient(
          width * 0.6,
          height * 0.35,
          20,
          width * 0.5,
          height * 0.5,
          radius
        );
        bgGrad.addColorStop(0, '#0a1424');
        bgGrad.addColorStop(0.45, '#050a14');
        bgGrad.addColorStop(1, '#020408');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // 2. High-Tech Grid Coordinates
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
        ctx.lineWidth = 1;
        const gridSize = 44;
        ctx.beginPath();
        for (let x = 0; x < width; x += gridSize) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();

        // 3. Draw Arterial Road Beds
        roads.forEach((road) => {
          // Outer Highway Glow
          ctx.strokeStyle = 'rgba(14, 165, 233, 0.06)';
          ctx.lineWidth = road.width + 20;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(road.startX, road.startY);
          ctx.bezierCurveTo(road.cp1x, road.cp1y, road.cp2x, road.cp2y, road.endX, road.endY);
          ctx.stroke();

          // Asphalt Dark Core
          ctx.strokeStyle = '#050c18';
          ctx.lineWidth = road.width;
          ctx.stroke();

          // Neon Lane Borders
          ctx.strokeStyle = 'rgba(14, 165, 233, 0.28)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Dashed Lane Center Line (animated dash movement)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([12, 14]);
          ctx.lineDashOffset = -tick * 0.8 * speed;
          ctx.stroke();
          ctx.setLineDash([]);
        });

        // 4. Green Wave Connection Links Between Junctions
        for (let i = 0; i < junctions.length; i++) {
          for (let j = i + 1; j < junctions.length; j++) {
            const jA = junctions[i];
            const jB = junctions[j];
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.22)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 8]);
            ctx.lineDashOffset = -tick * 0.9;
            ctx.beginPath();
            ctx.moveTo(jA.x * width, jA.y * height);
            ctx.lineTo(jB.x * width, jB.y * height);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        // 5. Update & Render Moving Vehicles
        vehicles.forEach((veh) => {
          const road = roads[veh.roadIdx];
          if (!road) return;

          veh.t += veh.speed;
          if (veh.t > 1) {
            veh.t = 0;
            veh.trail = [];
          }

          const px = getBezier(veh.t, road.startX, road.cp1x, road.cp2x, road.endX);
          const py = getBezier(veh.t, road.startY, road.cp1y, road.cp2y, road.endY);
          const angle = getAngle(
            veh.t,
            road.startX,
            road.startY,
            road.cp1x,
            road.cp1y,
            road.cp2x,
            road.cp2y,
            road.endX,
            road.endY
          );

          veh.trail.push({ x: px, y: py });
          if (veh.trail.length > (veh.isEmergency ? 20 : 12)) {
            veh.trail.shift();
          }

          // Draw Trail Streak
          if (veh.trail.length > 2) {
            ctx.beginPath();
            ctx.moveTo(veh.trail[0].x, veh.trail[0].y);
            for (let k = 1; k < veh.trail.length; k++) {
              ctx.lineTo(veh.trail[k].x, veh.trail[k].y);
            }
            ctx.strokeStyle = veh.glow;
            ctx.lineWidth = veh.isEmergency ? 3 : 2;
            ctx.lineCap = 'round';
            ctx.stroke();
          }

          // Draw Vehicle Body
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(angle);

          if (veh.isEmergency) {
            const isBlue = Math.floor(tick / 8) % 2 === 0;
            ctx.fillStyle = isBlue ? '#00e5ff' : '#ff1744';
            ctx.shadowColor = isBlue ? '#00e5ff' : '#ff1744';
            ctx.shadowBlur = 14 * intensity;
          } else {
            ctx.fillStyle = veh.color;
            ctx.shadowColor = veh.glow;
            ctx.shadowBlur = 8 * intensity;
          }

          ctx.fillRect(-veh.length / 2, -2.5, veh.length, 5);

          // Headlight Beams
          const beamColor =
            road.direction === 1
              ? 'rgba(254, 215, 170, 0.22)'
              : 'rgba(239, 68, 68, 0.25)';
          ctx.fillStyle = beamColor;
          ctx.beginPath();
          ctx.moveTo(veh.length / 2, 0);
          ctx.lineTo(veh.length / 2 + 24, -8);
          ctx.lineTo(veh.length / 2 + 24, 8);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        });

        // 6. Render Junction Radar Pulses
        junctions.forEach((j) => {
          const jx = j.x * width;
          const jy = j.y * height;
          const pulse = ((tick + j.timer) * 0.4) % 36;
          const alpha = Math.max(0, 1 - pulse / 36);

          // Radar Ripple Ring
          ctx.strokeStyle = `rgba(16, 185, 129, ${alpha * 0.8})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(jx, jy, pulse, 0, Math.PI * 2);
          ctx.stroke();

          // Node Center
          ctx.fillStyle = '#10b981';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 12 * intensity;
          ctx.beginPath();
          ctx.arc(jx, jy, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Label
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.font = 'bold 10px ui-monospace, monospace';
          ctx.fillText(j.name, jx + 10, jy - 3);
        });
      } catch (err) {
        console.warn('TrafficAmbientBackground render cycle caught error:', err);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [intensity, speed]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      {/* Soft Ambient Overlay for Optimal Card Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#060b14]/20 to-[#060b14]/50 pointer-events-none" />
    </div>
  );
};
