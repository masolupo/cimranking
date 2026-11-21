/** Effetti animati dei temi speciali: col mouse su computer, versione "touch" su telefono. */

export type Shape = "circle" | "star" | "heart" | "spark" | "sparkle" | "streak" | "line";

export type TrailEffect = {
  kind: "trail";
  shapes: Shape[];
  colors: string[];
  size: [number, number];
  /** durata in ms */
  life: [number, number];
  /** accelerazione verticale (negativa = sale) */
  gravity: number;
  /** velocità casuale iniziale */
  spread: number;
  /** particelle per 100px di movimento */
  rate: number;
  glow?: boolean;
};

export type GlowEffect = { kind: "glow"; color: string; radius: number };

export type AmbientEffect = {
  kind: "ambient";
  shape: Shape;
  colors: string[];
  count: number;
  size: [number, number];
  /** quanto vengono attirate dal cursore/dito (0 = per niente, negativo = scappano) */
  attraction: number;
  glow?: boolean;
};

/** Particelle che nascono da sole di continuo (versione telefono). */
export type DriftEffect = {
  kind: "drift";
  /** dove nascono */
  from: "bottom" | "top" | "anywhere" | "top-left";
  shapes: Shape[];
  colors: string[];
  size: [number, number];
  life: [number, number];
  /** particelle al secondo (su uno schermo largo ~400px) */
  rate: number;
  vx: [number, number];
  vy: [number, number];
  gravity: number;
  /** compaiono e spariscono dolcemente invece di sbiadire e basta */
  twinkle?: boolean;
  glow?: boolean;
};

export type ThemeEffect = TrailEffect | GlowEffect | AmbientEffect;

export type ThemeEffectsConfig = {
  label: string;
  /** effetti col mouse (e col dito quando lo trascini) */
  effects: ThemeEffect[];
  /** effetti extra solo su telefono/tablet: si muovono da soli */
  mobile: DriftEffect[];
  /** particelle sparate dove tocchi lo schermo */
  burst: { count: number; speed: number; /** linee lunghe e dritte invece di pallini */ lines?: boolean };
};

export const THEME_EFFECTS: Record<string, ThemeEffectsConfig> = {
  tramonto: {
    label: "Bagliore caldo e polvere dorata",
    effects: [
      { kind: "glow", color: "oklch(0.8 0.16 50 / 0.28)", radius: 420 },
      {
        kind: "trail", shapes: ["circle"], colors: ["#ffb347", "#ff7eb3", "#ffd56b"],
        size: [2, 5], life: [600, 1100], gravity: 0.01, spread: 0.6, rate: 6,
      },
    ],
    mobile: [
      {
        kind: "drift", from: "bottom", shapes: ["circle"], colors: ["#ffb347", "#ffd56b", "#ff9ec4"],
        size: [1.5, 3.5], life: [4000, 7000], rate: 5, vx: [-0.25, 0.25], vy: [-0.9, -0.4],
        gravity: 0, twinkle: true, glow: true,
      },
    ],
    burst: { count: 22, speed: 3 },
  },
  foresta: {
    label: "Lucciole che ti seguono",
    effects: [
      {
        kind: "ambient", shape: "circle", colors: ["#e8ff8a", "#b6ff6e", "#fff3a0"],
        count: 26, size: [2, 4], attraction: 0.5, glow: true,
      },
    ],
    mobile: [
      {
        kind: "drift", from: "bottom", shapes: ["circle"], colors: ["#d8ff7a", "#fff3a0"],
        size: [1.5, 3], life: [3000, 5000], rate: 2, vx: [-0.3, 0.3], vy: [-0.6, -0.2],
        gravity: 0, twinkle: true, glow: true,
      },
    ],
    burst: { count: 16, speed: 2 },
  },
  caramella: {
    label: "Scia di cuoricini e stelline",
    effects: [
      {
        kind: "trail", shapes: ["heart", "star"], colors: ["#ff8fc7", "#ffb3d9", "#8fd3ff", "#c9a7ff"],
        size: [7, 13], life: [700, 1200], gravity: 0.015, spread: 1, rate: 5,
      },
    ],
    mobile: [
      {
        kind: "drift", from: "bottom", shapes: ["heart", "heart", "star"],
        colors: ["#ff8fc7", "#ffb3d9", "#8fd3ff", "#c9a7ff"],
        size: [6, 12], life: [5000, 8000], rate: 2.2, vx: [-0.3, 0.3], vy: [-1.1, -0.6],
        gravity: 0, twinkle: true,
      },
    ],
    burst: { count: 14, speed: 3.5 },
  },
  vulcano: {
    label: "Scintille di brace che salgono",
    effects: [
      { kind: "glow", color: "oklch(0.65 0.22 30 / 0.25)", radius: 360 },
      {
        kind: "trail", shapes: ["spark", "circle"], colors: ["#ffcf5c", "#ff8a1f", "#ff4d1a"],
        size: [2, 4], life: [600, 1300], gravity: -0.035, spread: 1.4, rate: 14, glow: true,
      },
    ],
    mobile: [
      {
        kind: "drift", from: "bottom", shapes: ["spark", "circle"], colors: ["#ffcf5c", "#ff8a1f", "#ff4d1a"],
        size: [1.5, 3.5], life: [2500, 4500], rate: 9, vx: [-0.6, 0.6], vy: [-2.4, -1.2],
        gravity: -0.004, glow: true,
      },
    ],
    burst: { count: 30, speed: 4 },
  },
  neon: {
    label: "Scia al neon elettrica",
    effects: [
      { kind: "glow", color: "oklch(0.7 0.25 335 / 0.22)", radius: 380 },
      {
        kind: "trail", shapes: ["circle"], colors: ["#ff3df2", "#38f9ff", "#a66bff"],
        size: [3, 6], life: [350, 650], gravity: 0, spread: 0.25, rate: 22, glow: true,
      },
    ],
    mobile: [
      {
        kind: "drift", from: "top", shapes: ["streak"], colors: ["#ff3df2", "#38f9ff", "#a66bff"],
        size: [1.6, 2.6], life: [1800, 2800], rate: 10, vx: [0, 0], vy: [4, 7],
        gravity: 0, glow: true,
      },
    ],
    burst: { count: 16, speed: 10, lines: true },
  },
  reale: {
    label: "Brillantini d'oro",
    effects: [
      {
        kind: "trail", shapes: ["sparkle"], colors: ["#ffe27a", "#fff4c2", "#e8b4ff"],
        size: [6, 12], life: [700, 1200], gravity: 0.02, spread: 0.9, rate: 6, glow: true,
      },
    ],
    mobile: [
      {
        kind: "drift", from: "anywhere", shapes: ["sparkle"], colors: ["#ffe27a", "#fff4c2", "#e8b4ff"],
        size: [5, 11], life: [1400, 2400], rate: 4, vx: [0, 0], vy: [-0.1, 0.1],
        gravity: 0, twinkle: true, glow: true,
      },
    ],
    burst: { count: 18, speed: 3 },
  },
  aurora: {
    label: "Stelle cadenti e cielo che si illumina",
    effects: [
      { kind: "glow", color: "oklch(0.75 0.15 170 / 0.22)", radius: 460 },
      {
        kind: "ambient", shape: "sparkle", colors: ["#d6fff0", "#c7b8ff", "#9ee7ff"],
        count: 30, size: [4, 8], attraction: -0.6, glow: true,
      },
      {
        kind: "trail", shapes: ["sparkle", "circle"], colors: ["#7dffcf", "#b99cff", "#8fe3ff"],
        size: [3, 8], life: [600, 1000], gravity: 0.01, spread: 0.6, rate: 7,
      },
    ],
    mobile: [
      {
        kind: "drift", from: "top-left", shapes: ["streak"], colors: ["#e9fff8", "#c7b8ff", "#9ee7ff"],
        size: [1.6, 2.4], life: [1100, 1600], rate: 0.8, vx: [5, 7], vy: [2.5, 3.5],
        gravity: 0, glow: true,
      },
    ],
    burst: { count: 20, speed: 3 },
  },
};
