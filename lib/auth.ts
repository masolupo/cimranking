import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Utente loggato + profilo. Reindirizza a /login o all'onboarding se serve. */
export const requireProfile = cache(async (opts?: { allowNotOnboarded?: boolean }) => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, coins, onboarded, preferences")
    .eq("id", userId)
    .single<Profile>();

  if (!profile) redirect("/login");
  if (!profile.onboarded && !opts?.allowNotOnboarded) redirect("/benvenuto");

  return { supabase, profile };
});
