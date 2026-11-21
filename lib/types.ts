export type Cosmetics = {
  crown: string | null;
  frame: string | null;
  title: string | null;
  aura?: string | null;
};

export type PlayerCard = Cosmetics & {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  coins: number;
};

export type LeaderboardRow = Cosmetics & {
  player_id: string;
  played: number;
  wins: number;
  points: number;
  win_rate: number;
  username: string;
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
  winner_id: string;
  game: { name: string; slug: string; cover_path: string | null } | null;
  match_players: { player_id: string }[];
};

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  coins: number;
  onboarded: boolean;
  preferences: Record<string, unknown>;
};
