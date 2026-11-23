import Link from "next/link";
import { PlayerAvatar } from "@/components/player-avatar";
import { cn } from "@/lib/utils";

export type ChipPlayer = {
  player_id: string;
  display_name: string;
  avatar_url: string | null;
  crown?: string | null;
  frame?: string | null;
  title?: string | null;
};

export function PlayerChip({
  player,
  size = "sm",
  className,
  suffix,
}: {
  player: ChipPlayer;
  size?: "sm" | "md";
  className?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <Link
      href={`/profilo/${player.player_id}`}
      className={cn("group flex min-w-0 items-center gap-3 rounded-md", className)}
    >
      <PlayerAvatar player={player} size={size} />
      <span className="flex min-w-0 flex-col">
        <span className="flex items-center gap-1.5 truncate font-medium group-hover:underline">
          {player.display_name}
          {suffix}
        </span>
        {player.title && (
          <span className="truncate text-xs font-semibold text-amber-700 dark:text-gold">
            {player.title}
          </span>
        )}
      </span>
    </Link>
  );
}
