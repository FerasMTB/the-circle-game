"use client";

import Image from "next/image";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Confetti from "../components/Confetti";
import WinningModal from "../components/WinningModal";

type Point = { x: number; y: number };
type Ripple = { id: number; x: number; y: number };

// Compute circle score and geometry given a set of stroke points.
function computeCircleScore(points: Point[]) {
  if (!points || points.length < 12) {
    return { score: 0, center: { x: 0, y: 0 }, radius: 0, error: 1 };
  }

  // Estimate center as centroid
  let sumX = 0;
  let sumY = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
  }
  const cx = sumX / points.length;
  const cy = sumY / points.length;

  // Distances and average radius
  const dists = new Array(points.length);
  let sumR = 0;
  for (let i = 0; i < points.length; i++) {
    const dx = points[i].x - cx;
    const dy = points[i].y - cy;
    const d = Math.hypot(dx, dy);
    dists[i] = d;
    sumR += d;
  }
  const r = sumR / points.length;
  if (r <= 1e-3 || !Number.isFinite(r)) {
    return { score: 0, center: { x: cx, y: cy }, radius: r, error: 1 };
  }

  // Error metric: average absolute radial deviation normalized by radius
  let errSum = 0;
  for (let i = 0; i < dists.length; i++) {
    errSum += Math.abs(dists[i] - r);
  }
  const error = errSum / dists.length / r;

  // Score in [0, 100]
  let score = Math.max(0, 100 * (1 - error));
  if (!Number.isFinite(score)) score = 0;
  const scoreInt = Math.max(0, Math.min(100, Math.round(score)));
  return { score: scoreInt, center: { x: cx, y: cy }, radius: r, error };
}

// Beno-flavored color palette by score.
function getColorByScore(score: number) {
  type RGB = { r: number; g: number; b: number };
  const colors: { min: number; rgb: RGB; hex: string }[] = [
    { min: 90, rgb: { r: 212, g: 175, b: 55 }, hex: "#D4AF37" }, // Beno Gold
    { min: 75, rgb: { r: 56, g: 189, b: 248 }, hex: "#38bdf8" }, // sky
    { min: 55, rgb: { r: 248, g: 113, b: 113 }, hex: "#f87171" }, // soft red
    { min: 0, rgb: { r: 30, g: 64, b: 175 }, hex: "#1d4ed8" }, // deep blue
  ];
  const chosen = colors.find((c) => score >= c.min) ?? colors[colors.length - 1];
  return {
    hex: chosen.hex,
    rgba: (a: number) => `rgba(${chosen.rgb.r}, ${chosen.rgb.g}, ${chosen.rgb.b}, ${a})`,
  };
}

const MIN_POINT_DISTANCE = 1.4;

function smoothPoints(points: Point[]) {
  if (points.length < 3) return points;
  const smoothed: Point[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    smoothed.push({
      x: (prev.x + curr.x + next.x) / 3,
      y: (prev.y + curr.y + next.y) / 3,
    });
  }
  smoothed.push(points[points.length - 1]);
  return smoothed;
}

function BackgroundDeco() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-gradient-to-tr from-[#D4AF37] to-amber-600 opacity-20 blur-3xl animate-blob" />
      <div className="absolute right-1/4 -top-16 h-64 w-64 rounded-full bg-gradient-to-tr from-rose-500 to-rose-900 opacity-15 blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -right-16 top-1/4 h-80 w-80 rounded-full bg-gradient-to-tr from-slate-800 to-slate-600 opacity-30 blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute left-1/3 bottom-0 h-96 w-96 rounded-full bg-gradient-to-tr from-[#D4AF37] to-yellow-200 opacity-10 blur-3xl animate-blob animation-delay-4000" />
      <div className="absolute -left-10 bottom-10 h-72 w-72 rounded-full bg-gradient-to-tr from-emerald-400 to-emerald-900 opacity-15 blur-3xl animate-blob animation-delay-4000" />
    </div>
  );
}

function SnowOverlay() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[3] overflow-hidden">
      <div className="snow-overlay absolute inset-0 opacity-65" />
      <div className="snow-overlay-large absolute inset-0 opacity-40" />
      <div className="snow-overlay absolute inset-0 scale-125 opacity-30 blur-sm" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
    </div>
  );
}

function WinBurst() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-32 w-32 rounded-full border border-[#D4AF37]/80 animate-ping" />
        <div className="absolute h-44 w-44 rounded-full border border-[#D4AF37]/60 animate-ping animation-delay-2000" />
        <div className="absolute h-56 w-56 rounded-full border border-white/40 animate-ping animation-delay-4000" />
        <div className="relative rounded-full bg-gradient-to-r from-[#D4AF37] via-amber-200 to-[#D4AF37] px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-black shadow-md">
          BENO PERFECT
        </div>
      </div>
    </div>
  );
}

function NeonBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl z-0">
      <div
        className="absolute inset-[-30%] opacity-40 blur-3xl animate-slow-spin"
        style={{
          background:
            "conic-gradient(from 120deg at 50% 50%, rgba(34,211,238,0.2), rgba(244,114,182,0.08), rgba(34,197,94,0.18), rgba(34,211,238,0.2))",
        }}
      />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 18% 18%, rgba(34,197,94,0.18), transparent 45%), radial-gradient(circle at 82% 12%, rgba(239,68,68,0.18), transparent 45%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-slate-900/40 to-indigo-700/10 mix-blend-screen" />
    </div>
  );
}

function TouchRipples({ ripples }: { ripples: Ripple[] }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl z-30 mix-blend-screen"
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="ripple-dot absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/14 ring-2 ring-cyan-200/30 backdrop-blur-sm shadow-[0_0_30px_rgba(34,211,238,0.35)]"
          style={{ left: r.x, top: r.y }}
        />
      ))}
    </div>
  );
}

function VictoryAura() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl z-30">
      <div
        className="absolute inset-[-30%] rounded-full blur-3xl opacity-70 animate-slow-spin"
        style={{
          background:
            "conic-gradient(from 45deg at 50% 50%, rgba(212,175,55,0.24), rgba(56,189,248,0.08), rgba(34,197,94,0.22), rgba(212,175,55,0.24))",
        }}
      />
      <div className="absolute left-6 top-6 h-28 w-28 rounded-full bg-amber-300/15 blur-3xl animate-float-slow" />
      <div className="absolute right-8 bottom-10 h-24 w-24 rounded-full bg-sky-400/20 blur-3xl animate-float-slower" />
      {[...Array(6)].map((_, idx) => (
        <div
          key={idx}
          className="absolute h-2 w-2 rounded-full bg-white/90 animate-sparkle"
          style={{
            left: `${8 + idx * 14}%`,
            top: idx % 2 === 0 ? "20%" : "72%",
            animationDelay: `${idx * 0.35}s`,
          }}
        />
      ))}
    </div>
  );
}

function WinRays() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center z-40">
      <div className="relative h-72 w-72">
        {[...Array(14)].map((_, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 h-40 w-[2px] origin-bottom bg-gradient-to-b from-white/80 via-amber-200/60 to-transparent animate-ray-spin"
            style={{
              transform: `rotate(${(360 / 14) * i}deg) translateY(-32px)`,
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
        <div className="absolute inset-6 rounded-full border border-white/25 blur-sm" />
        <div className="absolute inset-10 rounded-full border border-amber-200/25 blur-sm animate-pulse-slow" />
      </div>
    </div>
  );
}

function SideBeams() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-[2]">
      <div className="absolute left-[-8%] top-0 h-full w-24 bg-gradient-to-r from-cyan-500/0 via-cyan-500/18 to-transparent blur-3xl animate-beam-slide" />
      <div className="absolute right-[-8%] top-0 h-full w-24 bg-gradient-to-l from-amber-300/0 via-amber-300/14 to-transparent blur-3xl animate-beam-slide-slow" />
      <div className="absolute inset-y-0 left-0 w-full bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.06),transparent_45%)]" />
    </div>
  );
}

function HolidayLights() {
  const bulbs = ["#ef4444", "#22c55e", "#facc15", "#38bdf8"];
  return (
    <div aria-hidden className="pointer-events-none absolute left-12 right-12 top-2 z-40">
      <div className="absolute inset-x-0 top-2 h-px bg-gradient-to-r from-transparent via-emerald-200/40 to-transparent" />
      <div className="flex justify-between">
        {Array.from({ length: 14 }).map((_, i) => {
          const color = bulbs[i % bulbs.length];
          return (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-full animate-holiday-twinkle"
              style={{
                background: color,
                boxShadow: `0 0 12px ${color}88`,
                animationDelay: `${i * 0.18}s`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function HolidayScene() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-72 overflow-hidden sm:h-80">
      <div className="absolute inset-0 bg-gradient-to-t from-[#05070f] via-[#0b1224]/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/20 via-white/10 to-transparent blur-xl" />
      <svg
        className="absolute inset-x-0 bottom-0 h-32 w-full opacity-90"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
      >
        <path
          d="M0 150 C120 120 240 170 360 145 C480 120 600 170 720 145 C840 120 960 170 1080 145 L1200 200 L0 200 Z"
          fill="#f8fafc"
          fillOpacity="0.2"
        />
      </svg>
      <svg
        className="absolute inset-x-0 bottom-0 h-52 w-full opacity-90"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
      >
        <polygon points="40,200 100,70 160,200" fill="#14532d" />
        <rect x="94" y="170" width="14" height="30" fill="#0f2f1c" />
        <polygon points="210,200 280,60 350,200" fill="#166534" />
        <rect x="274" y="170" width="14" height="30" fill="#0f2f1c" />
        <polygon points="420,200 500,80 580,200" fill="#14532d" />
        <rect x="494" y="170" width="14" height="30" fill="#0f2f1c" />
        <polygon points="720,200 790,65 860,200" fill="#166534" />
        <rect x="784" y="170" width="14" height="30" fill="#0f2f1c" />
        <polygon points="910,200 990,85 1070,200" fill="#14532d" />
        <rect x="984" y="170" width="14" height="30" fill="#0f2f1c" />
      </svg>
      <svg
        className="absolute bottom-6 left-8 h-60 w-44 opacity-95"
        viewBox="0 0 160 220"
      >
        <polygon points="80,10 150,150 10,150" fill="#1f7a3b" />
        <polygon points="80,40 160,190 0,190" fill="#1b6b35" />
        <rect x="70" y="185" width="20" height="28" fill="#0f2f1c" />
        <polygon
          points="80,4 86,18 102,20 90,30 94,46 80,38 66,46 70,30 58,20 74,18"
          fill="#facc15"
        />
        <circle cx="55" cy="95" r="4" fill="#facc15" />
        <circle cx="95" cy="110" r="4" fill="#ef4444" />
        <circle cx="70" cy="130" r="4" fill="#38bdf8" />
        <circle cx="105" cy="145" r="4" fill="#22c55e" />
      </svg>
      <svg
        className="absolute bottom-8 right-10 h-52 w-40 opacity-90"
        viewBox="0 0 140 200"
      >
        <polygon points="70,20 130,150 10,150" fill="#1c7338" />
        <polygon points="70,45 140,180 0,180" fill="#166534" />
        <rect x="60" y="178" width="18" height="24" fill="#0f2f1c" />
        <circle cx="55" cy="95" r="3.5" fill="#facc15" />
        <circle cx="80" cy="115" r="3.5" fill="#ef4444" />
        <circle cx="65" cy="135" r="3.5" fill="#38bdf8" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

const WIN_THRESHOLD = 92;
const PRIZES = [
  "20% discount",
  "40% discount",
  "1 hour free ride",
  "Yacht trip",
];

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const pointsRef = useRef<Point[]>([]);
  const drawingRef = useRef(false);
  const drawingPointerIdRef = useRef<number | null>(null);
  const activePointerIdsRef = useRef<Set<number>>(new Set());
  const multiTouchRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const flashTimeoutRef = useRef<number | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);
  const loseAudioRef = useRef<HTMLAudioElement | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const [won, setWon] = useState(false);
  const [flash, setFlash] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [prize, setPrize] = useState("");
  const [celebrating, setCelebrating] = useState(false);
  const [touchRipples, setTouchRipples] = useState<Ripple[]>([]);
  const [multiTouch, setMultiTouch] = useState(false);
  const lastLiveUpdateRef = useRef(0);

  // Memoize line style to avoid re-allocations
  const lineStyle = useMemo(
    () => ({
      width: 5,
      color: "#06b6d4",
      shadowColor: "rgba(56,189,248,0.35)",
    }),
    []
  );

  const setMultiTouchState = (value: boolean) => {
    multiTouchRef.current = value;
    setMultiTouch(value);
  };

  const startBackgroundAudio = () => {
    const bg = bgAudioRef.current;
    if (!bg || !bg.paused) return;
    bg.play().catch(() => undefined);
  };

  const playEffect = (audio: HTMLAudioElement | null, volume: number) => {
    if (!audio) return;
    audio.currentTime = 0;
    audio.volume = volume;
    audio.play().catch(() => undefined);
  };

  const registerPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType !== "touch") return false;
    activePointerIdsRef.current.add(e.pointerId);
    const isMultiTouch = activePointerIdsRef.current.size > 1;
    setMultiTouchState(isMultiTouch);
    return isMultiTouch;
  };

  const registerPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType !== "touch") return;
    activePointerIdsRef.current.delete(e.pointerId);
    setMultiTouchState(activePointerIdsRef.current.size > 1);
  };

  const addPoint = (pt: Point) => {
    const pts = pointsRef.current;
    const last = pts[pts.length - 1];
    if (last) {
      const dist = Math.hypot(pt.x - last.x, pt.y - last.y);
      if (dist < MIN_POINT_DISTANCE) return;
    }
    pts.push(pt);
  };

  // Resize and prepare the canvas for high-DPI rendering.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    const resize = () => {
      const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));

      // Set the internal pixel buffer to account for DPR
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      // Reset transform then scale so drawing uses CSS pixels
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Clear on resize
      ctx.clearRect(0, 0, width, height);
      // Style
      ctx.lineWidth = lineStyle.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = lineStyle.color;
      ctx.shadowColor = lineStyle.shadowColor;
      ctx.shadowBlur = 0;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Reset drawing state
      pointsRef.current = [];
      drawingRef.current = false;
    };

    resize();

    // Observe container size changes for responsive canvas
    const ro = new ResizeObserver(() => resize());
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [lineStyle]);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        window.clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const bg = new Audio("/music-box-we-wish-you-a-merry-christmas-79501.mp3");
    bg.loop = true;
    bg.volume = 0.18;
    bg.preload = "auto";
    bgAudioRef.current = bg;

    const win = new Audio("/tada-fanfare-356032.mp3");
    win.volume = 0.8;
    win.preload = "auto";
    winAudioRef.current = win;

    const lose = new Audio("/game-over-39-199830.mp3");
    lose.volume = 0.7;
    lose.preload = "auto";
    loseAudioRef.current = lose;

    return () => {
      bg.pause();
    };
  }, []);

  // Render the current stroke and overlay, computing score live
  const render = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.save();
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "#0b1224");
    gradient.addColorStop(1, "#0f172a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    const rawPts = pointsRef.current;
    const drawPts = rawPts.length > 2 ? smoothPoints(rawPts) : rawPts;
    let res: { score: number; center: Point; radius: number } | null = null;
    if (rawPts.length >= 8) {
      const r = computeCircleScore(rawPts);
      res = { score: r.score, center: r.center, radius: r.radius };
      const now = performance.now();
      if (now - lastLiveUpdateRef.current > 50) {
        lastLiveUpdateRef.current = now;
        setLiveScore(r.score);
      }
    }

    if (drawPts.length > 0) {
      // Build smooth path
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(drawPts[0].x, drawPts[0].y);
      for (let i = 0; i < drawPts.length - 1; i++) {
        const p0 = drawPts[i];
        const p1 = drawPts[i + 1];
        const mx = (p0.x + p1.x) / 2;
        const my = (p0.y + p1.y) / 2;
        ctx.quadraticCurveTo(p0.x, p0.y, mx, my);
      }
      ctx.lineTo(drawPts[drawPts.length - 1].x, drawPts[drawPts.length - 1].y);

      const s = res?.score ?? liveScore ?? score ?? 0;
      const color = getColorByScore(s);

      // Glow pass
      ctx.save();
      ctx.lineWidth = lineStyle.width + 6;
      ctx.strokeStyle = color.rgba(0.8);
      ctx.shadowColor = color.rgba(0.9);
      ctx.shadowBlur = 26;
      ctx.stroke();
      ctx.restore();

      // Core pass
      ctx.lineWidth = lineStyle.width;
      ctx.shadowBlur = 2;
      ctx.strokeStyle = won ? "#22c55e" : lineStyle.color;
      ctx.stroke();
      ctx.restore();
    }

    if (res) {
      const { center, radius } = res;
      ctx.save();
      ctx.setLineDash([4, 12]);
      ctx.globalAlpha = 0.65;
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(56,189,248,0.4)";
      ctx.beginPath();
      ctx.moveTo(center.x - radius, center.y);
      ctx.lineTo(center.x + radius, center.y);
      ctx.moveTo(center.x, center.y - radius);
      ctx.lineTo(center.x, center.y + radius);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(59,130,246,0.9)";
      ctx.beginPath();
      ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  const requestDraw = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => render());
  };

  const cancelDrawing = () => {
    const canvas = canvasRef.current;
    if (canvas && drawingPointerIdRef.current != null) {
      canvas.releasePointerCapture(drawingPointerIdRef.current);
    }
    drawingRef.current = false;
    drawingPointerIdRef.current = null;
    setIsDrawing(false);
    pointsRef.current = [];
    setLiveScore(null);
    requestDraw();
  };

  // Map a pointer event to canvas-local CSS pixel coordinates.
  const eventToPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const pushRipple = () => {
    // Ripples disabled for now to keep the view clean while drawing.
    return;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (e.pointerType !== "touch") setMultiTouchState(false);
    const isMultiTouch = registerPointerDown(e);
    if (isMultiTouch) {
      cancelDrawing();
      return;
    }
    if (drawingRef.current) return;
    startBackgroundAudio();
    canvas.setPointerCapture(e.pointerId);
    drawingPointerIdRef.current = e.pointerId;
    drawingRef.current = true;
    setIsDrawing(true);
    const pt = eventToPoint(e);
    pointsRef.current = [];
    addPoint(pt);
    pushRipple();
    setWon(false);
    setCelebrating(false);
    setPrize("");
    setFlash(false);
    setScore(null);
    setLiveScore(null);
    setModalOpen(false); // Close modal if starting new draw
    requestDraw();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    if (drawingPointerIdRef.current !== e.pointerId) return;
    if (multiTouchRef.current) return;

    // Prefer coalesced events for smoothness where supported
    const coalesced: PointerEvent[] | undefined = e.nativeEvent.getCoalescedEvents?.();
    if (coalesced && coalesced.length > 0) {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      for (const ce of coalesced) {
        addPoint({
          x: ce.clientX - rect.left,
          y: ce.clientY - rect.top,
        });
      }
    } else {
      addPoint(eventToPoint(e));
      pushRipple();
    }
    if (coalesced && coalesced.length > 0) {
      pushRipple();
    }
    requestDraw();
  };

  const triggerWinFlash = () => {
    if (flashTimeoutRef.current) window.clearTimeout(flashTimeoutRef.current);
    setFlash(true);
    flashTimeoutRef.current = window.setTimeout(() => setFlash(false), 5200);
  };

  const finishStroke = () => {
    const canvas = canvasRef.current;
    if (canvas && drawingPointerIdRef.current != null) {
      canvas.releasePointerCapture(drawingPointerIdRef.current);
    }
    drawingRef.current = false;
    drawingPointerIdRef.current = null;
    setIsDrawing(false);
    const result = computeCircleScore(pointsRef.current);
    setScore(result.score);
    setLiveScore(result.score);

    // Prize unlock threshold
    const isWin = result.score >= WIN_THRESHOLD;
    setWon(isWin);

    if (isWin) {
      playEffect(winAudioRef.current, 0.85);
      setCelebrating(true);
      triggerWinFlash();
      let reward = PRIZES[0];
      if (result.score === 100) reward = PRIZES[3];
      else if (result.score >= 98) reward = PRIZES[2];
      else if (result.score >= 96) reward = PRIZES[1];
      else if (result.score >= WIN_THRESHOLD) reward = PRIZES[0];
      setPrize(reward);
      setTimeout(() => setModalOpen(true), 1000); // Delay modal slightly for effect
    } else {
      playEffect(loseAudioRef.current, 0.6);
      if (flashTimeoutRef.current) {
        window.clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = null;
      }
      setFlash(false);
    }

    requestDraw();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    registerPointerUp(e);
    if (!drawingRef.current) return;
    if (drawingPointerIdRef.current !== e.pointerId) return;
    finishStroke();
  };

  const onPointerLeave = (e: React.PointerEvent<HTMLCanvasElement>) => {
    registerPointerUp(e);
    if (!drawingRef.current) return;
    if (drawingPointerIdRef.current !== e.pointerId) return;
    finishStroke();
  };

  const clearAll = () => {
    pointsRef.current = [];
    drawingRef.current = false;
    drawingPointerIdRef.current = null;
    activePointerIdsRef.current.clear();
    setIsDrawing(false);
    setMultiTouchState(false);
    setScore(null);
    setLiveScore(null);
    setWon(false);
    setCelebrating(false);
    setPrize("");
    setModalOpen(false);
    setFlash(false);
    setTouchRipples([]);
    if (flashTimeoutRef.current) {
      window.clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = null;
    }
    requestDraw();
  };

  const activeScore = liveScore ?? score;
  const showFail = !isDrawing && score !== null && score < WIN_THRESHOLD;
  const statusText = useMemo(() => {
    if (multiTouch) return "Two-finger touch detected. Use one finger to draw.";
    if (activeScore == null) return "Draw a circle in one smooth stroke.";
    if (!isDrawing && score != null && score < WIN_THRESHOLD) {
      return `Try failed - ${score}%. Aim for ${WIN_THRESHOLD}%+.`;
    }
    if (activeScore >= WIN_THRESHOLD) return `Prize tier unlocked: ${activeScore}%`;
    return `Your circle score: ${activeScore}%. ${isDrawing ? "Keep going..." : `Aim for ${WIN_THRESHOLD}%+`}`;
  }, [activeScore, isDrawing, multiTouch, score]);

  const panelClass = [
    "w-full max-w-xl rounded-3xl bg-gradient-to-br from-slate-900/80 via-slate-950/80 to-[#0a1628] p-4 shadow-[0_20px_70px_rgba(8,47,73,0.35)] ring-1 ring-cyan-500/25 backdrop-blur transition-shadow",
  ]
    .filter(Boolean)
    .join(" ");
  const panelStyle =
    won && flash
      ? { boxShadow: "0 0 0 1px rgba(34,211,238,0.6), 0 18px 48px rgba(14,165,233,0.35)" }
      : undefined;
  const canvasClass =
    "block h-auto max-h-[60vh] w-full touch-none select-none rounded-3xl bg-gradient-to-b from-slate-950 via-[#0b1224] to-slate-900 outline-none aspect-square shadow-inner";

  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-[#0a0a0a] to-black text-slate-50">
      <BackgroundDeco />
      <SnowOverlay />
      <HolidayScene />
      <SideBeams />
      {celebrating && <Confetti />}
      <WinningModal
        isOpen={modalOpen}
        prize={prize}
        onClose={() => {
          setModalOpen(false);
        }}
      />

      <div className="relative z-10 mx-auto flex max-h-[92vh] w-full max-w-3xl flex-col items-center px-4 py-4 sm:px-6 sm:py-6">
        <header className="mb-6 w-full max-w-xl text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex items-center gap-3 rounded-full bg-white/5 px-4 py-2 ring-1 ring-white/15 backdrop-blur">
              <Image
                src="/logo-white.svg"
                alt="Beno logo"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">
                    Beno Circle Lab
                  </p>
                  <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[9px] uppercase tracking-[0.3em] text-emerald-100 ring-1 ring-emerald-300/40">
                    Holiday
                  </span>
                </div>
                <p className="text-xs text-slate-100">Luxury experiences, drawn by hand.</p>
              </div>
            </div>
          </div>
          <h1 className="bg-gradient-to-r from-[#D4AF37] via-white to-[#D4AF37] bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
            Circle Master
          </h1>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            Aim for a {WIN_THRESHOLD}%+ circle to unlock the Pulse Grid prizes.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-medium">
            <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-[#D4AF37] ring-1 ring-[#D4AF37]/30">
              Supercars
            </span>
            <span className="rounded-full bg-sky-500/10 px-3 py-1 text-sky-200 ring-1 ring-sky-400/30">
              Yachts
            </span>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200 ring-1 ring-emerald-400/30">
              Water toys
            </span>
          </div>
        </header>

        <div ref={containerRef} className={panelClass} style={panelStyle}>
          <div className="relative overflow-hidden rounded-3xl">
            <NeonBackdrop />
            <HolidayLights />
            {touchRipples.length > 0 && <TouchRipples ripples={touchRipples} />}
            <canvas
              ref={canvasRef}
              className={canvasClass}
              style={{
                touchAction: "none",
                boxShadow: isDrawing ? "none" : "inset 0 0 26px rgba(34,211,238,0.15)",
                position: "relative",
                zIndex: 20,
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onPointerLeave={onPointerLeave}
            />
            {won && <VictoryAura />}
            {won && <WinRays />}
            {won && flash && <WinBurst />}
            {won && prize && !isDrawing && (
              <div className="pointer-events-none absolute inset-x-6 top-4 z-50 flex justify-center">
                <div className="rounded-full bg-black/70 px-4 py-2 text-sm font-semibold text-[#D4AF37] ring-1 ring-[#D4AF37]/50 shadow-lg shadow-cyan-500/20 backdrop-blur">
                  {prize}
                </div>
              </div>
            )}
            {showFail && (
              <div className="pointer-events-none absolute inset-x-6 bottom-4 z-50 flex justify-center">
                <div className="rounded-full bg-rose-500/15 px-4 py-2 text-xs font-semibold text-rose-100 ring-1 ring-rose-300/40 backdrop-blur">
                  Try failed - {WIN_THRESHOLD}% needed to win.
                </div>
              </div>
            )}
            {/* Floating live score badge */}
            <div
              className={[
                "pointer-events-none absolute left-4 top-4 z-50 select-none rounded-full px-3 py-1 text-sm font-medium shadow-sm",
                activeScore != null ? "opacity-100" : "opacity-0",
                "transition-opacity",
              ].join(" ")}
              style={{
                background:
                  activeScore != null
                    ? `linear-gradient(135deg, ${getColorByScore(activeScore).hex}33, #020617dd)`
                    : undefined,
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(15,23,42,0.55)",
                color: "#e5e7eb",
              }}
            >
              {activeScore != null ? `${activeScore}%` : ""}
            </div>
          </div>
        </div>

        <div className="mt-4 flex w-full max-w-xl flex-col items-center gap-4">
          <div
            className={[
              "text-center text-base sm:text-lg",
              activeScore != null && activeScore >= 90
                ? "text-[#D4AF37]"
                : "text-slate-200",
            ].join(" ")}
          >
            {statusText}
          </div>
          <button
            onClick={clearAll}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#D4AF37] px-6 py-3 text-sm font-semibold text-black shadow-lg transition hover:from-amber-300 hover:via-amber-200 hover:to-amber-300 active:translate-y-px"
          >
            Clear / Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
