import { cn } from "@/lib/utils";

export function CoinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="var(--gold)" stroke="var(--gold-foreground)" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="var(--gold-foreground)" strokeWidth="1.2" opacity="0.5" />
      <path d="M12 8.5v7M9.5 10.5h5" stroke="var(--gold-foreground)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function CoinBadge({ amount, className }: { amount: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-gold/25 px-2.5 py-1 text-sm font-semibold tabular-nums",
        className,
      )}
    >
      <CoinIcon />
      {amount}
      <span className="sr-only">monete</span>
    </span>
  );
}
