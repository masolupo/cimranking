"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateProfile } from "@/app/actions";
import { ImagePicker } from "@/components/image-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadImage } from "@/lib/upload";
import { errorMessage } from "@/lib/utils-app";

export function ProfileForm({
  username: initialUsername,
  displayName: initialDisplayName,
  avatarUrl,
  submitLabel = "Salva",
  redirectTo,
}: {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  submitLabel?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const avatarPath = file ? await uploadImage("avatars", file) : undefined;
        const res = await updateProfile({ username, displayName, avatarPath });
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success(res.success);
        setFile(null);
        if (redirectTo) router.push(redirectTo);
        else if (username !== initialUsername) router.replace(`/profilo/${username.trim().toLowerCase()}`);
      } catch (err) {
        toast.error(errorMessage(err));
      }
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <div className="flex items-center gap-4">
        <ImagePicker file={file} onChange={setFile} currentUrl={avatarUrl} label="Foto" shape="circle" />
        <p className="text-sm text-muted-foreground">Tocca per scegliere una foto profilo (max 2 MB).</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="display-name">Nome</Label>
        <Input
          id="display-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={40}
          required
          className="h-11 text-base"
          autoComplete="nickname"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          pattern="[a-z0-9_]{3,20}"
          maxLength={20}
          required
          className="h-11 text-base"
          autoCapitalize="none"
          autoComplete="username"
          aria-describedby="username-hint"
        />
        <p id="username-hint" className="text-xs text-muted-foreground">
          3-20 caratteri: lettere minuscole, numeri e _
        </p>
      </div>
      <Button type="submit" size="lg" className="h-11" disabled={pending}>
        {pending ? "Salvataggio…" : submitLabel}
      </Button>
    </form>
  );
}
