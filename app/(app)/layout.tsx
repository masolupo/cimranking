import { NavLinks } from "@/components/nav-links";
import { PreferencesSync } from "@/components/preferences-sync";
import { SiteHeader } from "@/components/site-header";
import { requireProfile } from "@/lib/auth";
import { getPreferences } from "@/lib/preferences-server";
import type { PlayerCard } from "@/lib/types";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { supabase, profile } = await requireProfile();
  const [{ data: me }, prefs] = await Promise.all([
    supabase.from("player_cards").select("*").eq("id", profile.id).single<PlayerCard>(),
    getPreferences(supabase, profile),
  ]);

  const card: PlayerCard = me ?? { ...profile, crown: null, frame: null, title: null };

  return (
    <>
      <PreferencesSync prefs={prefs} />
      <SiteHeader me={card} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 md:pb-12">{children}</main>
      <NavLinks variant="bottom" />
    </>
  );
}
