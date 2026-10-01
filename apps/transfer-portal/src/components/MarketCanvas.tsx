"use client";

import { useEffect, useRef } from "react";

type Bar = { t: number; o: number; h: number; l: number; c: number };

export function MarketCanvas({ bars }: { bars: Bar[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || bars.length < 2) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = 6;
    const lows = bars.map((b) => b.l);
    const highs = bars.map((b) => b.h);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const span = Math.max(0.0001, max - min);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(17,17,17,0.04)";
    ctx.fillRect(0, 0, width, height);

    const slot = (width - pad * 2) / bars.length;
    const bodyW = Math.max(1.5, slot * 0.55);

    bars.forEach((bar, i) => {
      const x = pad + i * slot + slot / 2;
      const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2);
      const up = bar.c >= bar.o;
      ctx.strokeStyle = up ? "#1f6b3a" : "#c41230";
      ctx.fillStyle = up ? "#1f6b3a" : "#c41230";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y(bar.h));
      ctx.lineTo(x, y(bar.l));
      ctx.stroke();
      const top = y(Math.max(bar.o, bar.c));
      const bot = y(Math.min(bar.o, bar.c));
      ctx.fillRect(x - bodyW / 2, top, bodyW, Math.max(1, bot - top));
    });
  }, [bars]);

  return (
    <canvas
      ref={canvasRef}
      className="h-28 w-full border border-[var(--ink)]/15 bg-[var(--paper)]"
      aria-hidden
    />
  );
}
