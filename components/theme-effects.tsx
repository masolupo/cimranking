"use client";

import { useEffect, useRef, useState } from "react";
import { THEME_EFFECTS, type Shape, type TrailEffect } from "@/lib/theme-effects";

/** Solo effetto al click/tocco: le scie e le animazioni continue sono state tolte perché pesanti. */

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: Shape;
  born: number;
  life: number;
  gravity: number;
  glow: boolean;
  rot: number;
};

const MAX_PARTICLES = 120;
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

function drawShape(ctx: CanvasRenderingContext2D, shape: Shape, size: number) {
  ctx.beginPath();
  if (shape === "circle") {
    ctx.arc(0, 0, size, 0, Math.PI * 2);
  } else if (shape === "star") {
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? size : size * 0.45;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
  } else if (shape === "sparkle") {
    // stella a 4 punte
    const s = size;
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(s * 0.12, -s * 0.12, s, 0);
    ctx.quadraticCurveTo(s * 0.12, s * 0.12, 0, s);
    ctx.quadraticCurveTo(-s * 0.12, s * 0.12, -s, 0);
    ctx.quadraticCurveTo(-s * 0.12, -s * 0.12, 0, -s);
  } else if (shape === "heart") {
    const s = size / 1.6;
    ctx.moveTo(0, s * 0.6);
    ctx.bezierCurveTo(-s * 1.6, -s * 0.4, -s * 0.6, -s * 1.6, 0, -s * 0.6);
    ctx.bezierCurveTo(s * 0.6, -s * 1.6, s * 1.6, -s * 0.4, 0, s * 0.6);
  } else if (shape === "spark") {
    ctx.ellipse(0, 0, size * 0.6, size * 2.2, 0, 0, Math.PI * 2);
  } else if (shape === "streak") {
    ctx.roundRect(-size / 2, -size * 7, size, size * 14, size / 2);
  } else if (shape === "line") {
    // linea lunga e sottile (click del tema Neon)
    ctx.roundRect(-size / 2, -size * 22, size, size * 44, size / 2);
  }
  ctx.fill();
}

/** Legge tema ed effetti da <html> e si aggiorna quando cambiano (anche durante l'anteprima). */
function useThemeAttrs() {
  const [state, setState] = useState<{ theme: string; enabled: boolean }>({ theme: "", enabled: false });
  useEffect(() => {
    const root = document.documentElement;
    const read = () =>
      setState({
        theme: root.dataset.theme ?? "",
        enabled: root.dataset.effects !== "off" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    read();
    const obs = new MutationObserver(read);
    obs.observe(root, { attributes: true, attributeFilter: ["data-theme", "data-effects"] });
    return () => obs.disconnect();
  }, []);
  return state;
}

export function ThemeEffects() {
  const { theme, enabled } = useThemeAttrs();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const config = enabled ? THEME_EFFECTS[theme] : undefined;

  useEffect(() => {
    if (!config) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // colori e forme dell'esplosione: presi dalla scia del tema, altrimenti dalle particelle mobile
    const trail = config.effects.find((e): e is TrailEffect => e.kind === "trail");
    const drift = config.mobile[0];
    const source = trail
      ? { shapes: trail.shapes, colors: trail.colors, size: trail.size, glow: !!trail.glow }
      : { shapes: drift?.shapes ?? (["circle"] as Shape[]), colors: drift?.colors ?? ["#fff"], size: [2, 4] as [number, number], glow: true };

    const particles: Particle[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function frame(now: number) {
      ctx!.clearRect(0, 0, w, h);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const age = (now - p.born) / p.life;
        if (age >= 1) {
          particles.splice(i, 1);
          continue;
        }
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        ctx!.save();
        ctx!.globalAlpha = 1 - age;
        ctx!.fillStyle = p.color;
        if (p.glow) {
          ctx!.shadowColor = p.color;
          ctx!.shadowBlur = p.size * 3;
        }
        ctx!.translate(p.x, p.y);
        ctx!.rotate(
          p.shape === "spark" || p.shape === "streak" || p.shape === "line"
            ? Math.atan2(p.vy, p.vx) + Math.PI / 2
            : p.rot + age,
        );
        drawShape(ctx!, p.shape, p.shape === "line" ? p.size : p.size * (1 - age * 0.4));
        ctx!.restore();
      }
      if (particles.length > 0) {
        raf = requestAnimationFrame(frame);
      } else {
        running = false;
      }
    }

    function onPointerDown(e: PointerEvent) {
      const { count, speed, lines } = config!.burst;
      const born = performance.now();
      for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) particles.shift();
        const a = (Math.PI * 2 * i) / count + (lines ? rand(-0.05, 0.05) : rand(-0.2, 0.2));
        const v = lines ? rand(speed * 0.8, speed) : rand(speed * 0.4, speed);
        particles.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          // linee: dritte (niente gravità), sottili, durata breve
          size: lines ? rand(1.2, 2) : rand(source.size[0], source.size[1]),
          color: pick(source.colors),
          shape: lines ? "line" : pick(source.shapes),
          born,
          life: lines ? rand(450, 650) : rand(600, 1100),
          gravity: lines ? 0 : 0.04,
          glow: source.glow,
          rot: rand(0, Math.PI),
        });
      }
      if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onPointerDown);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [config]);

  if (!config) return null;

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60]" />;
}
