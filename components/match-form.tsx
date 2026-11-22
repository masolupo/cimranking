"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Trophy } from "lucide-react";
import { toast } from "sonner";
import { recordMatch } from "@/app/actions";
import { CoinIcon } from "@/components/coin-badge";
import { PlayerAvatar } from "@/components/player-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RULES } from "@/lib/rules";
import type { Game, PlayerCard } from "@/lib/types";
import { cn } from "@/lib/utils";

/** "Marco", "Marco e Giulia", "Marco, Giulia e Luca" */
function formatNames(names: string[]) {
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} e ${names.at(-1)}`;
}

function today() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function MatchForm({
  games,
  players,
  currentUserId,
  defaultGameSlug,
}: {
  games: Game[];
  players: PlayerCard[];
  currentUserId: string;
  defaultGameSlug?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [gameId, setGameId] = useState(
    games.find((g) => g.slug === defaultGameSlug)?.id ?? games[0]?.id ?? "",
  );
  const [playedAt, setPlayedAt] = useState(today);
  const [selected, setSelected] = useState<string[]>([currentUserId]);
  const [winnerIds, setWinnerIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  function togglePlayer(id: string) {
    const next = selected.includes(id) ? selected.filter((p) => p !== id) : [...selected, id];
    setSelected(next);
    setWinnerIds((prev) => prev.filter((w) => next.includes(w)));
  }

  function toggleWinner(id: string) {
    setWinnerIds((prev) => (prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]));
  }

  const selectedPlayers = players.filter((p) => selected.includes(p.id));
  const winnerNames = players.filter((p) => winnerIds.includes(p.id)).map((p) => p.display_name);
  const everyoneWon = winnerIds.length === selected.length;
  const canSubmit = gameId && selected.length >= 2 && winnerIds.length > 0 && !pending;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (winnerIds.length === 0) return;
    startTransition(async () => {
      const res = await recordMatch({ gameId, playedAt, playerIds: selected, winnerIds, notes });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success);
      const slug = games.find((g) => g.id === gameId)?.slug;
      router.push(slug ? `/giochi/${slug}` : "/");
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-8">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="grid gap-2">
          <Label htmlFor="game">Gioco</Label>
          <select
            id="game"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="played-at">Data</Label>
          <Input
            id="played-at"
            type="date"
            value={playedAt}
            max={today()}
            onChange={(e) => setPlayedAt(e.target.value)}
            className="h-11 text-base"
            required
          />
        </div>
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-3 text-sm font-medium">
          1. Chi ha giocato? <span className="text-muted-foreground">({selected.length} selezionati, minimo 2)</span>
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {players.map((p) => {
            const on = selected.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => togglePlayer(p.id)}
                className={cn(
                  "relative flex min-h-14 items-center gap-2 rounded-xl border bg-card px-3 pt-3 pb-2 text-left text-sm font-medium transition-colors",
                  "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  on ? "border-primary bg-primary/10" : "hover:bg-muted",
                )}
              >
                <PlayerAvatar player={p} size="sm" />
                <span className="truncate">{p.display_name}</span>
                {on && <Check className="absolute top-1.5 right-1.5 size-4 text-primary" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="grid gap-3" disabled={selected.length < 2}>
        <legend className="mb-3 text-sm font-medium">
          2. Chi ha vinto?{" "}
          <span className="text-muted-foreground">(anche più di uno, es. Avalon o giochi a squadre)</span>
        </legend>
        {selected.length < 2 ? (
          <p className="text-sm text-muted-foreground">Seleziona almeno 2 giocatori.</p>
        ) : (
          <div role="group" aria-label="Vincitori" className="flex flex-wrap gap-2">
            {selectedPlayers.map((p) => {
              const on = winnerIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggleWinner(p.id)}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                    "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    on ? "border-amber-500 bg-gold/30" : "bg-card hover:bg-muted",
                  )}
                >
                  {on && <Trophy className="size-4 text-amber-600" aria-hidden="true" />}
                  {p.display_name}
                </button>
              );
            })}
          </div>
        )}
      </fieldset>

      <div className="grid gap-2">
        <Label htmlFor="notes">Note (facoltative)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={280}
          placeholder="es. rimonta all'ultimo turno"
          className="text-base"
        />
      </div>

      <div className="sticky bottom-20 z-10 flex flex-col gap-2 rounded-xl border bg-background/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
        {winnerIds.length > 0 && (
          <p className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            {formatNames(winnerNames)} {winnerIds.length === 1 ? "riceve" : "ricevono"} +{RULES.win.points} punti e +
            {RULES.win.coins} <CoinIcon />
            {winnerIds.length > 1 && " a testa"}
            {!everyoneWon && (
              <>
                , gli altri +{RULES.participation.points} punto e +{RULES.participation.coins} <CoinIcon />
              </>
            )}
          </p>
        )}
        <Button type="submit" size="lg" className="h-12 text-base" disabled={!canSubmit}>
          {pending ? "Salvataggio…" : "Registra partita"}
        </Button>
      </div>
    </form>
  );
}
