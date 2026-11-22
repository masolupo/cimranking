"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizePreferences, type StoredPreferences } from "@/lib/preferences";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils-app";

type Result = { error?: string; success?: string };

async function authed() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  return { supabase, userId };
}

// ---------- Partite ----------

export async function recordMatch(input: {
  gameId: string;
  playedAt: string;
  playerIds: string[];
  winnerIds: string[];
  notes: string;
}): Promise<Result> {
  const { supabase } = await authed();
  const { error } = await supabase.rpc("record_match", {
    p_game_id: input.gameId,
    p_played_at: input.playedAt,
    p_player_ids: input.playerIds,
    p_winner_ids: input.winnerIds,
    p_notes: input.notes,
  });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { success: "Partita registrata!" };
}

export async function deleteMatch(matchId: string): Promise<Result> {
  const { supabase } = await authed();
  const { error } = await supabase.rpc("delete_match", { p_match_id: matchId });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { success: "Partita annullata, monete stornate." };
}

// ---------- Giochi ----------

export async function createGame(input: { name: string; coverPath: string | null }): Promise<Result & { slug?: string }> {
  const { supabase, userId } = await authed();
  const name = input.name.trim();
  if (!name) return { error: "Scrivi il nome del gioco" };

  const base = slugify(name) || "gioco";
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const { data } = await supabase.from("games").select("id").eq("slug", slug).maybeSingle();
    if (!data) break;
    slug = `${base}-${i}`;
  }

  if (input.coverPath && !input.coverPath.startsWith(`${userId}/`)) {
    return { error: "Immagine non valida" };
  }

  const { error } = await supabase
    .from("games")
    .insert({ name, slug, cover_path: input.coverPath, created_by: userId });
  if (error) return { error: error.message };

  revalidatePath("/giochi");
  return { success: "Gioco aggiunto!", slug };
}

export async function updateGameCover(gameId: string, coverPath: string): Promise<Result> {
  const { supabase, userId } = await authed();
  if (!coverPath.startsWith(`${userId}/`)) return { error: "Immagine non valida" };
  const { data, error } = await supabase
    .from("games")
    .update({ cover_path: coverPath })
    .eq("id", gameId)
    .select("slug")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Solo chi ha aggiunto il gioco può cambiare l'immagine" };
  revalidatePath("/", "layout");
  return { success: "Immagine aggiornata!" };
}

// ---------- Negozio ----------

export async function buyItem(itemId: string): Promise<Result> {
  const { supabase } = await authed();
  const { error } = await supabase.rpc("buy_item", { p_item_id: itemId });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { success: "Acquistato! Ora puoi equipaggiarlo." };
}

export async function sellItem(itemId: string): Promise<Result> {
  const { supabase } = await authed();
  const { data, error } = await supabase.rpc("sell_item", { p_item_id: itemId });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { success: `Venduto! +${data} monete` };
}

export async function equipItem(itemId: string): Promise<Result> {
  const { supabase } = await authed();
  const { error } = await supabase.rpc("equip_item", { p_item_id: itemId });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { success: "Equipaggiato!" };
}

export async function unequipItem(type: string): Promise<Result> {
  const { supabase } = await authed();
  const { error } = await supabase.rpc("unequip_item", { p_type: type });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}

// ---------- Personalizzazione ----------

export async function savePreferences(input: StoredPreferences): Promise<Result> {
  const { supabase, userId } = await authed();
  // tiene solo i campi validi (il tema si cambia equipaggiando l'oggetto)
  const { theme: _theme, ...clean } = normalizePreferences(input);
  void _theme;
  const { error } = await supabase.from("profiles").update({ preferences: clean }).eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}

// ---------- Profilo ----------

export async function updateProfile(input: {
  username: string;
  displayName: string;
  avatarPath?: string | null;
}): Promise<Result> {
  const { supabase, userId } = await authed();
  const username = input.username.trim().toLowerCase();
  const displayName = input.displayName.trim();

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return { error: "Username: 3-20 caratteri tra lettere minuscole, numeri e _" };
  }
  if (!displayName || displayName.length > 40) {
    return { error: "Il nome deve avere tra 1 e 40 caratteri" };
  }
  if (input.avatarPath && !input.avatarPath.startsWith(`${userId}/`)) {
    return { error: "Immagine non valida" };
  }

  const update: Record<string, unknown> = {
    username,
    display_name: displayName,
    onboarded: true,
  };
  if (input.avatarPath !== undefined) update.avatar_url = input.avatarPath;

  const { error } = await supabase.from("profiles").update(update).eq("id", userId);
  if (error) {
    if (error.code === "23505") return { error: "Username già preso" };
    return { error: error.message };
  }
  revalidatePath("/", "layout");
  return { success: "Profilo salvato!" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
