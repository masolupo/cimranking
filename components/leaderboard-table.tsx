import { PlayerChip } from "@/components/player-chip";
import type { LeaderboardRow } from "@/lib/types";
import { cn } from "@/lib/utils";

const MEDALS = [
  "bg-gold text-gold-foreground",
  "bg-zinc-300 text-zinc-800",
  "bg-amber-700 text-amber-50",
];

const GRID = "grid grid-cols-[2rem_1fr_3.5rem] sm:grid-cols-[2.5rem_1fr_4rem_4rem_4rem_4rem]";

export function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Ancora nessuna partita. Registrane una per aprire la classifica!
      </p>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <div
        className={cn(
          GRID,
          "items-center gap-2 border-b px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground",
        )}
      >
        <span>#</span>
        <span>Giocatore</span>
        <span className="text-right">Punti</span>
        <span className="hidden text-right sm:block">Vittorie</span>
        <span className="hidden text-right sm:block">Partite</span>
        <span className="hidden text-right sm:block">% vitt.</span>
      </div>
      <ol className="divide-y">
        {rows.map((row, i) => (
          <li key={row.player_id} className={cn(GRID, "items-center gap-x-2 px-3 py-3")}>
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-sm font-bold tabular-nums",
                MEDALS[row.rank - 1] ?? "text-muted-foreground",
              )}
              title={rows[i - 1]?.rank === row.rank || rows[i + 1]?.rank === row.rank ? "Pari merito" : undefined}
            >
              {row.rank}
            </span>
            <PlayerChip player={row} className="pt-2" />
            <span className="text-right text-lg font-bold tabular-nums">{row.points}</span>
            <span className="hidden text-right tabular-nums sm:block">{row.wins}</span>
            <span className="hidden text-right tabular-nums sm:block">{row.played}</span>
            <span className="hidden text-right tabular-nums text-muted-foreground sm:block">
              {row.win_rate}%
            </span>
            <span className="col-span-2 col-start-2 pl-12 text-xs text-muted-foreground sm:hidden">
              {row.wins} vittorie · {row.played} partite · {row.win_rate}%
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
