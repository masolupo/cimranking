/**
 * Scene animate di sfondo dei temi costosi (Vulcano, Neon, Aurora).
 * Solo CSS: sono tutte nel markup ma quelle del tema non attivo hanno display:none,
 * quindi non animano e non costano nulla. Stili in app/theme-extras.css.
 */

// numeri fissi (non casuali) così server e client producono lo stesso HTML
const spread = (n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => {
    // hash intero: stesso risultato su server e browser (niente errori di hydration)
    const r = (k: number) => (((i + 1) * 7919 + seed * 104729 + k * 15485863) % 997) / 997;
    return { left: `${((i / n) * 100 + r(1) * (100 / n)).toFixed(2)}%`, top: `${(r(2) * 100).toFixed(2)}%`, a: r(3), b: r(4) };
  });

const EMBERS = spread(16, 1);
const STARS = spread(28, 3);

export function ThemeScene() {
  return (
    <div aria-hidden="true" className="theme-scene pointer-events-none fixed inset-0 -z-[9] overflow-hidden">
      {/* VULCANO: calore che pulsa dal basso + braci che salgono */}
      <div className="scene scene-vulcano">
        <div className="vulcano-heat" />
        {EMBERS.map((e, i) => (
          <span
            key={i}
            className="vulcano-ember"
            style={{
              left: e.left,
              width: `${3 + e.a * 4}px`,
              height: `${3 + e.a * 4}px`,
              animationDuration: `${7 + e.b * 6}s`,
              animationDelay: `${-e.a * 12}s`,
            }}
          />
        ))}
      </div>

      {/* NEON: sole + griglia che scorre (synthwave), righe da monitor */}
      <div className="scene scene-neon">
        <div className="neon-sun" />
        <div className="neon-floor">
          <div className="neon-plane">
            <div className="neon-grid" />
          </div>
        </div>
        <div className="neon-scanlines" />
        <div className="neon-scanbar" />
      </div>

      {/* AURORA: veli di luce che ondeggiano + stelle + stella cadente */}
      <div className="scene scene-aurora">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="aurora-star"
            style={{
              left: s.left,
              top: `calc(${s.top} * 0.7)`,
              animationDuration: `${2 + s.b * 4}s`,
              animationDelay: `${-s.a * 6}s`,
            }}
          />
        ))}
        <div className="aurora-band aurora-band-1" />
        <div className="aurora-band aurora-band-2" />
        <div className="aurora-band aurora-band-3" />
        <span className="aurora-shooting" />
      </div>
    </div>
  );
}
