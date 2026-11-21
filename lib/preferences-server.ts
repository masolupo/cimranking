import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePreferences, type Preferences } from "@/lib/preferences";
import type { Profile } from "@/lib/types";

/** Preferenze complete dell'utente: tema equipaggiato + opzioni salvate nel profilo. */
export async function getPreferences(supabase: SupabaseClient, profile: Profile): Promise<Preferences> {
  const { data } = await supabase
    .from("user_items")
    .select("shop_items(asset_key)")
    .eq("user_id", profile.id)
    .eq("item_type", "theme")
    .eq("equipped", true)
    .maybeSingle<{ shop_items: { asset_key: string } | null }>();

  return normalizePreferences({ ...profile.preferences, theme: data?.shop_items?.asset_key });
}
