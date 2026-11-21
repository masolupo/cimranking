"use client";

import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = { "game-covers": 5 * 1024 * 1024, avatars: 2 * 1024 * 1024 } as const;

/** Carica un'immagine nella cartella dell'utente e restituisce il percorso nello Storage. */
export async function uploadImage(bucket: "game-covers" | "avatars", file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Il file deve essere un'immagine");
  if (file.size > MAX_BYTES[bucket]) {
    throw new Error(`Immagine troppo grande (max ${MAX_BYTES[bucket] / 1024 / 1024} MB)`);
  }

  const supabase = createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) throw new Error("Devi essere loggato");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
  });
  if (error) throw new Error(error.message);
  return path;
}
