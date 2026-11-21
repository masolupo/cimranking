import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { CoinBadge, CoinIcon } from "@/components/coin-badge";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { MatchList } from "@/components/match-list";
import { SectionTitle } from "@/components/page-header";
import { PlayerAvatar } from "@/components/player-avatar";
import { Podium } from "@/components/podium";
import { buttonVariants } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { getMatches, getOverallLeaderboard, getPlayerCards, playersById } from "@/lib/data";
import { RULES } from "@/lib/rules";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const { supabase, profile } = await requireProfile();
  const [leaderboard, matches, players] = await Promise.all([
    getOverallLeaderboard(supabase),
    getMatches(supabase, { limit: 8 }),
    getPlayerCards(supabase),
  ]);

  const me = players.find((p) => p.id === profile.id) ?? { ...profile, crown: null, frame: null, title: null };
  const rankIndex = leaderboard.findIndex((r) => r.player_id === profile.id);
  const myRow = rankIndex >= 0 ? leaderboard[rankIndex] : null;

  return (
    <>
      <section className="mt-4 mb-6 flex flex-wrap items-center gap-x-4 gap-y-4">
        <Link href={`/profilo/${me.username}`} className="shrink-0" aria-label="Il mio profilo">
          <PlayerAvatar player={me} size="mdl" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-3xl font-bold tracking-tight">
            {me.display_name}
          </h1>
          {me.title && <p className="font-semibold text-gold">{me.title}</p>}
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
            {myRow ? (
              <>
                <span>
                  <strong className="text-foreground">{rankIndex + 1}°</strong> in classifica
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {myRow.wins} {myRow.wins === 1 ? "vittoria" : "vittorie"}
                </span>
              </>
            ) : (
              <span>Ancora nessuna partita</span>
            )}
            <span aria-hidden="true">·</span>
            <Link href="/negozio" aria-label={`${profile.coins} monete, vai al negozio`}>
              <CoinBadge amount={profile.coins} />
            </Link>
          </p>
        </div>
        <Link
          href="/partite/nuova"
          className={cn(buttonVariants({ size: "lg" }), "h-11 w-full px-4 sm:w-auto")}
        >
          <Plus /> Registra partita
        </Link>
      </section>

      <div className="mb-8 flex flex-wrap gap-3 rounded-xl border bg-accent/60 p-4 text-sm">
        <span className="inline-flex items-center gap-1">
          vittoria = {RULES.win.points} punti + {RULES.win.coins} <CoinIcon />
        </span>
        <span className="inline-flex items-center gap-1">
          partecipazione = {RULES.participation.points} punto + {RULES.participation.coins} <CoinIcon />
        </span>
        <Link href="/negozio" className="font-medium text-primary underline-offset-4 hover:underline">
          Spendi le monete nel negozio
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionTitle
            action={
              <Link href="/classifica" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Tutta la classifica <ArrowRight className="size-4" />
              </Link>
            }
          >
            Classifica generale
          </SectionTitle>
          <Podium rows={leaderboard} size="sm" />
          <LeaderboardTable rows={leaderboard.slice(0, 5)} />
        </section>
        <section>
          <SectionTitle>Ultime partite</SectionTitle>
          <MatchList matches={matches} players={playersById(players)} currentUserId={profile.id} />
        </section>
      </div>
    </>
  );
}
