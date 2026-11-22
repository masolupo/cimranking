import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CoinBadge } from "@/components/coin-badge";
import { MatchList } from "@/components/match-list";
import { SectionTitle } from "@/components/page-header";
import { PlayerAvatar } from "@/components/player-avatar";
import { ProfileForm } from "@/components/profile-form";
import { requireProfile } from "@/lib/auth";
import { getMatches, getPlayerCards, playersById } from "@/lib/data";
import { publicImageUrl } from "@/lib/storage";
import type { LeaderboardRow, PlayerCard } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/profilo/[username]">): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

type GameStat = LeaderboardRow & { game_id: string };

export default async function ProfiloPage({ params }: PageProps<"/profilo/[username]">) {
  const { username } = await params;
  const { supabase, profile } = await requireProfile();

  const { data: player } = await supabase
    .from("player_cards")
    .select("*")
    .eq("username", username)
    .maybeSingle<PlayerCard>();
  if (!player) notFound();

  const [{ data: overall }, { data: perGame }, matches, players, { data: games }] = await Promise.all([
    supabase.from("overall_standings").select("*").eq("player_id", player.id).maybeSingle<LeaderboardRow>(),
    supabase
      .from("game_standings")
      .select("*")
      .eq("player_id", player.id)
      .order("points", { ascending: false })
      .returns<GameStat[]>(),
    getMatches(supabase, { playerId: player.id, limit: 15 }),
    getPlayerCards(supabase),
    supabase.from("games").select("id, name, slug"),
  ]);
  const gameById = new Map((games ?? []).map((g) => [g.id as string, g as { name: string; slug: string }]));

  const isMe = player.id === profile.id;
  const stats = [
    { label: "Punti", value: overall?.points ?? 0 },
    { label: "Vittorie", value: overall?.wins ?? 0 },
    { label: "Partite", value: overall?.played ?? 0 },
    { label: "% vittorie", value: `${overall?.win_rate ?? 0}%` },
  ];

  return (
    <>
      <div className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:text-left">
        <PlayerAvatar player={player} size="lg" className="mt-6" />
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-3xl font-bold tracking-tight">{player.display_name}</h1>
          <p className="text-muted-foreground">@{player.username}</p>
          {player.title && (
            <p className="mt-1 font-semibold text-amber-700 dark:text-gold">{player.title}</p>
          )}
        </div>
        <CoinBadge amount={player.coins} className="px-4 py-2 text-base" />
      </div>

      <dl className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <dt className="text-sm text-muted-foreground">{s.label}</dt>
            <dd className="font-heading text-2xl font-bold tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionTitle>Per gioco</SectionTitle>
          {!perGame || perGame.length === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nessuna partita ancora.
            </p>
          ) : (
            <ul className="divide-y rounded-xl border bg-card">
              {perGame.map((g) => {
                const game = gameById.get(g.game_id);
                return (
                <li key={g.game_id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <Link href={`/giochi/${game?.slug}`} className="min-w-0 truncate font-medium hover:underline">
                    {game?.name}
                  </Link>
                  <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                    {g.rank}° · <span className="font-semibold text-foreground">{g.points} pt</span> · {g.wins}/{g.played}{" "}
                    vinte
                  </span>
                </li>
                );
              })}
            </ul>
          )}
        </section>
        <section>
          <SectionTitle>Ultime partite</SectionTitle>
          <MatchList matches={matches} players={playersById(players)} currentUserId={profile.id} />
        </section>
      </div>

      {isMe && (
        <section className="mt-10 max-w-md">
          <SectionTitle>Modifica profilo</SectionTitle>
          <ProfileForm
            username={profile.username}
            displayName={profile.display_name}
            avatarUrl={publicImageUrl("avatars", profile.avatar_url)}
          />
        </section>
      )}
    </>
  );
}
