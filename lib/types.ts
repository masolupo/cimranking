export type Cosmetics = {
  crown: string | null;
  frame: string | null;
  title: string | null;
  aura?: string | null;
};

export type PlayerCard = Cosmetics & {
  id: string;
  display_name: string;
  avatar_url: string | null;
  coins: number;
};

export type LeaderboardRow = Cosmetics & {
  player_id: string;
  /** posizione con pari merito: stessi punti = stessa posizione (1, 1, 2, ...) */
  rank: number;
  played: number;
  wins: number;
  points: number;
  win_rate: number;
  display_name: string;
  avatar_url: string | null;
};

export type Game = {
  id: string;
  name: string;
  slug: string;
  cover_path: string | null;
  created_by: string;
  created_at: string;
};

export type ShopItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: "crown" | "frame" | "title" | "theme" | "aura";
  price: number;
  asset_key: string;
  sort: number;
};

export type MatchRow = {
  id: string;
  played_at: string;
  created_at: string;
  created_by: string;
  notes: string | null;
  game: { name: string; slug: string; cover_path: string | null } | null;
  match_players: { player_id: string }[];
  match_winners: { player_id: string }[];
};

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  coins: number;
  onboarded: boolean;
  is_admin: boolean;
  preferences: Record<string, unknown>;
};
