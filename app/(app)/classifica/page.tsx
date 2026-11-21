import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { Podium } from "@/components/podium";
import { requireProfile } from "@/lib/auth";
import { getOverallLeaderboard } from "@/lib/data";
import { RULES } from "@/lib/rules";
import { publicImageUrl } from "@/lib/storage";
import type { Game } from "@/lib/types";

export const metadata: Metadata = { title: "Classifica generale" };

export default async function ClassificaPage() {
  const { supabase } = await requireProfile();
  const [rows, { data: games }] = await Promise.all([
    getOverallLeaderboard(supabase),
    supabase.from("games").select("*").order("name").returns<Game[]>(),
  ]);

  return (
    <>
      <PageHeader
        title="Classifica generale"
        description={`Tutti i giochi insieme: ${RULES.win.points} punti per vittoria, ${RULES.participation.points} per partecipazione.`}
      />
      <Podium rows={rows} />
      <LeaderboardTable rows={rows} />

      {games && games.length > 0 && (
        <section className="mt-10">
          <SectionTitle>Classifiche per gioco</SectionTitle>
          <ul className="flex flex-wrap gap-2">
            {games.map((g) => {
              const src = publicImageUrl("game-covers", g.cover_path);
              return (
                <li key={g.id}>
                  <Link
                    href={`/giochi/${g.slug}`}
                    className="flex min-h-11 items-center gap-2 rounded-full border bg-card py-1 pr-4 pl-1 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    {src ? (
                      <Image src={src} alt="" width={36} height={36} className="size-9 rounded-full object-cover" />
                    ) : (
                      <span className="size-9 rounded-full bg-secondary" />
                    )}
                    {g.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
