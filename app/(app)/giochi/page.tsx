import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Dices } from "lucide-react";
import { AddGameDialog } from "@/components/add-game-dialog";
import { PageHeader } from "@/components/page-header";
import { requireProfile } from "@/lib/auth";
import { publicImageUrl } from "@/lib/storage";
import type { Game } from "@/lib/types";

export const metadata: Metadata = { title: "Giochi" };

export default async function GiochiPage() {
  const { supabase } = await requireProfile();
  const [{ data: games }, { data: counts }] = await Promise.all([
    supabase.from("games").select("*").order("name").returns<Game[]>(),
    supabase.from("matches").select("game_id"),
  ]);

  const matchCount = new Map<string, number>();
  for (const m of counts ?? []) matchCount.set(m.game_id, (matchCount.get(m.game_id) ?? 0) + 1);

  return (
    <>
      <PageHeader
        title="Giochi"
        description="Ogni gioco ha la sua classifica."
        action={<AddGameDialog />}
      />
      {!games || games.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          <Dices className="size-10" aria-hidden="true" />
          <p>Nessun gioco ancora. Aggiungi il primo!</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {games.map((g, i) => {
            const src = publicImageUrl("game-covers", g.cover_path);
            const n = matchCount.get(g.id) ?? 0;
            return (
              <li key={g.id}>
                <Link
                  href={`/giochi/${g.slug}`}
                  className="group block overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <div className="relative aspect-[4/3] bg-secondary">
                    {src ? (
                      <Image
                        src={src}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
                        priority={i < 4}
                      />
                    ) : (
                      <Dices className="absolute inset-0 m-auto size-10 text-muted-foreground" aria-hidden="true" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate font-heading font-semibold">{g.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {n === 1 ? "1 partita" : `${n} partite`}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
