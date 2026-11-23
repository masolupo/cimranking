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
  displayName: initialDisplayName,
  avatarUrl,
  submitLabel = "Salva",
  redirectTo,
}: {
  displayName: string;
  avatarUrl: string | null;
  submitLabel?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const avatarPath = file ? await uploadImage("avatars", file) : undefined;
        const res = await updateProfile({ displayName, avatarPath });
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success(res.success);
        setFile(null);
        if (redirectTo) router.push(redirectTo);
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
      <Button type="submit" size="lg" className="h-11" disabled={pending}>
        {pending ? "Salvataggio…" : submitLabel}
      </Button>
    </form>
  );
}
