import Link from "next/link";
import { PlayerAvatar } from "@/components/player-avatar";
import type { LeaderboardRow } from "@/lib/types";
import { cn } from "@/lib/utils";

type Place = 1 | 2 | 3;
type AvatarSize = "sm" | "md" | "mdl" | "lg";

/** Stile di ogni gradino: 1° oro, 2° argento, 3° bronzo. */
const STEPS = {
  1: {
    height: "h-36 sm:h-44",
    block: "from-[#ffe27a] via-[#f5b82e] to-[#b7791f] text-[#4a2c00]",
    glow: "shadow-[0_0_40px_-6px_rgb(245_184_46/0.7)]",
    avatar: "lg" as AvatarSize,
    label: "1°",
  },
  2: {
    height: "h-24 sm:h-32",
    block: "from-[#f1f5f9] via-[#cbd5e1] to-[#8a97a8] text-[#1e293b]",
    glow: "shadow-[0_0_28px_-8px_rgb(203_213_225/0.6)]",
    avatar: "mdl" as AvatarSize,
    label: "2°",
  },
  3: {
    height: "h-16 sm:h-24",
    block: "from-[#f3b27a] via-[#c47a3a] to-[#8a4b1c] text-[#fff4e8]",
    glow: "shadow-[0_0_24px_-8px_rgb(196_122_58/0.6)]",
    avatar: "mdl" as AvatarSize,
    label: "3°",
  },
};

/** Versione compatta (home): gradini più bassi e avatar più piccoli. */
const SMALL = {
  1: { height: "h-20", avatar: "md" as AvatarSize },
  2: { height: "h-14", avatar: "sm" as AvatarSize },
  3: { height: "h-10", avatar: "sm" as AvatarSize },
};

/** Avatar un po' più piccoli quando più giocatori condividono lo stesso gradino. */
const SHRINK: Record<AvatarSize, AvatarSize> = { lg: "mdl", mdl: "md", md: "sm", sm: "sm" };

/**
 * Podio delle prime tre posizioni: 2° a sinistra, 1° al centro e più in alto, 3° a destra.
 * Chi è a pari merito (stessi punti) sta sullo stesso gradino, uno accanto all'altro;
 * il gradino si allarga in proporzione.
 */
export function Podium({ rows, size = "default" }: { rows: LeaderboardRow[]; size?: "default" | "sm" }) {
  const small = size === "sm";
  if (rows.length < 2) return null;

  const places = ([1, 2, 3] as const)
    .map((place) => ({ place, group: rows.filter((r) => r.rank === place) }))
    .filter((p) => p.group.length > 0);

  return (
    <section aria-label="Podio" className={small ? "mb-4 pt-6" : "mb-8 pt-10"}>
      <ol className={cn("mx-auto flex items-end", small ? "max-w-sm gap-2" : "max-w-xl gap-2 sm:gap-4")}>
        {places.map(({ place, group }) => (
          <Step key={place} place={place} group={group} small={small} />
        ))}
      </ol>
    </section>
  );
}

function Step({ place, group, small }: { place: Place; group: LeaderboardRow[]; small: boolean }) {
  const s = small ? { ...STEPS[place], ...SMALL[place] } : STEPS[place];
  const shared = group.length > 1;
  const avatar = group.length > 2 ? SHRINK[SHRINK[s.avatar]] : shared ? SHRINK[s.avatar] : s.avatar;

  return (
    <li
      className={cn("flex min-w-0 flex-col items-center", place === 1 ? "order-2" : place === 2 ? "order-1" : "order-3")}
      // un gradino con più giocatori è più largo
      style={{ flex: `${Math.min(group.length, 3)} 1 0%` }}
      aria-label={`${place}° posto${shared ? " a pari merito" : ""}`}
    >
      <div className={cn("flex w-full min-w-0 flex-col items-center", small ? "mb-2 gap-1" : "mb-3 gap-1.5")}>
        <div className={cn("flex w-full min-w-0 flex-wrap items-end justify-center", small ? "gap-x-1.5 gap-y-2" : "gap-x-2 gap-y-3")}>
          {group.map((row) => (
            <Link
              key={row.player_id}
              href={`/profilo/${row.player_id}`}
              className={cn(
                "podium-player group flex min-w-0 flex-col items-center text-center",
                shared ? "max-w-[6.5rem] flex-1 basis-0" : "max-w-full",
                small ? "gap-1" : "gap-2",
                place === 1 && "podium-winner",
              )}
            >
              <PlayerAvatar player={row} size={avatar} />
              <span className="w-full min-w-0">
                <span
                  className={cn(
                    "block truncate font-heading font-semibold group-hover:underline",
                    small || shared ? "text-xs sm:text-sm" : place === 1 ? "text-base sm:text-lg" : "text-sm sm:text-base",
                  )}
                >
                  {row.display_name}
                </span>
                {row.title && !small && !shared && (
                  <span className="block truncate text-[11px] font-semibold text-gold">{row.title}</span>
                )}
              </span>
            </Link>
          ))}
        </div>
        <span className={cn("podium-player tabular-nums text-muted-foreground", small ? "text-xs" : "text-sm")}>
          <span className="font-bold text-foreground">{group[0].points}</span> pt
          {shared && !small && <span className="ml-1">· pari merito</span>}
        </span>
      </div>
      <div
        className={cn(
          "podium-step relative flex w-full items-start justify-center overflow-hidden rounded-t-xl bg-gradient-to-b pt-2",
          s.height,
          s.block,
          s.glow,
        )}
        style={{ animationDelay: place === 1 ? "0.25s" : place === 2 ? "0.1s" : "0s" }}
      >
        <span className={cn("font-heading font-black drop-shadow-sm", small ? "text-lg" : "text-3xl sm:text-4xl")}>
          {s.label}
        </span>
        {place === 1 && <span aria-hidden="true" className="podium-shine" />}
      </div>
    </li>
  );
}
