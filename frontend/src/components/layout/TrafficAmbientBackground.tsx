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

      // Arterial 1 (West to East)
      paths.push({
        startX: -60,
        startY: h * 0.75,
        cp1x: w * 0.35,
        cp1y: h * 0.7,
        cp2x: w * 0.65,
        cp2y: h * 0.3,
        endX: w + 60,
        endY: h * 0.25,
      });

      // Arterial 2 (East to West)
      paths.push({
        startX: w + 60,
        startY: h * 0.2,
        cp1x: w * 0.65,
        cp1y: h * 0.25,
        cp2x: w * 0.35,
        cp2y: h * 0.65,
        endX: -60,
        endY: h * 0.7,
      });

      // Arterial 3 (North-West to South-East)
      paths.push({
        startX: w * 0.15,
        startY: -60,
        cp1x: w * 0.3,
        cp1y: h * 0.45,
        cp2x: w * 0.7,
        cp2y: h * 0.55,
        endX: w * 0.9,
        endY: h + 60,
      });

      // Arterial 4 (South to North-East)
      paths.push({
        startX: w * 0.4,
        startY: h + 60,
        cp1x: w * 0.5,
        cp1y: h * 0.5,
        cp2x: w * 0.8,
        cp2y: h * 0.4,
        endX: w + 60,
        endY: h * 0.55,
      });
    };

    // Subtle moving traffic light pulses
    const pulses: {
      pathIdx: number;
      t: number;
      speed: number;
      length: number;
      opacity: number;
      isWarm: boolean;
    }[] = [];

    const initPulses = () => {
      pulses.length = 0;
      const count = 28;
      for (let i = 0; i < count; i++) {
        pulses.push({
          pathIdx: i % Math.max(paths.length, 1),
          t: Math.random(),
          speed: 0.001 + Math.random() * 0.0015,
          length: 50 + Math.random() * 60,
          opacity: 0.25 + Math.random() * 0.35,
          isWarm: i % 4 === 0,
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

        // 1. Clean Deep Black Vignette Canvas
        ctx.fillStyle = '#050507';
        ctx.fillRect(0, 0, width, height);

        // 2. Clean Dot Grid
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        const dotGap = 28;
        for (let x = 14; x < width; x += dotGap) {
          for (let y = 14; y < height; y += dotGap) {
            ctx.fillRect(x, y, 1, 1);
          }
        }

        // 3. Arterial Road Bed Lines
        paths.forEach((path) => {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(path.startX, path.startY);
          ctx.bezierCurveTo(path.cp1x, path.cp1y, path.cp2x, path.cp2y, path.endX, path.endY);
          ctx.stroke();
        });

        // 4. Moving Traffic Light Stream Pulses (Clean white and subtle amber/cyan pulses)
        pulses.forEach((pulse) => {
          const path = paths[pulse.pathIdx];
          if (!path) return;

          pulse.t += pulse.speed;
          if (pulse.t > 1) {
            pulse.t = 0;
            pulse.pathIdx = Math.floor(Math.random() * paths.length);
          }

          const headX = getBezierPoint(pulse.t, path.startX, path.cp1x, path.cp2x, path.endX);
          const headY = getBezierPoint(pulse.t, path.startY, path.cp1y, path.cp2y, path.endY);

          const tailT = Math.max(0, pulse.t - 0.08);
          const tailX = getBezierPoint(tailT, path.startX, path.cp1x, path.cp2x, path.endX);
          const tailY = getBezierPoint(tailT, path.startY, path.cp1y, path.cp2y, path.endY);

          const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
          const colorBase = pulse.isWarm ? '254, 215, 170' : '255, 255, 255';
          grad.addColorStop(0, `rgba(${colorBase}, 0)`);
          grad.addColorStop(1, `rgba(${colorBase}, ${pulse.opacity})`);

          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(headX, headY);
          ctx.stroke();

          // Small bright head dot
          ctx.fillStyle = `rgba(${colorBase}, ${pulse.opacity + 0.2})`;
          ctx.beginPath();
          ctx.arc(headX, headY, 1.5, 0, Math.PI * 2);
          ctx.fill();
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
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#050507]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
};
