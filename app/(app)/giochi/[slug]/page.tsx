import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { GameCoverEditor } from "@/components/game-cover-editor";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Podium } from "@/components/podium";
import { MatchList } from "@/components/match-list";
import { SectionTitle } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { getGameLeaderboard, getMatches, getPlayerCards, playersById } from "@/lib/data";
import { publicImageUrl } from "@/lib/storage";
import type { Game } from "@/lib/types";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/giochi/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.replace(/-/g, " ") };
}

export default async function GamePage({ params }: PageProps<"/giochi/[slug]">) {
  const { slug } = await params;
  const { supabase, profile } = await requireProfile();

  const { data: game } = await supabase.from("games").select("*").eq("slug", slug).maybeSingle<Game>();
  if (!game) notFound();

  const [rows, matches, players] = await Promise.all([
    getGameLeaderboard(supabase, game.id),
    getMatches(supabase, { gameId: game.id, limit: 30 }),
    getPlayerCards(supabase),
  ]);

  const cover = publicImageUrl("game-covers", game.cover_path);
  const isOwner = game.created_by === profile.id;
  const champion = rows[0];

  return (
    <>
      <div className="mb-8 grid gap-6 md:grid-cols-[minmax(0,320px)_1fr] md:items-end">
        {isOwner ? (
          <GameCoverEditor gameId={game.id} currentUrl={cover} />
        ) : (
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-secondary">
            {cover && (
              <Image src={cover} alt={game.name} fill sizes="(min-width: 768px) 320px, 100vw" className="object-cover" priority />
            )}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-muted-foreground">Classifica di</p>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-balance">{game.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {matches.length === 1 ? "1 partita giocata" : `${matches.length} partite giocate`}
            {champion && (
              <>
                {" · campione attuale: "}
                <Link href={`/profilo/${champion.player_id}`} className="font-semibold text-foreground hover:underline">
                  {champion.display_name}
                </Link>
              </>
            )}
          </p>
          <Link
            href={`/partite/nuova?gioco=${game.slug}`}
            className={cn(buttonVariants({ size: "lg" }), "mt-4 h-11 px-4")}
          >
            <Plus /> Registra una partita
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionTitle>Classifica</SectionTitle>
          <Podium rows={rows} />
          <LeaderboardTable rows={rows} />
        </section>
        <section>
          <SectionTitle>Storico partite</SectionTitle>
          <MatchList matches={matches} players={playersById(players)} canDelete={profile.is_admin} showGame={false} />
        </section>
      </div>
    </>
  );
}
