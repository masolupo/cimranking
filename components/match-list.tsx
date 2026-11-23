import Link from "next/link";
import { Trophy } from "lucide-react";
import { ActionButton } from "@/components/action-button";
import { PlayerAvatar } from "@/components/player-avatar";
import { deleteMatch } from "@/app/actions";
import type { MatchRow, PlayerCard } from "@/lib/types";
import { formatDate } from "@/lib/utils-app";

export function MatchList({
  matches,
  players,
  canDelete = false,
  showGame = true,
}: {
  matches: MatchRow[];
  players: Map<string, PlayerCard>;
  /** solo l'admin può cancellare le partite */
  canDelete?: boolean;
  showGame?: boolean;
}) {
  if (matches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nessuna partita registrata.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-xl border bg-card">
      {matches.map((m) => {
        const winnerIds = new Set(m.match_winners.map((w) => w.player_id));
        const winners = [...winnerIds].map((id) => players.get(id)).filter((p): p is PlayerCard => !!p);
        const others = m.match_players
          .map((mp) => players.get(mp.player_id))
          .filter((p): p is PlayerCard => !!p && !winnerIds.has(p.id));

        return (
          <li key={m.id} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>
                {showGame && m.game && (
                  <>
                    <Link href={`/giochi/${m.game.slug}`} className="font-medium text-foreground hover:underline">
                      {m.game.name}
                    </Link>
                    {" · "}
                  </>
                )}
                {formatDate(m.played_at)}
              </span>
              {canDelete && (
                <ActionButton
                  variant="ghost"
                  size="sm"
                  action={deleteMatch.bind(null, m.id)}
                  confirmText="Eliminare questa partita? Le monete verranno stornate."
                >
                  Elimina
                </ActionButton>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {winners.map((winner) => (
                <Link key={winner.id} href={`/profilo/${winner.id}`} className="flex items-center gap-2 pt-2">
                  <PlayerAvatar player={winner} size="sm" />
                  <span className="font-semibold">{winner.display_name}</span>
                  <Trophy className="size-4 text-amber-500" aria-label="vincitore" />
                </Link>
              ))}
              {others.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  contro {others.map((p) => p.display_name).join(", ")}
                </span>
              )}
            </div>
            {m.notes && <p className="text-sm italic text-muted-foreground">“{m.notes}”</p>}
          </li>
        );
      })}
    </ul>
  );
}
