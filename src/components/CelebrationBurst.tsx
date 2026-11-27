import React, { useEffect, useRef } from 'react';

interface CelebrationBurstProps {
  triggerKey: number;
}

export const CelebrationBurst: React.FC<CelebrationBurstProps> = ({ triggerKey }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (triggerKey === 0) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const colors = ['#22D3EE', '#38BDF8', '#FBBF24', '#34D399', '#F472B6', '#FFFFFF'];

    interface Spark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
      decay: number;
      trail: Array<{ x: number; y: number }>;
    }

    interface Ring {
      x: number;
      y: number;
      r: number;
      maxR: number;
      color: string;
      alpha: number;
    }

    const sparks: Spark[] = [];
    const rings: Ring[] = [];

    const spawnBurst = (cx: number, cy: number, count: number, power: number) => {
      rings.push({
        x: cx,
        y: cy,
        r: 8,
        maxR: 130 + Math.random() * 80,
        color: colors[Math.floor(Math.random() * 3)],
        alpha: 0.75,
      });

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
        const speed = (2.4 + Math.random() * 6.5) * power;
        sparks.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          radius: 1.8 + Math.random() * 2.4,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: 0.013 + Math.random() * 0.012,
          trail: [],
        });
      }
    };

    // Launch 5 coordinated firework bursts across the screen
    spawnBurst(width * 0.5, height * 0.42, 64, 1.15);
    const t1 = window.setTimeout(() => spawnBurst(width * 0.28, height * 0.32, 48, 0.95), 140);
    const t2 = window.setTimeout(() => spawnBurst(width * 0.72, height * 0.34, 48, 0.95), 240);
    const t3 = window.setTimeout(() => spawnBurst(width * 0.38, height * 0.54, 40, 0.85), 380);
    const t4 = window.setTimeout(() => spawnBurst(width * 0.64, height * 0.52, 40, 0.85), 480);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let rafId = 0;
    let active = true;
    const startTime = performance.now();

    const animate = (now: number) => {
      if (!active) return;
      ctx.clearRect(0, 0, width, height);

      // Update & draw expanding shockwave rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        ring.r += (ring.maxR - ring.r) * 0.1;
        ring.alpha *= 0.93;
        if (ring.alpha < 0.02) {
          rings.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.globalAlpha = ring.alpha;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Update & draw firework sparks with glowing trails
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 6) s.trail.shift();

        s.vx *= 0.97;
        s.vy = s.vy * 0.97 + 0.09; // Gentle gravity
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= s.decay;

        if (s.alpha <= 0.02) {
          sparks.splice(i, 1);
          continue;
        }

        // Sparkler tail
        if (s.trail.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = s.color;
          ctx.lineWidth = s.radius * 0.85;
          ctx.globalAlpha = s.alpha * 0.55;
          s.trail.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.stroke();
        }

        // Glowing spark head
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      if (sparks.length > 0 || rings.length > 0 || now - startTime < 750) {
        rafId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      active = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, [triggerKey]);

  if (triggerKey === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />
  );
};
