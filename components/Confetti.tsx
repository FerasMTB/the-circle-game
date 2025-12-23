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
      life: number;
      maxLife: number;
    };

    let particles: Particle[] = [];
    const colors = ["#D4AF37", "#ffffff", "#000000", "#facc15", "#38bdf8", "#22c55e", "#ef4444"];
    const emitters = [
      { x: () => window.innerWidth / 2, y: () => window.innerHeight / 2 },
      { x: () => window.innerWidth * 0.18 + Math.random() * 40, y: () => window.innerHeight * 0.22 },
      { x: () => window.innerWidth * 0.82 + Math.random() * 40, y: () => window.innerHeight * 0.25 },
      { x: () => window.innerWidth * 0.24 + Math.random() * 30, y: () => window.innerHeight * 0.82 },
      { x: () => window.innerWidth * 0.78 + Math.random() * 30, y: () => window.innerHeight * 0.75 },
    ];

    const spawnBurst = () => {
      const origin = emitters[Math.floor(Math.random() * emitters.length)];
      const count = 55;
      for (let i = 0; i < count; i++) {
        const maxLife = 2200 + Math.random() * 800;
        particles.push({
          x: origin.x(),
          y: origin.y(),
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12 - 6,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.25,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 7 + 3,
          drift: Math.random() * Math.PI * 2,
          life: maxLife,
          maxLife,
        });
      }
      // Keep particle count in check
      if (particles.length > 2000) {
        particles = particles.slice(particles.length - 2000);
      }
    };

    spawnBurst();
    const burstTimer = window.setInterval(spawnBurst, 300);

    let animationId: number;
    let last = performance.now();

    const animate = () => {
      const now = performance.now();
      const delta = now - last;
      last = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles = particles.filter((p, idx) => {
        const wobble = Math.sin(now / 600 + p.drift + idx) * 0.6;
        p.x += p.vx + wobble;
        p.y += p.vy;
        p.vy += 0.12; // Gravity
        p.vx *= 0.995;
        p.rot += p.rotSpeed;
        p.life -= delta;
        if (p.life <= 0) return false;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = Math.min(1, alpha + 0.2);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
        ctx.restore();

        return true;
      });

      // Orbiting sparks for extra motion
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      for (let i = 0; i < 18; i++) {
        const angle = (now / 400 + i * 20) * (Math.PI / 180);
        const radius = 40 + ((now / 20) % 120);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.globalAlpha = 0.8;
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.clearInterval(burstTimer);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[60]" />;
}
