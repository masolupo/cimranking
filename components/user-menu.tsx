"use client";

import Link from "next/link";
import { LogOut, Palette, User } from "lucide-react";
import { PlayerAvatar } from "@/components/player-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/app/actions";
import type { PlayerCard } from "@/lib/types";

export function UserMenu({ me }: { me: PlayerCard }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Menu utente"
      >
        <PlayerAvatar player={me} size="sm" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block truncate font-semibold text-foreground">{me.display_name}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={`/profilo/${me.id}`} />}>
          <User /> Il mio profilo
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/personalizza" />}>
          <Palette /> Personalizza
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
          <LogOut /> Esci
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
