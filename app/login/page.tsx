import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/site-header";
import { LoginForm } from "@/components/login-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Accedi" };

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <LogoMark />
          <h1 className="font-heading text-3xl font-bold tracking-tight">Cim Ranking</h1>
          <p className="text-muted-foreground">Segna le vittorie, scala la classifica, conquista la corona.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
