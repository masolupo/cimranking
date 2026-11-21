"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Eye, Lock } from "lucide-react";
import { toast } from "sonner";
import { buyItem, equipItem, savePreferences, sellItem } from "@/app/actions";
import { CoinIcon } from "@/components/coin-badge";
import { SectionTitle } from "@/components/page-header";
import { applyPreferences } from "@/components/preferences-sync";
import { Button } from "@/components/ui/button";
import {
  FONT_OPTIONS,
  LAVA_INTENSITY_OPTIONS,
  LAVA_SPEED_OPTIONS,
  DEFAULT_THEME,
  RADIUS_OPTIONS,
  themeSwatches,
  type Preferences,
} from "@/lib/preferences";
import { sellPrice } from "@/lib/rules";
import type { ShopItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string };

/** Stelline sull'anteprima dei temi costosi (i Rari usano le prime 3). */
const SPARKLES = [
  { top: "18%", left: "22%", size: "14px", delay: "0s" },
  { top: "55%", left: "70%", size: "11px", delay: "0.9s" },
  { top: "25%", left: "84%", size: "9px", delay: "1.7s" },
  { top: "62%", left: "40%", size: "10px", delay: "0.5s" },
  { top: "12%", left: "55%", size: "8px", delay: "1.3s" },
  { top: "40%", left: "8%", size: "9px", delay: "2.1s" },
];

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  renderLabel,
}: {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (v: T) => void;
  renderLabel?: (o: Option<T>) => React.ReactNode;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-lg border bg-card px-4 text-sm font-medium transition-colors",
              "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              on ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {renderLabel ? renderLabel(o) : o.label}
          </button>
        );
      })}
    </div>
  );
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card/90 p-5 backdrop-blur">
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      {hint && <p className="mb-4 text-sm text-muted-foreground">{hint}</p>}
      <div className={cn(!hint && "mt-3")}>{children}</div>
    </section>
  );
}

export function PersonalizeForm({
  themes,
  ownedIds,
  coins,
  initial,
}: {
  themes: ShopItem[];
  ownedIds: string[];
  coins: number;
  initial: Preferences;
}) {
  const [prefs, setPrefs] = useState(initial);
  const [preview, setPreview] = useState<ShopItem | null>(null);
  const [pending, startTransition] = useTransition();
  // Se esci dalla pagina durante un'anteprima, rimetti il tema vero
  const prefsRef = useRef(prefs);
  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);
  useEffect(() => () => applyPreferences(prefsRef.current), []);

  const owned = new Set(ownedIds);
  const isAvailable = (t: ShopItem) => t.price === 0 || owned.has(t.id);

  function update(patch: Partial<Preferences>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    applyPreferences(next);
    startTransition(async () => {
      const { theme: _t, ...stored } = next;
      void _t;
      const res = await savePreferences(stored);
      if (res.error) toast.error(res.error);
    });
  }

  function startPreview(t: ShopItem) {
    setPreview(t);
    applyPreferences({ ...prefs, theme: t.asset_key });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function stopPreview() {
    setPreview(null);
    applyPreferences(prefs);
  }

  function activateTheme(t: ShopItem) {
    startTransition(async () => {
      if (!isAvailable(t)) {
        if (!window.confirm(`Comprare il tema "${t.name}" per ${t.price} monete?`)) return;
        const bought = await buyItem(t.id);
        if (bought.error) {
          toast.error(bought.error);
          return;
        }
      }
      const res = await equipItem(t.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      const next = { ...prefs, theme: t.asset_key };
      setPrefs(next);
      setPreview(null);
      applyPreferences(next);
      toast.success(`Tema "${t.name}" attivato!`);
    });
  }

  function sellTheme(t: ShopItem, active: boolean) {
    const refund = sellPrice(t.price);
    const extra = active ? " Tornerai al tema predefinito." : "";
    if (!window.confirm(`Vendere il tema "${t.name}" per ${refund} monete?${extra}`)) return;
    startTransition(async () => {
      const res = await sellItem(t.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (active) {
        const next = { ...prefs, theme: DEFAULT_THEME };
        setPrefs(next);
        applyPreferences(next);
      }
      toast.success(res.success);
    });
  }

  return (
    <div className="grid gap-6">
      {preview && (
        <div className="sticky top-20 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary bg-card/95 p-4 shadow-lg backdrop-blur">
          <p className="text-sm">
            Stai provando <strong>{preview.name}</strong>
            {!isAvailable(preview) && (
              <span className="text-muted-foreground"> · costa {preview.price} monete</span>
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={stopPreview}>
              Annulla
            </Button>
            <Button
              onClick={() => activateTheme(preview)}
              disabled={pending || (!isAvailable(preview) && coins < preview.price)}
            >
              {isAvailable(preview)
                ? "Usa questo tema"
                : coins < preview.price
                  ? `Mancano ${preview.price - coins} monete`
                  : `Compra per ${preview.price}`}
            </Button>
          </div>
        </div>
      )}

      <section>
        <SectionTitle>Tema</SectionTitle>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((t) => {
            const active = prefs.theme === t.asset_key;
            const available = isAvailable(t);
            const sw = themeSwatches(t.asset_key);
            const tier = t.price >= 300 ? "mythic" : t.price >= 150 ? "legend" : t.price >= 100 ? "rare" : null;
            return (
              <li
                key={t.id}
                className={cn(
                  "overflow-hidden rounded-xl border bg-card",
                  tier === "rare" && "theme-rare",
                  (tier === "legend" || tier === "mythic") && "theme-legend",
                  tier === "mythic" && "theme-mythic",
                  active && "border-primary ring-2 ring-primary",
                )}
                data-active={active || undefined}
                style={tier ? ({ "--t1": sw[2], "--t2": sw[3], "--t3": sw[4] } as React.CSSProperties) : undefined}
              >
                <div
                  className={cn("relative h-20", tier && "theme-shine")}
                  style={{
                    background: `radial-gradient(circle at 20% 30%, ${sw[2]}, transparent 60%), radial-gradient(circle at 80% 70%, ${sw[3]}, transparent 55%), radial-gradient(circle at 60% 20%, ${sw[4]}, transparent 50%), ${sw[0]}`,
                  }}
                >
                  {active && (
                    <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold">
                      <Check className="size-3" /> In uso
                    </span>
                  )}
                  {!available && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold">
                      <Lock className="size-3" /> <CoinIcon className="size-3.5" /> {t.price}
                    </span>
                  )}
                  {tier &&
                    (tier === "rare" ? SPARKLES.slice(0, 3) : SPARKLES).map((s, i) => (
                      <span
                        key={i}
                        aria-hidden="true"
                        className="theme-sparkle"
                        style={{ top: s.top, left: s.left, fontSize: s.size, animationDelay: s.delay }}
                      >
                        ✦
                      </span>
                    ))}
                  {tier && (
                    <span
                      className={cn(
                        "absolute bottom-2 left-2 z-[1] rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase",
                        tier === "mythic"
                          ? "theme-mythic-badge text-white"
                          : tier === "legend"
                            ? "bg-gold text-gold-foreground"
                            : "bg-background/90 text-foreground",
                      )}
                    >
                      ✦ {tier === "mythic" ? "Mitico" : tier === "legend" ? "Leggendario" : "Raro"}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className={cn("truncate font-heading font-semibold", tier && "theme-name-glow font-bold")}>
                      {t.name}
                    </p>
                    {available && (
                      <p className="truncate text-xs text-muted-foreground">
                        {t.asset_key === DEFAULT_THEME ? "Predefinito" : t.price === 0 ? "Gratis" : "Tuo"}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {t.price > 0 && owned.has(t.id) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => sellTheme(t, active)}
                      >
                        Vendi +{sellPrice(t.price)}
                      </Button>
                    )}
                    {!active && (
                      <>
                        <Button variant="ghost" size="icon" aria-label={`Prova ${t.name}`} onClick={() => startPreview(t)}>
                          <Eye />
                        </Button>
                        <Button
                          size="sm"
                          variant={available ? "default" : "outline"}
                          disabled={pending || (!available && coins < t.price)}
                          onClick={() => activateTheme(t)}
                        >
                          {available ? "Usa" : "Compra"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Effetti del tema" hint="Animazioni che seguono il mouse o il dito (solo nei temi speciali).">
          <Segmented
            label="Effetti del tema"
            value={prefs.effects ? "on" : "off"}
            onChange={(v) => update({ effects: v === "on" })}
            options={[
              { value: "on", label: "Accesi" },
              { value: "off", label: "Spenti" },
            ]}
          />
        </Panel>

        <Panel title="Sfondo animato" hint="Le bolle stile lava lamp dietro le pagine.">
          <div className="grid gap-4">
            <Segmented
              label="Sfondo animato"
              value={prefs.lava ? "on" : "off"}
              onChange={(v) => update({ lava: v === "on" })}
              options={[
                { value: "on", label: "Acceso" },
                { value: "off", label: "Spento" },
              ]}
            />
            {prefs.lava && (
              <>
                <div>
                  <p className="mb-2 text-sm font-medium">Velocità</p>
                  <Segmented
                    label="Velocità bolle"
                    value={prefs.lavaSpeed}
                    onChange={(v) => update({ lavaSpeed: v })}
                    options={LAVA_SPEED_OPTIONS}
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Intensità</p>
                  <Segmented
                    label="Intensità bolle"
                    value={prefs.lavaIntensity}
                    onChange={(v) => update({ lavaIntensity: v })}
                    options={LAVA_INTENSITY_OPTIONS}
                  />
                </div>
              </>
            )}
          </div>
        </Panel>

        <Panel title="Font dei titoli">
          <Segmented
            label="Font dei titoli"
            value={prefs.font}
            onChange={(v) => update({ font: v })}
            options={FONT_OPTIONS}
            renderLabel={(o) => (
              <span
                className="text-base"
                style={{ fontFamily: `var(${FONT_OPTIONS.find((f) => f.value === o.value)?.varName})` }}
              >
                {o.label}
              </span>
            )}
          />
        </Panel>

        <Panel title="Angoli" hint="Quanto arrotondati sono pulsanti e riquadri.">
          <Segmented
            label="Angoli"
            value={prefs.radius}
            onChange={(v) => update({ radius: v })}
            options={RADIUS_OPTIONS}
          />
        </Panel>
      </div>
    </div>
  );
}
