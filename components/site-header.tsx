import Link from "next/link";
import { CoinBadge } from "@/components/coin-badge";
import { NavLinks } from "@/components/nav-links";
import { UserMenu } from "@/components/user-menu";
import type { PlayerCard } from "@/lib/types";

export function SiteHeader({ me }: { me: PlayerCard }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap font-heading text-base tracking-wide sm:text-lg"
        >
          <LogoMark className="size-7 sm:size-8" />
          <span className="brand-name">
            <span className="font-semibold">Cim</span>{" "}
            <span className="font-normal">Ranking</span>
          </span>
        </Link>
        <nav className="ml-6 hidden flex-1 md:block lg:ml-10" aria-label="Principale">
          <NavLinks variant="top" />
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/negozio" aria-label={`${me.coins} monete, vai al negozio`}>
            <CoinBadge amount={me.coins} />
          </Link>
          <UserMenu me={me} />
        </div>
      </div>
    </header>
  );
}

export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="3" y="3" width="26" height="26" rx="7" fill="var(--primary)" />
      <circle cx="11" cy="11" r="2.6" fill="var(--primary-foreground)" />
      <circle cx="21" cy="21" r="2.6" fill="var(--primary-foreground)" />
      <circle cx="21" cy="11" r="2.6" fill="var(--gold)" />
      <circle cx="11" cy="21" r="2.6" fill="var(--gold)" />
    </svg>
  );
}
