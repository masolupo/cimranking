"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dices, Home, Plus, Store, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/classifica", label: "Classifica", icon: Trophy },
  { href: "/partite/nuova", label: "Registra", icon: Plus, primary: true },
  { href: "/giochi", label: "Giochi", icon: Dices },
  { href: "/negozio", label: "Negozio", icon: Store },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function NavLinks({ variant }: { variant: "top" | "bottom" }) {
  const pathname = usePathname();

  if (variant === "top") {
    return (
      <ul className="flex items-center gap-1">
        {LINKS.filter((l) => !l.primary).map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              aria-current={isActive(pathname, l.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                "aria-[current=page]:bg-secondary aria-[current=page]:text-foreground",
              )}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <nav
      aria-label="Principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {LINKS.map((l) => {
          const Icon = l.icon;
          const active = isActive(pathname, l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors",
                  active && "text-primary",
                )}
              >
                {l.primary ? (
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                ) : (
                  <Icon className="size-5" aria-hidden="true" />
                )}
                <span className={cn(l.primary && "sr-only")}>{l.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
