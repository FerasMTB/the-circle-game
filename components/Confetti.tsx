"use client";

import { useEffect, useRef } from "react";

export default function Confetti() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: {
            x: number;
            y: number;
            vx: number;
            vy: number;
            color: string;
            size: number;
        }[] = [];

        const colors = ["#D4AF37", "#ffffff", "#000000", "#facc15", "#38bdf8"];

        for (let i = 0; i < 150; i++) {
            particles.push({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5, // Initial upward burst
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 5 + 2,
            });
        }

        let animationId: number;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1; // Gravity

                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            });

            // Remove off-screen particles
            // For simplicity, just keep animating for a while or until unmount
            animationId = requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none fixed inset-0 z-50"
        />
    );
}
