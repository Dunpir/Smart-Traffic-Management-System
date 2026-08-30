import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  speed: number;
  roadIndex: number;
  color: string;
  size: number;
  progress: number;
}

interface Node {
  x: number;
  y: number;
  radius: number;
  pulsePhase: number;
}

interface Road {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export const LightTrafficBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initGrid();
    };

    window.addEventListener('resize', handleResize);

    // Mouse coordinates for interactive ripple
    let mouseX = -1000;
    let mouseY = -1000;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Grid system of arterial roads and intersection nodes
    let roads: Road[] = [];
    let nodes: Node[] = [];
    let particles: Particle[] = [];

    const initGrid = () => {
      roads = [];
      nodes = [];
      particles = [];

      const spacingX = Math.max(160, width / 7);
      const spacingY = Math.max(160, height / 5);

      const cols = Math.ceil(width / spacingX) + 1;
      const rows = Math.ceil(height / spacingY) + 1;

      // Create nodes
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          nodes.push({
            x: c * spacingX + (r % 2 === 0 ? 0 : spacingX * 0.2),
            y: r * spacingY,
            radius: 3,
            pulsePhase: Math.random() * Math.PI * 2,
          });
        }
      }

      // Create horizontal and vertical road links between adjacent nodes
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        // Connect to right neighbor
        if (i + 1 < nodes.length && Math.abs(nodes[i + 1].y - nodeA.y) < 10) {
          roads.push({
            startX: nodeA.x,
            startY: nodeA.y,
            endX: nodes[i + 1].x,
            endY: nodes[i + 1].y,
          });
        }
        // Connect to bottom neighbor
        const bottomIndex = i + (cols + 1);
        if (bottomIndex < nodes.length) {
          roads.push({
            startX: nodeA.x,
            startY: nodeA.y,
            endX: nodes[bottomIndex].x,
            endY: nodes[bottomIndex].y,
          });
        }
      }

      // Initialize vehicle packet particles
      const colors = ['#6366f1', '#4f46e5', '#10b981', '#06b6d4', '#818cf8'];
      const numParticles = Math.min(45, Math.floor(roads.length * 0.9));

      for (let p = 0; p < numParticles; p++) {
        const roadIndex = Math.floor(Math.random() * roads.length);
        particles.push({
          x: 0,
          y: 0,
          speed: 0.003 + Math.random() * 0.006,
          roadIndex,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2.5 + Math.random() * 1.5,
          progress: Math.random(),
        });
      }
    };

    initGrid();

    // Render loop
    let lastTime = performance.now();
    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle blueprint background coordinate grid
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.04)';
      ctx.lineWidth = 1;

      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Arterial Road Lines
      ctx.lineWidth = 1.2;
      for (let i = 0; i < roads.length; i++) {
        const r = roads[i];
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
        ctx.beginPath();
        ctx.moveTo(r.startX, r.startY);
        ctx.lineTo(r.endX, r.endY);
        ctx.stroke();
      }

      // 3. Draw Intersection Nodes with subtle pulse
      for (let n = 0; n < nodes.length; n++) {
        const node = nodes[n];
        node.pulsePhase += dt * 1.5;
        const pulse = Math.sin(node.pulsePhase) * 0.5 + 0.5;

        // Check proximity to cursor
        const dx = node.x - mouseX;
        const dy = node.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mouseEffect = Math.max(0, 1 - dist / 180);

        const radius = node.radius + pulse * 1.5 + mouseEffect * 3;

        // Outer glow circle
        ctx.fillStyle = mouseEffect > 0 ? 'rgba(99, 102, 241, 0.18)' : `rgba(99, 102, 241, ${0.04 + pulse * 0.06})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Inner solid core
        ctx.fillStyle = mouseEffect > 0 ? '#6366f1' : `rgba(99, 102, 241, ${0.3 + pulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Update and draw vehicle light packets along roads
      for (let p = 0; p < particles.length; p++) {
        const pt = particles[p];
        const road = roads[pt.roadIndex];
        if (!road) continue;

        pt.progress += pt.speed;
        if (pt.progress >= 1) {
          pt.progress = 0;
          pt.roadIndex = Math.floor(Math.random() * roads.length);
        }

        // Linear interpolation along road
        pt.x = road.startX + (road.endX - road.startX) * pt.progress;
        pt.y = road.startY + (road.endY - road.startY) * pt.progress;

        // Mouse avoidance/acceleration
        const dx = pt.x - mouseX;
        const dy = pt.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          pt.progress += pt.speed * 0.8;
        }

        // Draw particle tail / trail
        const trailLength = 18;
        const angle = Math.atan2(road.endY - road.startY, road.endX - road.startX);
        const tailX = pt.x - Math.cos(angle) * trailLength;
        const tailY = pt.y - Math.sin(angle) * trailLength;

        const gradient = ctx.createLinearGradient(tailX, tailY, pt.x, pt.y);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, pt.color);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = pt.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();

        // Particle Head Glow
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.85 }}
    />
  );
};
