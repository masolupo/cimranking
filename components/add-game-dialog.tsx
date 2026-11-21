"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createGame } from "@/app/actions";
import { ImagePicker } from "@/components/image-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadImage } from "@/lib/upload";
import { errorMessage } from "@/lib/utils-app";

export function AddGameDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const coverPath = file ? await uploadImage("game-covers", file) : null;
        const res = await createGame({ name, coverPath });
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success(res.success);
        setOpen(false);
        setName("");
        setFile(null);
        if (res.slug) router.push(`/giochi/${res.slug}`);
      } catch (err) {
        toast.error(errorMessage(err));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" className="h-11 px-4" />}>
        <Plus /> Aggiungi gioco
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Nuovo gioco</DialogTitle>
            <DialogDescription>Avrà la sua classifica dedicata.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="game-name">Nome</Label>
            <Input
              id="game-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Catan"
              maxLength={60}
              required
              className="h-11"
            />
          </div>
          <div className="grid gap-2">
            <Label>Immagine (facoltativa)</Label>
            <ImagePicker file={file} onChange={setFile} label="Foto della scatola o del gioco" />
          </div>
          <DialogFooter>
            <Button type="submit" size="lg" className="h-11" disabled={pending || !name.trim()}>
              {pending ? "Salvataggio…" : "Aggiungi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
