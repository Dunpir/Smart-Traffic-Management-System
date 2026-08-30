"use client";

import React, { useEffect, useRef, useState } from "react";

export interface TrafficHeroSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  trafficDensity?: number;
  speed?: number;
  emergencyActive?: boolean;
  glowIntensity?: number;
  theme?: "cyber-emerald" | "amber-pulse" | "midnight-traffic" | "green-corridor";
  children?: React.ReactNode;
}

interface Vehicle {
  x: number;
  y: number;
  lane: number;
  speed: number;
  targetSpeed: number;
  color: string;
  glowColor: string;
  length: number;
  type: "car" | "truck" | "ambulance" | "bus";
  trail: { x: number; y: number }[];
  stopped: boolean;
}

interface IntersectionNode {
  x: number;
  y: number;
  name: string;
  signalState: "GREEN" | "YELLOW" | "RED";
  timer: number;
  pulseRadius: number;
  connections: number[];
}

export const TrafficHeroSection: React.FC<TrafficHeroSectionProps> = ({
  trafficDensity = 1.2,
  speed = 1.0,
  emergencyActive = false,
  glowIntensity = 1.0,
  theme = "midnight-traffic",
  className = "",
  children,
  ...rest
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeKpi, setActiveKpi] = useState({
    avgSpeed: 42,
    flowRate: 1840,
    greenEfficiency: 94.2,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = container.clientWidth || window.innerWidth);
    let height = (canvas.height = container.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!container || !canvas) return;
      width = canvas.width = container.clientWidth || window.innerWidth;
      height = canvas.height = container.clientHeight || window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Color palette based on theme
    const colors = {
      carLightForward: "#ffffff",
      carGlowForward: "rgba(255, 255, 255, 0.7)",
      carLightBackward: "#ef4444",
      carGlowBackward: "rgba(239, 68, 68, 0.8)",
      amberLight: "#f59e0b",
      amberGlow: "rgba(245, 158, 11, 0.8)",
      cyanLight: "#06b6d4",
      cyanGlow: "rgba(6, 182, 212, 0.85)",
      emeraldLight: "#10b981",
      emeraldGlow: "rgba(16, 185, 129, 0.85)",
      roadFill: "#0a1120",
      roadBorder: "rgba(30, 58, 138, 0.35)",
      laneLine: "rgba(255, 255, 255, 0.12)",
      gridLine: "rgba(14, 165, 233, 0.05)",
      bg: "#050811",
    };

    // Arterial road paths
    const lanes: {
      startX: number;
      startY: number;
      cp1x: number;
      cp1y: number;
      cp2x: number;
      cp2y: number;
      endX: number;
      endY: number;
      direction: 1 | -1;
      width: number;
    }[] = [];

    const setupRoads = () => {
      lanes.length = 0;
      // Main Highway Curve (Left-Bottom to Right-Top)
      lanes.push({
        startX: -50,
        startY: height * 0.75,
        cp1x: width * 0.35,
        cp1y: height * 0.7,
        cp2x: width * 0.65,
        cp2y: height * 0.3,
        endX: width + 50,
        endY: height * 0.25,
        direction: 1,
        width: 48,
      });

      // Opposite Bound Highway Curve
      lanes.push({
        startX: width + 50,
        startY: height * 0.22,
        cp1x: width * 0.65,
        cp1y: height * 0.27,
        cp2x: width * 0.35,
        cp2y: height * 0.67,
        endX: -50,
        endY: height * 0.72,
        direction: -1,
        width: 48,
      });

      // Diagonal Cross-Corridor (Top-Left to Bottom-Right)
      lanes.push({
        startX: width * 0.15,
        startY: -50,
        cp1x: width * 0.3,
        cp1y: height * 0.4,
        cp2x: width * 0.6,
        cp2y: height * 0.6,
        endX: width * 0.9,
        endY: height + 50,
        direction: 1,
        width: 38,
      });

      // Arterial Loop (Bottom-Center to Right-Middle)
      lanes.push({
        startX: width * 0.4,
        startY: height + 50,
        cp1x: width * 0.5,
        cp1y: height * 0.5,
        cp2x: width * 0.8,
        cp2y: height * 0.45,
        endX: width + 50,
        endY: height * 0.65,
        direction: 1,
        width: 32,
      });
    };

    setupRoads();

    // Vehicles Setup
    const vehicles: {
      laneIndex: number;
      t: number;
      speed: number;
      length: number;
      isEmergency: boolean;
      color: string;
      glowColor: string;
      headlightColor: string;
      trail: { x: number; y: number }[];
    }[] = [];

    const vehicleCount = Math.round(55 * trafficDensity);

    for (let i = 0; i < vehicleCount; i++) {
      const laneIndex = i % 4;
      const isEmergency = i === 3 || i === 18;
      const isForward = laneIndex % 2 === 0;

      vehicles.push({
        laneIndex,
        t: Math.random(),
        speed: (0.0012 + Math.random() * 0.0018) * speed * (isEmergency ? 1.8 : 1),
        length: isEmergency ? 18 : 8 + Math.random() * 14,
        isEmergency,
        color: isEmergency
          ? "#38bdf8"
          : isForward
          ? "#f8fafc"
          : "#ef4444",
        glowColor: isEmergency
          ? "rgba(56, 189, 248, 0.9)"
          : isForward
          ? "rgba(255, 255, 255, 0.8)"
          : "rgba(239, 68, 68, 0.8)",
        headlightColor: isForward ? "#fed7aa" : "#ef4444",
        trail: [],
      });
    }

    // Smart Junction Telemetry Nodes
    const nodes: IntersectionNode[] = [
      {
        x: width * 0.38,
        y: height * 0.58,
        name: "Central Plaza (J-001)",
        signalState: "GREEN",
        timer: 24,
        pulseRadius: 0,
        connections: [1, 2],
      },
      {
        x: width * 0.62,
        y: height * 0.36,
        name: "Connaught Corridor (CP-02)",
        signalState: "GREEN",
        timer: 18,
        pulseRadius: 8,
        connections: [0, 2],
      },
      {
        x: width * 0.78,
        y: height * 0.62,
        name: "Expressway Ring (EX-04)",
        signalState: "YELLOW",
        timer: 5,
        pulseRadius: 16,
        connections: [0, 1],
      },
    ];

    // Helper for cubic Bezier point calculation
    const getBezierPoint = (
      t: number,
      p0: number,
      p1: number,
      p2: number,
      p3: number
    ) => {
      const cX = 3 * (p1 - p0);
      const bX = 3 * (p2 - p1) - cX;
      const aX = p3 - p0 - cX - bX;
      return aX * (t * t * t) + bX * (t * t) + cX * t + p0;
    };

    // Helper for tangent angle on bezier curve
    const getBezierAngle = (
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
      const dx =
        3 * (1 - t) * (1 - t) * (x1 - x0) +
        6 * (1 - t) * t * (x2 - x1) +
        3 * t * t * (x3 - x2);
      const dy =
        3 * (1 - t) * (1 - t) * (y1 - y0) +
        6 * (1 - t) * t * (y2 - y1) +
        3 * t * t * (y3 - y2);
      return Math.atan2(dy, dx);
    };

    let tick = 0;

    // Main Render Loop
    const render = () => {
      tick++;

      // Background with radial depth
      const grad = ctx.createRadialGradient(
        width * 0.7,
        height * 0.4,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      );
      grad.addColorStop(0, "#0a1324");
      grad.addColorStop(0.5, "#060914");
      grad.addColorStop(1, "#020409");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Cyber Grid Lines (Perspective Smart City Grid)
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 1;
      const gridSize = 48;

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
      lanes.forEach((lane) => {
        // Road surface outer glow
        ctx.strokeStyle = "rgba(14, 165, 233, 0.06)";
        ctx.lineWidth = lane.width + 24;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(lane.startX, lane.startY);
        ctx.bezierCurveTo(lane.cp1x, lane.cp1y, lane.cp2x, lane.cp2y, lane.endX, lane.endY);
        ctx.stroke();

        // Asphalt Dark Core
        ctx.strokeStyle = colors.roadFill;
        ctx.lineWidth = lane.width;
        ctx.stroke();

        // Road Borders (Neon Edge Guides)
        ctx.strokeStyle = colors.roadBorder;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dashed Center Divider
        ctx.strokeStyle = colors.laneLine;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([12, 16]);
        ctx.lineDashOffset = -tick * 0.8 * speed;
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash
      });

      // Draw Graph Corridors Between Junction Nodes (Green Wave Links)
      nodes.forEach((node) => {
        node.connections.forEach((targetIdx) => {
          const target = nodes[targetIdx];
          if (!target) return;

          ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 8]);
          ctx.lineDashOffset = -tick * 1.2;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      });

      // Update & Render Flowing Vehicles with Light Streaks
      vehicles.forEach((veh) => {
        const lane = lanes[veh.laneIndex];
        if (!lane) return;

        veh.t += veh.speed;
        if (veh.t > 1) {
          veh.t = 0;
          veh.trail = [];
        }

        const px = getBezierPoint(veh.t, lane.startX, lane.cp1x, lane.cp2x, lane.endX);
        const py = getBezierPoint(veh.t, lane.startY, lane.cp1y, lane.cp2y, lane.endY);
        const angle = getBezierAngle(
          veh.t,
          lane.startX,
          lane.startY,
          lane.cp1x,
          lane.cp1y,
          lane.cp2x,
          lane.cp2y,
          lane.endX,
          lane.endY
        );

        // Store trail positions
        veh.trail.push({ x: px, y: py });
        if (veh.trail.length > (veh.isEmergency ? 24 : 14)) {
          veh.trail.shift();
        }

        // Draw Light Streak (Long exposure vehicle trail effect)
        if (veh.trail.length > 2) {
          ctx.beginPath();
          ctx.moveTo(veh.trail[0].x, veh.trail[0].y);
          for (let k = 1; k < veh.trail.length; k++) {
            ctx.lineTo(veh.trail[k].x, veh.trail[k].y);
          }
          ctx.strokeStyle = veh.glowColor;
          ctx.lineWidth = veh.isEmergency ? 3.5 : 2;
          ctx.lineCap = "round";
          ctx.stroke();
        }

        // Draw Vehicle Body Capsule
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle);

        // Emergency Light Flashing (Red / Blue Strobe)
        if (veh.isEmergency) {
          const isBlue = Math.floor(tick / 8) % 2 === 0;
          ctx.fillStyle = isBlue ? "#00e5ff" : "#ff1744";
          ctx.shadowColor = isBlue ? "#00e5ff" : "#ff1744";
          ctx.shadowBlur = 18 * glowIntensity;
        } else {
          ctx.fillStyle = veh.color;
          ctx.shadowColor = veh.glowColor;
          ctx.shadowBlur = 10 * glowIntensity;
        }

        ctx.fillRect(-veh.length / 2, -2.5, veh.length, 5);

        // Headlight Beams Cone
        const isForward = lane.direction === 1;
        const beamColor = isForward
          ? "rgba(254, 215, 170, 0.2)"
          : "rgba(239, 68, 68, 0.25)";

        ctx.fillStyle = beamColor;
        ctx.beginPath();
        ctx.moveTo(veh.length / 2, 0);
        ctx.lineTo(veh.length / 2 + 28, -9);
        ctx.lineTo(veh.length / 2 + 28, 9);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      });

      // Render Junction Signal Radar Beacons
      nodes.forEach((node, idx) => {
        node.pulseRadius = (node.pulseRadius + 0.4) % 36;
        const alpha = Math.max(0, 1 - node.pulseRadius / 36);

        // Radar Sweep Ring
        ctx.strokeStyle =
          node.signalState === "GREEN"
            ? `rgba(16, 185, 129, ${alpha * 0.8})`
            : node.signalState === "YELLOW"
            ? `rgba(245, 158, 11, ${alpha * 0.8})`
            : `rgba(239, 68, 68, ${alpha * 0.8})`;

        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.pulseRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Junction Core Dot
        ctx.fillStyle =
          node.signalState === "GREEN"
            ? "#10b981"
            : node.signalState === "YELLOW"
            ? "#f59e0b"
            : "#ef4444";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 16 * glowIntensity;

        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Junction Pin Label
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.font = "bold 10px ui-monospace, SFMono-Regular, monospace";
        ctx.fillText(node.name, node.x + 12, node.y - 4);

        ctx.fillStyle = "#38bdf8";
        ctx.font = "9px ui-monospace, SFMono-Regular, monospace";
        ctx.fillText(`STATUS: ${node.signalState} (DENSITY: 88%)`, node.x + 12, node.y + 9);
      });

      // Dark Vignette & Edge Shadow for Maximum Headline Contrast
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.35,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      vignette.addColorStop(0, "rgba(5, 8, 17, 0)");
      vignette.addColorStop(0.65, "rgba(5, 8, 17, 0.45)");
      vignette.addColorStop(1, "rgba(5, 8, 17, 0.95)");

      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      // Left Scrim Gradient for Crisp Typography Legibility
      const leftScrim = ctx.createLinearGradient(0, 0, width * 0.65, 0);
      leftScrim.addColorStop(0, "rgba(5, 8, 17, 0.94)");
      leftScrim.addColorStop(0.5, "rgba(5, 8, 17, 0.7)");
      leftScrim.addColorStop(1, "rgba(5, 8, 17, 0)");

      ctx.fillStyle = leftScrim;
      ctx.fillRect(0, 0, width * 0.65, height);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [trafficDensity, speed, emergencyActive, glowIntensity, theme]);

  return (
    <div
      ref={containerRef}
      className={`relative isolate min-h-screen w-full overflow-hidden bg-[#050811] ${className}`}
      {...rest}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full block pointer-events-none"
      />
      {children ? (
        <div className="relative z-10 h-full min-h-screen w-full flex flex-col">{children}</div>
      ) : null}
    </div>
  );
};

export default TrafficHeroSection;
