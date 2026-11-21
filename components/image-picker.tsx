"use client";

import { useEffect, useMemo, useRef } from "react";
import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImagePicker({
  file,
  onChange,
  currentUrl,
  label = "Scegli un'immagine",
  shape = "cover",
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  currentUrl?: string | null;
  label?: string;
  shape?: "cover" | "circle";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const shown = preview ?? currentUrl ?? null;

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={cn(
        "group relative flex items-center justify-center overflow-hidden border-2 border-dashed bg-muted/50 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        shape === "cover" ? "aspect-[4/3] w-full rounded-xl" : "size-28 rounded-full",
      )}
    >
      {shown ? (
        // eslint-disable-next-line @next/next/no-img-element -- anteprima locale (blob:)
        <img src={shown} alt="Anteprima" className="absolute inset-0 size-full object-cover" />
      ) : (
        <span className="flex flex-col items-center gap-2 p-2 text-center">
          <ImagePlus className="size-6" aria-hidden="true" />
          {label}
        </span>
      )}
      {shown && (
        <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          Cambia immagine
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </button>
  );
}
