/**
 * Effetti animati attorno all'avatar. Tutto in CSS/SVG (vedi "Aure avatar" in globals.css),
 * le misure sono in percentuale così funzionano su ogni dimensione di avatar.
 */

const SPARKLES = [
  { x: 8, y: 12, s: 26, d: 0 },
  { x: 86, y: 6, s: 20, d: 0.5 },
  { x: 96, y: 62, s: 24, d: 1.1 },
  { x: 70, y: 96, s: 18, d: 1.6 },
  { x: 2, y: 74, s: 20, d: 0.8 },
  { x: 46, y: -6, s: 16, d: 1.9 },
];

const FLAMES = [
  { x: 22, d: 0, w: 26 },
  { x: 34, d: 0.45, w: 32 },
  { x: 50, d: 0.2, w: 36 },
  { x: 66, d: 0.65, w: 32 },
  { x: 78, d: 0.3, w: 26 },
  { x: 42, d: 0.9, w: 24 },
  { x: 58, d: 1.05, w: 24 },
  { x: 28, d: 1.2, w: 20 },
  { x: 72, d: 0.8, w: 20 },
];

// Saette attorno al cerchio (coordinate in un viewBox 100x100, avatar al centro)
const BOLTS = [
  { d: "M18 6 L26 20 L20 21 L30 36", delay: 0 },
  { d: "M88 18 L78 30 L85 32 L72 44", delay: 0.6 },
  { d: "M92 74 L80 70 L83 78 L68 76", delay: 1.2 },
  { d: "M10 70 L22 66 L18 76 L32 74", delay: 1.8 },
  { d: "M50 -2 L46 10 L53 11 L48 22", delay: 0.3 },
  { d: "M56 102 L52 90 L59 89 L54 78", delay: 1.5 },
];

export function AuraBack({ kind }: { kind: string }) {
  if (kind === "fire") {
    return (
      <span className="aura-fire" aria-hidden="true">
        {FLAMES.map((f, i) => (
          <span
            key={i}
            className="aura-flame"
            style={{ left: `${f.x}%`, width: `${f.w}%`, animationDelay: `${f.d}s` }}
          />
        ))}
      </span>
    );
  }
  if (kind === "lightning") return <span className="aura-electric" aria-hidden="true" />;
  if (kind === "sparkle") return <span className="aura-sparkle-glow" aria-hidden="true" />;
  return null;
}

export function AuraFront({ kind }: { kind: string }) {
  if (kind === "sparkle") {
    return (
      <span className="aura-layer" aria-hidden="true">
        {SPARKLES.map((s, i) => (
          <svg
            key={i}
            viewBox="0 0 24 24"
            className="aura-twinkle"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.s}%`, animationDelay: `${s.d}s` }}
          >
            <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="currentColor" />
          </svg>
        ))}
      </span>
    );
  }
  if (kind === "orbit") {
    return (
      <span className="aura-layer" aria-hidden="true">
        <span className="aura-orbit">
          <span className="aura-orbit-star" style={{ top: "-4%", left: "46%" }} />
          <span className="aura-orbit-star aura-orbit-star--small" style={{ bottom: "4%", left: "8%" }} />
          <span className="aura-orbit-star aura-orbit-star--gold" style={{ top: "40%", right: "-6%" }} />
        </span>
        <span className="aura-orbit aura-orbit--reverse">
          <span className="aura-orbit-star aura-orbit-star--small" style={{ top: "6%", left: "6%" }} />
          <span className="aura-orbit-star aura-orbit-star--gold" style={{ bottom: "-5%", right: "30%" }} />
        </span>
      </span>
    );
  }
  if (kind === "lightning") {
    return (
      <svg viewBox="0 0 100 100" className="aura-bolts" aria-hidden="true">
        {BOLTS.map((b, i) => (
          <path key={i} d={b.d} className="aura-bolt" style={{ animationDelay: `${b.delay}s` }} />
        ))}
      </svg>
    );
  }
  if (kind === "fire") {
    return (
      <span className="aura-layer" aria-hidden="true">
        {[15, 40, 62, 84].map((x, i) => (
          <span key={i} className="aura-ember" style={{ left: `${x}%`, animationDelay: `${i * 0.45}s` }} />
        ))}
      </span>
    );
  }
  return null;
}

/** Riflesso che attraversa l'avatar (dentro al cerchio). */
export function AuraShine({ kind }: { kind: string }) {
  if (kind !== "sparkle") return null;
  return <span className="aura-shine" aria-hidden="true" />;
}
