"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateGameCover } from "@/app/actions";
import { ImagePicker } from "@/components/image-picker";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/upload";
import { errorMessage } from "@/lib/utils-app";

export function GameCoverEditor({ gameId, currentUrl }: { gameId: string; currentUrl: string | null }) {
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-2">
      <ImagePicker file={file} onChange={setFile} currentUrl={currentUrl} label="Aggiungi un'immagine" />
      {file && (
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                const path = await uploadImage("game-covers", file);
                const res = await updateGameCover(gameId, path);
                if (res.error) toast.error(res.error);
                else {
                  toast.success(res.success);
                  setFile(null);
                }
              } catch (err) {
                toast.error(errorMessage(err));
              }
            })
          }
        >
          {pending ? "Caricamento…" : "Salva immagine"}
        </Button>
      )}
    </div>
  );
}
