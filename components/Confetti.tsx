"use client";

import { useEffect, useRef } from "react";

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      rot: number;
      rotSpeed: number;
      color: string;
      size: number;
      drift: number;
    };

    const particles: Particle[] = [];
    const colors = ["#D4AF37", "#ffffff", "#000000", "#facc15", "#38bdf8"];
    const start = performance.now();
    const lifespan = 12000;

    for (let i = 0; i < 240; i++) {
      particles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12 - 6,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.25,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 7 + 3,
        drift: Math.random() * Math.PI * 2,
      });
    }

    let animationId: number;

    const animate = () => {
      const now = performance.now();
      const elapsed = now - start;
      const fade = Math.max(0, 1 - elapsed / lifespan);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, idx) => {
        const wobble = Math.sin(elapsed / 600 + p.drift + idx) * 0.6;
        p.x += p.vx + wobble;
        p.y += p.vy;
        p.vy += 0.12; // Gravity
        p.vx *= 0.995;
        p.rot += p.rotSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, fade + 0.2);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
        ctx.restore();
      });

      // Orbiting sparks for extra motion
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      for (let i = 0; i < 18; i++) {
        const angle = (elapsed / 400 + i * 20) * (Math.PI / 180);
        const radius = 40 + (elapsed / 20 % 120);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.globalAlpha = Math.max(0, Math.min(1, fade + 0.1));
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (elapsed < lifespan * 1.3) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animate();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50" />;
}
