"use client";

import { useEffect } from "react";
import {
  PREFS_COOKIE,
  htmlAttributes,
  serializePreferences,
  type Preferences,
} from "@/lib/preferences";

/** Applica le preferenze a <html> e le salva nel cookie (così il prossimo caricamento non sfarfalla). */
export function applyPreferences(prefs: Preferences) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(htmlAttributes(prefs))) {
    if (root.getAttribute(key) !== value) root.setAttribute(key, value);
  }
  document.cookie = `${PREFS_COOKIE}=${serializePreferences(prefs)}; path=/; max-age=31536000; samesite=lax`;
}

/** Allinea la pagina alle preferenze salvate nel profilo (es. primo accesso da un nuovo dispositivo). */
export function PreferencesSync({ prefs }: { prefs: Preferences }) {
  useEffect(() => {
    applyPreferences(prefs);
  }, [prefs]);
  return null;
}
