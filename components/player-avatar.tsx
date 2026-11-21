import Image from "next/image";
import { AuraBack, AuraFront, AuraShine } from "@/components/cosmetics/aura";
import { Crown, FRAME_STYLES } from "@/components/cosmetics/crown";
import { publicImageUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

export type AvatarPlayer = {
  display_name: string;
  avatar_url: string | null;
  crown?: string | null;
  frame?: string | null;
  aura?: string | null;
};

const SIZES = {
  sm: { box: "size-9", text: "text-sm", crown: "w-6 -top-3.5", px: 36 },
  md: { box: "size-12", text: "text-base", crown: "w-8 -top-5", px: 48 },
  mdl: { box: "size-14", text: "text-lg", crown: "w-9 -top-6", px: 56 },
  lg: { box: "size-24", text: "text-3xl", crown: "w-14 -top-9", px: 96 },
} as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function PlayerAvatar({
  player,
  size = "md",
  className,
}: {
  player: AvatarPlayer;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  const src = publicImageUrl("avatars", player.avatar_url);
  const { frame, aura } = player;

  const inner = (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-full bg-secondary font-heading font-semibold text-secondary-foreground",
        s.box,
        frame && frame !== "rainbow" && "ring-3 ring-offset-2 ring-offset-background",
        frame && FRAME_STYLES[frame],
      )}
    >
      {src ? (
        <Image src={src} alt="" width={s.px} height={s.px} className="size-full object-cover" />
      ) : (
        <span className={s.text}>{initials(player.display_name)}</span>
      )}
      {aura && <AuraShine kind={aura} />}
    </div>
  );

  return (
    <div className={cn("relative inline-flex shrink-0 isolate", className)}>
      {aura && <AuraBack kind={aura} />}
      <div className="relative z-[1]">
        {frame === "rainbow" ? (
          <div className="rounded-full bg-[conic-gradient(#f43f5e,#f59e0b,#84cc16,#06b6d4,#8b5cf6,#f43f5e)] p-[3px]">
            <div className="rounded-full bg-background p-[2px]">{inner}</div>
          </div>
        ) : (
          inner
        )}
      </div>
      {aura && <AuraFront kind={aura} />}
      {player.crown && (
        <Crown
          variant={player.crown}
          className={cn("absolute left-1/2 z-[3] -translate-x-1/2 -rotate-12", s.crown)}
        />
      )}
    </div>
  );
}
