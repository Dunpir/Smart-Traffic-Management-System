import React, { useEffect, useRef } from 'react';

interface TrafficAmbientBackgroundProps {
  intensity?: number;
  speed?: number;
  variant?: 'cyber' | 'light' | 'midnight';
}

export const TrafficAmbientBackground: React.FC<TrafficAmbientBackgroundProps> = ({
  intensity = 1.0,
  speed = 1.0,
  variant = 'cyber',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      buildRoads();
    };

    window.addEventListener('resize', onResize);

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
      // Main Highway West to East
      roads.push({
        startX: -60,
        startY: height * 0.8,
        cp1x: width * 0.3,
        cp1y: height * 0.75,
        cp2x: width * 0.7,
        cp2y: height * 0.25,
        endX: width + 60,
        endY: height * 0.2,
        width: 44,
        direction: 1,
      });

      // East to West Returning Highway
      roads.push({
        startX: width + 60,
        startY: height * 0.18,
        cp1x: width * 0.7,
        cp1y: height * 0.23,
        cp2x: width * 0.3,
        cp2y: height * 0.73,
        endX: -60,
        endY: height * 0.78,
        width: 44,
        direction: -1,
      });

      // Diagonal North-West to South-East Arterial
      roads.push({
        startX: width * 0.1,
        startY: -60,
        cp1x: width * 0.25,
        cp1y: height * 0.45,
        cp2x: width * 0.65,
        cp2y: height * 0.55,
        endX: width * 0.95,
        endY: height + 60,
        width: 36,
        direction: 1,
      });

      // Secondary Cross Connector
      roads.push({
        startX: width * 0.35,
        startY: height + 60,
        cp1x: width * 0.45,
        cp1y: height * 0.45,
        cp2x: width * 0.8,
        cp2y: height * 0.4,
        endX: width + 60,
        endY: height * 0.6,
        width: 30,
        direction: 1,
      });
    };

    buildRoads();

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

    const count = 48;
    for (let i = 0; i < count; i++) {
      const roadIdx = i % roads.length;
      const isEmergency = i === 2 || i === 14;
      const isForward = roadIdx % 2 === 0;

      vehicles.push({
        roadIdx,
        t: Math.random(),
        speed: (0.001 + Math.random() * 0.0016) * speed * (isEmergency ? 1.8 : 1),
        length: isEmergency ? 16 : 8 + Math.random() * 10,
        isEmergency,
        color: isEmergency ? '#38bdf8' : isForward ? '#ffffff' : '#ef4444',
        glow: isEmergency
          ? 'rgba(56, 189, 248, 0.9)'
          : isForward
          ? 'rgba(254, 215, 170, 0.75)'
          : 'rgba(239, 68, 68, 0.8)',
        trail: [],
      });
    }

    // Smart Junction Nodes
    const junctions = [
      { x: 0.36, y: 0.62, name: 'J001 Central', state: 'GREEN', timer: 0 },
      { x: 0.64, y: 0.32, name: 'CP02 Connaught', state: 'GREEN', timer: 120 },
      { x: 0.82, y: 0.58, name: 'EX04 Ring', state: 'YELLOW', timer: 240 },
    ];

    const getBezier = (t: number, p0: number, p1: number, p2: number, p3: number) => {
      const c = 3 * (p1 - p0);
      const b = 3 * (p2 - p1) - c;
      const a = p3 - p0 - c - b;
      return a * t * t * t + b * t * t + c * t + p0;
    };

    const getAngle = (t: number, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
      const dx = 3 * (1 - t) * (1 - t) * (x1 - x0) + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (x3 - x2);
      const dy = 3 * (1 - t) * (1 - t) * (y1 - y0) + 6 * (1 - t) * t * (y2 - y1) + 3 * t * t * (y3 - y2);
      return Math.atan2(dy, dx);
    };

    let tick = 0;

    const render = () => {
      tick++;

      // Background Tone
      const bgGrad = ctx.createRadialGradient(
        width * 0.6,
        height * 0.35,
        100,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.8
      );
      bgGrad.addColorStop(0, '#0c1626');
      bgGrad.addColorStop(0.5, '#070d18');
      bgGrad.addColorStop(1, '#03060c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Smart Grid Coordinates
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.04)';
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

      // Draw Arterial Road Beds
      roads.forEach((road) => {
        // Outer Highway Glow
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.05)';
        ctx.lineWidth = road.width + 20;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(road.startX, road.startY);
        ctx.bezierCurveTo(road.cp1x, road.cp1y, road.cp2x, road.cp2y, road.endX, road.endY);
        ctx.stroke();

        // Asphalt Dark Core
        ctx.strokeStyle = '#08101e';
        ctx.lineWidth = road.width;
        ctx.stroke();

        // Neon Lane Borders
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.22)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Dashed Lane Center Line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([10, 14]);
        ctx.lineDashOffset = -tick * 0.7 * speed;
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Green Wave Connection Links Between Junctions
      for (let i = 0; i < junctions.length; i++) {
        for (let j = i + 1; j < junctions.length; j++) {
          const jA = junctions[i];
          const jB = junctions[j];
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.18)';
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

      // Update & Render Moving Vehicles
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
          ctx.lineWidth = veh.isEmergency ? 3 : 1.8;
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

        ctx.fillRect(-veh.length / 2, -2, veh.length, 4);

        // Headlight Beams
        const beamColor =
          road.direction === 1
            ? 'rgba(254, 215, 170, 0.18)'
            : 'rgba(239, 68, 68, 0.2)';
        ctx.fillStyle = beamColor;
        ctx.beginPath();
        ctx.moveTo(veh.length / 2, 0);
        ctx.lineTo(veh.length / 2 + 22, -7);
        ctx.lineTo(veh.length / 2 + 22, 7);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      });

      // Render Junction Radar Pulses
      junctions.forEach((j) => {
        const jx = j.x * width;
        const jy = j.y * height;
        const pulse = ((tick + j.timer) * 0.35) % 32;
        const alpha = Math.max(0, 1 - pulse / 32);

        // Radar Ripple Ring
        ctx.strokeStyle = `rgba(16, 185, 129, ${alpha * 0.7})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(jx, jy, pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Node Center
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 12 * intensity;
        ctx.beginPath();
        ctx.arc(jx, jy, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = 'bold 9px ui-monospace, monospace';
        ctx.fillText(j.name, jx + 10, jy - 3);
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, [intensity, speed, variant]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Soft Ambient Overlay for Optimal Card Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060b14]/70 via-[#060b14]/50 to-[#060b14]/80 backdrop-blur-[1.5px]" />
    </div>
  );
};
