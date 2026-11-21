import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PersonalizeForm } from "@/components/personalize-form";
import { CoinBadge } from "@/components/coin-badge";
import { requireProfile } from "@/lib/auth";
import { getPreferences } from "@/lib/preferences-server";
import type { ShopItem } from "@/lib/types";

export const metadata: Metadata = { title: "Personalizza" };

export default async function PersonalizzaPage() {
  const { supabase, profile } = await requireProfile();
  const [{ data: themes }, { data: owned }, prefs] = await Promise.all([
    supabase
      .from("shop_items")
      .select("*")
      .eq("type", "theme")
      .eq("active", true)
      .order("sort")
      .returns<ShopItem[]>(),
    supabase.from("user_items").select("item_id").eq("user_id", profile.id).eq("item_type", "theme"),
    getPreferences(supabase, profile),
  ]);

  return (
    <>
      <PageHeader
        title="Personalizza"
        action={<CoinBadge amount={profile.coins} className="px-4 py-2 text-base" />}
      />
      <PersonalizeForm
        themes={themes ?? []}
        ownedIds={(owned ?? []).map((o) => o.item_id as string)}
        coins={profile.coins}
        initial={prefs}
      />
    </>
  );
}
