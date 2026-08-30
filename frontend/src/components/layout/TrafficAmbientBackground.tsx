import React, { useEffect, useRef } from 'react';

export const TrafficAmbientBackground: React.FC = () => {
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

    // Elegant, subtle arterial road curves
    const paths: {
      startX: number;
      startY: number;
      cp1x: number;
      cp1y: number;
      cp2x: number;
      cp2y: number;
      endX: number;
      endY: number;
    }[] = [];

    const buildPaths = () => {
      paths.length = 0;
      const w = width;
      const h = height;

      // Soft diagonal arterial 1
      paths.push({
        startX: -40,
        startY: h * 0.75,
        cp1x: w * 0.35,
        cp1y: h * 0.7,
        cp2x: w * 0.65,
        cp2y: h * 0.3,
        endX: w + 40,
        endY: h * 0.25,
      });

      // Soft diagonal arterial 2 (opposite flow)
      paths.push({
        startX: w + 40,
        startY: h * 0.2,
        cp1x: w * 0.65,
        cp1y: h * 0.25,
        cp2x: w * 0.35,
        cp2y: h * 0.65,
        endX: -40,
        endY: h * 0.7,
      });

      // Secondary subtle cross connector
      paths.push({
        startX: w * 0.15,
        startY: -40,
        cp1x: w * 0.3,
        cp1y: h * 0.45,
        cp2x: w * 0.7,
        cp2y: h * 0.55,
        endX: w * 0.9,
        endY: h + 40,
      });
    };

    // Subtle light pulses along curves
    const pulses: {
      pathIdx: number;
      t: number;
      speed: number;
      length: number;
      opacity: number;
    }[] = [];

    const initPulses = () => {
      pulses.length = 0;
      const count = 18; // Restrained, subtle count
      for (let i = 0; i < count; i++) {
        pulses.push({
          pathIdx: i % Math.max(paths.length, 1),
          t: Math.random(),
          speed: 0.0008 + Math.random() * 0.0012,
          length: 60 + Math.random() * 80,
          opacity: 0.12 + Math.random() * 0.18,
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

      buildPaths();
      if (pulses.length === 0) {
        initPulses();
      }
    };

    handleResize();
    initPulses();
    window.addEventListener('resize', handleResize);

    const getBezierPoint = (t: number, p0: number, p1: number, p2: number, p3: number) => {
      const c = 3 * (p1 - p0);
      const b = 3 * (p2 - p1) - c;
      const a = p3 - p0 - c - b;
      return a * t * t * t + b * t * t + c * t + p0;
    };

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      try {
        if (width <= 0 || height <= 0) {
          handleResize();
        }

        // 1. Deep minimalist black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        // 2. Subtle, ultra-clean dot grid (Vercel / Linear style)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        const dotGap = 32;
        for (let x = 16; x < width; x += dotGap) {
          for (let y = 16; y < height; y += dotGap) {
            ctx.fillRect(x, y, 1, 1);
          }
        }

        // 3. Faint road bed lines
        paths.forEach((path) => {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(path.startX, path.startY);
          ctx.bezierCurveTo(path.cp1x, path.cp1y, path.cp2x, path.cp2y, path.endX, path.endY);
          ctx.stroke();
        });

        // 4. Subtle monochromatic light stream pulses
        pulses.forEach((pulse) => {
          const path = paths[pulse.pathIdx];
          if (!path) return;

          pulse.t += pulse.speed;
          if (pulse.t > 1) {
            pulse.t = 0;
            pulse.pathIdx = Math.floor(Math.random() * paths.length);
          }

          // Draw small moving light trace along the curve
          const headX = getBezierPoint(pulse.t, path.startX, path.cp1x, path.cp2x, path.endX);
          const headY = getBezierPoint(pulse.t, path.startY, path.cp1y, path.cp2y, path.endY);

          const tailT = Math.max(0, pulse.t - 0.06);
          const tailX = getBezierPoint(tailT, path.startX, path.cp1x, path.cp2x, path.endX);
          const tailY = getBezierPoint(tailT, path.startY, path.cp1y, path.cp2y, path.endY);

          const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          grad.addColorStop(1, `rgba(255, 255, 255, ${pulse.opacity})`);

          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(headX, headY);
          ctx.stroke();
        });
      } catch (err) {
        console.warn('Background render error:', err);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
};
