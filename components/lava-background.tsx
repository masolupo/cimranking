/**
 * Sfondo animato stile lava lamp: bolle sfocate che salgono e scendono lente.
 * Solo CSS (animazioni su transform), si ferma con "riduci movimento".
 */
const BLOBS = [
  { color: "var(--lava-1)", size: "55vmax", left: "-10%", top: "55%", duration: "10s", delay: "0s" },
  { color: "var(--lava-2)", size: "42vmax", left: "55%", top: "60%", duration: "12s", delay: "-3s" },
  { color: "var(--lava-3)", size: "38vmax", left: "20%", top: "10%", duration: "14s", delay: "-6s" },
  { color: "var(--lava-1)", size: "30vmax", left: "70%", top: "5%", duration: "11s", delay: "-2s" },
  { color: "var(--lava-2)", size: "26vmax", left: "35%", top: "70%", duration: "9s", delay: "-5s" },
];

export function LavaBackground() {
  return (
    <div aria-hidden="true" className="lava pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {BLOBS.map((b, i) => (
        <span
          key={i}
          className="lava-blob"
          style={
            {
              "--blob-color": b.color,
              width: b.size,
              height: b.size,
              left: b.left,
              top: b.top,
              animationDuration: `calc(${b.duration} * var(--lava-speed, 1)), calc(${b.duration} * 0.7 * var(--lava-speed, 1))`,
              animationDelay: `${b.delay}, ${b.delay}`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
