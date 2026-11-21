import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Palette } from "lucide-react";
import { buyItem, equipItem, sellItem, unequipItem } from "@/app/actions";
import { ActionButton } from "@/components/action-button";
import { CoinBadge, CoinIcon } from "@/components/coin-badge";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { PlayerAvatar } from "@/components/player-avatar";
import { requireProfile } from "@/lib/auth";
import { sellPrice } from "@/lib/rules";
import type { PlayerCard, ShopItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Negozio" };

const SECTIONS: { type: ShopItem["type"]; title: string }[] = [
  { type: "aura", title: "Effetti animati" },
  { type: "crown", title: "Corone" },
  { type: "frame", title: "Cornici" },
  { type: "title", title: "Titoli" },
];

export default async function NegozioPage() {
  const { supabase, profile } = await requireProfile();
  const [{ data: items }, { data: owned }, { data: me }] = await Promise.all([
    supabase.from("shop_items").select("*").eq("active", true).order("sort").returns<ShopItem[]>(),
    supabase.from("user_items").select("item_id, equipped").eq("user_id", profile.id),
    supabase.from("player_cards").select("*").eq("id", profile.id).single<PlayerCard>(),
  ]);

  const ownedMap = new Map((owned ?? []).map((o) => [o.item_id as string, o.equipped as boolean]));
  const card = me ?? { ...profile, crown: null, frame: null, title: null };
  const themeCount = (items ?? []).filter((i) => i.type === "theme").length;

  return (
    <>
      <PageHeader
        title="Negozio"
        description="Vinci partite, guadagna monete, fatti notare."
        action={<CoinBadge amount={profile.coins} className="px-4 py-2 text-base" />}
      />

      <Link
        href="/personalizza"
        className="mb-10 flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[conic-gradient(var(--lava-1),var(--lava-2),var(--lava-3),var(--lava-1))]">
          <Palette className="size-6" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-heading font-semibold">Temi e personalizzazione</span>
          <span className="block text-sm text-muted-foreground">
            {themeCount} temi (alcuni gratis, altri da comprare), sfondo, font e forme.
          </span>
        </span>
        <ArrowRight className="size-5 text-muted-foreground" aria-hidden="true" />
      </Link>

      {SECTIONS.map((section) => {
        const list = (items ?? []).filter((i) => i.type === section.type);
        if (list.length === 0) return null;
        return (
          <section key={section.type} className="mb-10">
            <SectionTitle>{section.title}</SectionTitle>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((item) => {
                const isOwned = ownedMap.has(item.id);
                const isEquipped = ownedMap.get(item.id) === true;
                const affordable = profile.coins >= item.price;
                const preview = {
                  ...card,
                  crown: item.type === "crown" ? item.asset_key : card.crown,
                  frame: item.type === "frame" ? item.asset_key : card.frame,
                  aura: item.type === "aura" ? item.asset_key : card.aura,
                };
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border bg-card p-4",
                      isEquipped && "border-primary ring-1 ring-primary",
                    )}
                  >
                    <div className={cn("flex w-16 shrink-0 justify-center pt-5", item.type === "aura" && "w-20 py-4")}>
                      {item.type === "title" ? (
                        <span className="rounded-md bg-gold/25 px-2 py-1 text-center text-xs font-semibold">
                          {item.name}
                        </span>
                      ) : (
                        <PlayerAvatar player={preview} size="md" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-heading font-semibold">{item.name}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        {isOwned ? (
                          <span className="text-sm font-medium text-primary">
                            {isEquipped ? "Equipaggiato" : "Tuo"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold tabular-nums">
                            <CoinIcon /> {item.price}
                          </span>
                        )}
                        {isOwned ? (
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {item.price > 0 && (
                              <ActionButton
                                variant="ghost"
                                action={sellItem.bind(null, item.id)}
                                confirmText={`Vendere "${item.name}" per ${sellPrice(item.price)} monete?${isEquipped ? " Verrà tolto dal tuo avatar." : ""}`}
                              >
                                Vendi +{sellPrice(item.price)}
                              </ActionButton>
                            )}
                            {isEquipped ? (
                              <ActionButton variant="outline" action={unequipItem.bind(null, item.type)}>
                                Togli
                              </ActionButton>
                            ) : (
                              <ActionButton action={equipItem.bind(null, item.id)}>Equipaggia</ActionButton>
                            )}
                          </div>
                        ) : (
                          <ActionButton
                            action={buyItem.bind(null, item.id)}
                            disabled={!affordable}
                            confirmText={`Comprare "${item.name}" per ${item.price} monete?`}
                          >
                            {affordable ? "Compra" : `Mancano ${item.price - profile.coins}`}
                          </ActionButton>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}
