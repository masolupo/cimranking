"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const ERRORS: Record<string, string> = {
  invalid_credentials: "Email o password sbagliati",
  email_not_confirmed: "Conferma prima l'email (controlla la posta)",
  user_already_exists: "Esiste già un account con questa email",
  weak_password: "Password troppo debole (minimo 6 caratteri)",
  over_email_send_rate_limit: "Troppe email inviate, riprova tra un po'",
};

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const supabase = createClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(ERRORS[error.code ?? ""] ?? error.message);
          return;
        }
        router.replace("/");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
        });
        if (error) {
          toast.error(ERRORS[error.code ?? ""] ?? error.message);
          return;
        }
        if (data.session) {
          router.replace("/benvenuto");
          router.refresh();
        } else {
          setSentTo(email);
        }
      }
    });
  }

  if (sentTo) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center">
        <p className="font-heading text-lg font-semibold">Controlla la posta</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Abbiamo mandato un link di conferma a <strong className="text-foreground">{sentTo}</strong>. Aprilo
          da questo dispositivo per entrare.
        </p>
        <Button variant="ghost" className="mt-4" onClick={() => { setSentTo(null); setMode("login"); }}>
          Torna all&apos;accesso
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div role="tablist" className="mb-6 grid grid-cols-2 rounded-lg bg-muted p-1">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "min-h-10 rounded-md text-sm font-medium text-muted-foreground transition-colors",
              mode === m && "bg-background text-foreground shadow-sm",
            )}
          >
            {m === "login" ? "Accedi" : "Registrati"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-11 text-base"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="h-11 text-base"
          />
        </div>
        <Button type="submit" size="lg" className="h-11 text-base" disabled={pending}>
          {pending ? "Attendi…" : mode === "login" ? "Entra" : "Crea account"}
        </Button>
      </form>
    </div>
  );
}
