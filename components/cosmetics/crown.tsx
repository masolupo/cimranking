import { cn } from "@/lib/utils";

const CROWN_COLORS: Record<string, { fill: string; stroke: string; gem: string }> = {
  bronze: { fill: "#c98a4b", stroke: "#7a4a1f", gem: "#f3d2a8" },
  silver: { fill: "#d7dde4", stroke: "#6b7785", gem: "#8fd3ff" },
  gold: { fill: "#f5c542", stroke: "#9a6b00", gem: "#e5484d" },
  diamond: { fill: "#a5f3fc", stroke: "#0e7490", gem: "#f0abfc" },
};

export function Crown({ variant, className }: { variant: string; className?: string }) {
  const c = CROWN_COLORS[variant] ?? CROWN_COLORS.gold;
  return (
    <svg viewBox="-2 -2 68 46" className={cn("drop-shadow-sm", className)} aria-hidden="true">
      <path
        d="M4 14 L18 26 L32 6 L46 26 L60 14 L54 40 L10 40 Z"
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="4" cy="13" r="4" fill={c.fill} stroke={c.stroke} strokeWidth="2" />
      <circle cx="32" cy="5" r="4" fill={c.fill} stroke={c.stroke} strokeWidth="2" />
      <circle cx="60" cy="13" r="4" fill={c.fill} stroke={c.stroke} strokeWidth="2" />
      <circle cx="32" cy="30" r="4.5" fill={c.gem} stroke={c.stroke} strokeWidth="1.5" />
      <circle cx="19" cy="33" r="3" fill={c.gem} stroke={c.stroke} strokeWidth="1.5" />
      <circle cx="45" cy="33" r="3" fill={c.gem} stroke={c.stroke} strokeWidth="1.5" />
    </svg>
  );
}

export const FRAME_STYLES: Record<string, string> = {
  emerald: "ring-emerald-500",
  ruby: "ring-rose-600",
};
