import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { MatchForm } from "@/components/match-form";
import { requireProfile } from "@/lib/auth";
import { getPlayerCards } from "@/lib/data";
import type { Game } from "@/lib/types";

export const metadata: Metadata = { title: "Registra partita" };

export default async function NuovaPartitaPage({ searchParams }: PageProps<"/partite/nuova">) {
  const { gioco } = await searchParams;
  const { supabase, profile } = await requireProfile();
  const [{ data: games }, players] = await Promise.all([
    supabase.from("games").select("*").order("name").returns<Game[]>(),
    getPlayerCards(supabase),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Registra partita" description="Chi ha giocato e chi ha vinto?" />
      {!games || games.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
          Prima aggiungi un gioco nella pagina{" "}
          <Link href="/giochi" className="font-medium text-primary underline">
            Giochi
          </Link>
          .
        </p>
      ) : (
        <MatchForm
          games={games}
          players={players}
          currentUserId={profile.id}
          defaultGameSlug={typeof gioco === "string" ? gioco : undefined}
        />
      )}
    </div>
  );
}
