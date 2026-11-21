/**
 * Caricamento col logo: il dado accanto a "Cim Ranking" con i pallini che si accendono in giro.
 * Usa i colori del tema attivo. Compare con un piccolo ritardo, così sui cambi pagina
 * velocissimi non lampeggia.
 */
export function DiceLoader({ label = "Caricamento" }: { label?: string }) {
  // ordine in senso orario: alto-sx, alto-dx, basso-dx, basso-sx
  const dots = [
    { cx: 11, cy: 11, color: "var(--primary-foreground)" },
    { cx: 21, cy: 11, color: "var(--gold)" },
    { cx: 21, cy: 21, color: "var(--primary-foreground)" },
    { cx: 11, cy: 21, color: "var(--gold)" },
  ];

  return (
    <div role="status" className="dice-loader flex flex-col items-center justify-center gap-3 py-24">
      <svg viewBox="0 0 32 32" className="dice-loader-box size-14" aria-hidden="true">
        <rect x="3" y="3" width="26" height="26" rx="7" fill="var(--primary)" />
        {dots.map((d, i) => (
          <circle
            key={i}
            className="dice-loader-dot"
            cx={d.cx}
            cy={d.cy}
            r="2.6"
            fill={d.color}
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </svg>
      <span className="text-sm font-medium text-muted-foreground">{label}…</span>
    </div>
  );
}
