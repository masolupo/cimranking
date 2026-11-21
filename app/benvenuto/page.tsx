import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { LogoMark } from "@/components/site-header";
import { requireProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Benvenuto" };

export default async function BenvenutoPage() {
  const { profile } = await requireProfile({ allowNotOnboarded: true });
  if (profile.onboarded) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <LogoMark />
          <h1 className="font-heading text-3xl font-bold tracking-tight">Benvenuto al tavolo!</h1>
          <p className="text-muted-foreground">Scegli come ti vedranno gli altri giocatori.</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <ProfileForm
            username=""
            displayName={profile.display_name}
            avatarUrl={null}
            submitLabel="Inizia a giocare"
            redirectTo="/"
          />
        </div>
      </div>
    </main>
  );
}
