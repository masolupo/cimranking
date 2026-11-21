// Genera app/themes.css da lib/themes.json.
// Uso: node scripts/generate-themes.mjs
import { readFileSync, writeFileSync } from "node:fs";

const themes = JSON.parse(readFileSync(new URL("../lib/themes.json", import.meta.url), "utf8"));

const o = (l, c, h, a) => `oklch(${l} ${c} ${h}${a ? ` / ${a}` : ""})`;
// alpha delle bolle moltiplicata dall'intensità scelta dall'utente
const lava = (l, c, h, a) => `oklch(${l} ${c} ${h} / calc(${a} * var(--lava-boost, 1)))`;

function light({ bg: [bh, bc], primary: [ph, pc], accent, lava: lv }) {
  return {
    background: o(0.985, +(bc * 0.4).toFixed(3), bh),
    foreground: o(0.2, 0.02, bh),
    card: o(0.995, 0.004, bh),
    "card-foreground": o(0.2, 0.02, bh),
    popover: o(0.995, 0.004, bh),
    "popover-foreground": o(0.2, 0.02, bh),
    primary: o(0.5, pc, ph),
    "primary-foreground": o(0.985, 0, 0),
    secondary: o(0.95, 0.02, bh),
    "secondary-foreground": o(0.25, 0.03, bh),
    muted: o(0.955, 0.015, bh),
    "muted-foreground": o(0.48, 0.02, bh),
    accent: o(0.94, 0.05, accent),
    "accent-foreground": o(0.25, 0.03, bh),
    border: o(0.9, 0.015, bh),
    input: o(0.88, 0.015, bh),
    ring: o(0.6, pc, ph),
    "lava-1": lava(0.72, 0.15, lv[0], 0.45),
    "lava-2": lava(0.82, 0.14, lv[1], 0.45),
    "lava-3": lava(0.75, 0.13, lv[2], 0.38),
  };
}

function dark({ bg: [bh, bc], primary: [ph, pc], accent, lava: lv }) {
  return {
    background: o(0.17, bc, bh),
    foreground: o(0.96, 0.01, bh),
    card: o(0.215, +(bc * 1.2).toFixed(3), bh),
    "card-foreground": o(0.96, 0.01, bh),
    popover: o(0.215, +(bc * 1.2).toFixed(3), bh),
    "popover-foreground": o(0.96, 0.01, bh),
    primary: o(0.74, pc, ph),
    "primary-foreground": o(0.18, 0.03, ph),
    secondary: o(0.27, +(bc * 1.2).toFixed(3), bh),
    "secondary-foreground": o(0.96, 0.01, bh),
    muted: o(0.26, bc, bh),
    "muted-foreground": o(0.74, 0.02, bh),
    accent: o(0.3, 0.05, accent),
    "accent-foreground": o(0.96, 0.01, bh),
    ring: o(0.6, pc, ph),
    "lava-1": lava(0.6, 0.16, lv[0], 0.6),
    "lava-2": lava(0.72, 0.15, lv[1], 0.42),
    "lava-3": lava(0.58, 0.14, lv[2], 0.5),
  };
}

const block = (selector, vars) =>
  `${selector} {\n${Object.entries(vars).map(([k, v]) => `  --${k}: ${v};`).join("\n")}\n}\n`;

// Tema predefinito: si applica anche senza data-theme (es. pagina di login)
const DEFAULT_THEME = "oceano";

let css = "/* GENERATO da scripts/generate-themes.mjs: non modificare a mano */\n\n";
for (const [id, t] of Object.entries(themes)) {
  const isDefault = id === DEFAULT_THEME;
  css += block(`${isDefault ? ":root, " : ""}:root[data-theme="${id}"]`, light(t));
  css += block(`${isDefault ? ":root.dark, " : ""}:root[data-theme="${id}"].dark`, dark(t));
}

writeFileSync(new URL("../app/themes.css", import.meta.url), css);
console.log(`Generati ${Object.keys(themes).length} temi in app/themes.css`);
