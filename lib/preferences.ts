import themes from "@/lib/themes.json";

export const THEMES = themes as unknown as Record<
  string,
  { name: string; bg: [number, number]; primary: [number, number]; accent: number; lava: number[] }
>;
export const DEFAULT_THEME = "oceano";

export const FONT_OPTIONS = [
  { value: "moderno", label: "Moderno", varName: "--font-bricolage" },
  { value: "giocoso", label: "Giocoso", varName: "--font-fredoka" },
  { value: "elegante", label: "Elegante", varName: "--font-fraunces" },
  { value: "pixel", label: "Pixel", varName: "--font-pixelify" },
  { value: "semplice", label: "Semplice", varName: "--font-sans" },
] as const;

export const RADIUS_OPTIONS = [
  { value: "squadrati", label: "Squadrati" },
  { value: "morbidi", label: "Morbidi" },
  { value: "tondi", label: "Tondi" },
] as const;

export const LAVA_SPEED_OPTIONS = [
  { value: "lenta", label: "Lenta" },
  { value: "normale", label: "Normale" },
  { value: "veloce", label: "Veloce" },
] as const;

export const LAVA_INTENSITY_OPTIONS = [
  { value: "tenue", label: "Tenue" },
  { value: "normale", label: "Normale" },
  { value: "forte", label: "Forte" },
] as const;

export type Preferences = {
  theme: string;
  font: (typeof FONT_OPTIONS)[number]["value"];
  radius: (typeof RADIUS_OPTIONS)[number]["value"];
  lava: boolean;
  effects: boolean;
  lavaSpeed: (typeof LAVA_SPEED_OPTIONS)[number]["value"];
  lavaIntensity: (typeof LAVA_INTENSITY_OPTIONS)[number]["value"];
};

/** Preferenze salvate nel profilo (il tema invece è l'oggetto "theme" equipaggiato). */
export type StoredPreferences = Omit<Preferences, "theme">;

export const DEFAULT_PREFERENCES: Preferences = {
  theme: DEFAULT_THEME,
  font: "moderno",
  radius: "morbidi",
  lava: true,
  effects: true,
  lavaSpeed: "veloce",
  lavaIntensity: "forte",
};

export const PREFS_COOKIE = "tdc-prefs";

function pick<T extends string>(value: unknown, allowed: readonly { value: T }[], fallback: T): T {
  return allowed.some((o) => o.value === value) ? (value as T) : fallback;
}

/** Valida dati qualsiasi (cookie, DB) e riempie i valori mancanti. */
export function normalizePreferences(raw: unknown): Preferences {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_PREFERENCES;
  return {
    theme: typeof r.theme === "string" && r.theme in THEMES ? r.theme : d.theme,
    font: pick(r.font, FONT_OPTIONS, d.font),
    radius: pick(r.radius, RADIUS_OPTIONS, d.radius),
    lava: typeof r.lava === "boolean" ? r.lava : d.lava,
    effects: typeof r.effects === "boolean" ? r.effects : d.effects,
    lavaSpeed: pick(r.lavaSpeed, LAVA_SPEED_OPTIONS, d.lavaSpeed),
    lavaIntensity: pick(r.lavaIntensity, LAVA_INTENSITY_OPTIONS, d.lavaIntensity),
  };
}

export function parsePreferencesCookie(value: string | undefined): Preferences {
  if (!value) return DEFAULT_PREFERENCES;
  try {
    return normalizePreferences(JSON.parse(decodeURIComponent(value)));
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function serializePreferences(p: Preferences) {
  return encodeURIComponent(JSON.stringify(p));
}

/** Attributi da mettere su <html>. */
export function htmlAttributes(p: Preferences) {
  return {
    "data-theme": p.theme,
    "data-font": p.font,
    "data-radius": p.radius,
    "data-lava": p.lava ? "on" : "off",
    "data-effects": p.effects ? "on" : "off",
    "data-lava-speed": p.lavaSpeed,
    "data-lava-intensity": p.lavaIntensity,
  } as const;
}

/** Colore di anteprima di un tema (per i pallini nelle card). */
export function themeSwatches(id: string) {
  const t = THEMES[id] ?? THEMES[DEFAULT_THEME];
  return [
    `oklch(0.5 ${t.primary[1]} ${t.primary[0]})`,
    `oklch(0.8 0.14 ${t.accent})`,
    ...t.lava.map((h) => `oklch(0.7 0.15 ${h})`),
  ];
}
