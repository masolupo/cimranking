import Link from "next/link";
import { Trophy } from "lucide-react";
import { ActionButton } from "@/components/action-button";
import { PlayerAvatar } from "@/components/player-avatar";
import { deleteMatch } from "@/app/actions";
import { RULES } from "@/lib/rules";
import type { MatchRow, PlayerCard } from "@/lib/types";
import { formatDate } from "@/lib/utils-app";

export function MatchList({
  matches,
  players,
  currentUserId,
  showGame = true,
}: {
  matches: MatchRow[];
  players: Map<string, PlayerCard>;
  currentUserId: string;
  showGame?: boolean;
}) {
  if (matches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nessuna partita registrata.
      </p>
    );
  }

  // eslint-disable-next-line react-hooks/purity -- calcolato a ogni richiesta, va bene
  const now = Date.now();

  return (
    <ul className="divide-y rounded-xl border bg-card">
      {matches.map((m) => {
        const winner = players.get(m.winner_id);
        const others = m.match_players
          .map((mp) => players.get(mp.player_id))
          .filter((p): p is PlayerCard => !!p && p.id !== m.winner_id);
        const canDelete =
          m.created_by === currentUserId &&
          now - new Date(m.created_at).getTime() < RULES.deleteWindowHours * 3600_000;

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
                  confirmText="Cancellare questa partita? Le monete verranno stornate."
                >
                  Annulla
                </ActionButton>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {winner && (
                <Link href={`/profilo/${winner.username}`} className="flex items-center gap-2 pt-2">
                  <PlayerAvatar player={winner} size="sm" />
                  <span className="font-semibold">{winner.display_name}</span>
                  <Trophy className="size-4 text-amber-500" aria-label="vincitore" />
                </Link>
              )}
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
