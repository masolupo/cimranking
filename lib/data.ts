import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeaderboardRow, MatchRow, PlayerCard } from "@/lib/types";

const MATCH_SELECT =
  "id, played_at, created_at, created_by, notes, game:games(name, slug, cover_path), match_players(player_id), match_winners(player_id)";

/** Ordine: posizione (pari merito sui punti), poi più vittorie, meno partite, nome. */
export async function getOverallLeaderboard(supabase: SupabaseClient, limit?: number) {
  let q = supabase
    .from("overall_standings")
    .select("*")
    .order("rank", { ascending: true })
    .order("wins", { ascending: false })
    .order("played", { ascending: true })
    .order("display_name", { ascending: true });
  if (limit) q = q.limit(limit);
  const { data } = await q.returns<LeaderboardRow[]>();
  return data ?? [];
}

export async function getGameLeaderboard(supabase: SupabaseClient, gameId: string) {
  const { data } = await supabase
    .from("game_standings")
    .select("*")
    .eq("game_id", gameId)
    .order("rank", { ascending: true })
    .order("wins", { ascending: false })
    .order("played", { ascending: true })
    .order("display_name", { ascending: true })
    .returns<LeaderboardRow[]>();
  return data ?? [];
}

export async function getMatches(
  supabase: SupabaseClient,
  opts: { gameId?: string; playerId?: string; limit?: number } = {},
) {
  let matchIds: string[] | null = null;
  if (opts.playerId) {
    const { data } = await supabase
      .from("match_players")
      .select("match_id")
      .eq("player_id", opts.playerId);
    matchIds = (data ?? []).map((r) => r.match_id as string);
    if (matchIds.length === 0) return [];
  }

  let q = supabase
    .from("matches")
    .select(MATCH_SELECT)
    .order("played_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 20);
  if (opts.gameId) q = q.eq("game_id", opts.gameId);
  if (matchIds) q = q.in("id", matchIds);

  const { data } = await q.returns<MatchRow[]>();
  return data ?? [];
}

export async function getPlayerCards(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("player_cards")
    .select("*")
    .order("display_name")
    .returns<PlayerCard[]>();
  return data ?? [];
}

export function playersById(players: PlayerCard[]) {
  return new Map(players.map((p) => [p.id, p]));
}
