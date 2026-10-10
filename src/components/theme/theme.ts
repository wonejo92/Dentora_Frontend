"use client";

import { useSyncExternalStore } from "react";
import { THEME_COOKIE } from "@/lib/constants";

export type Theme = "light" | "dark" | "system";

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const current = (): Theme => {
  const value = document.documentElement.dataset.theme;
  return value === "light" || value === "dark" ? value : "system";
};

/** Tema elegido (light, dark o system), compartido por todos los componentes. */
export const useTheme = () => useSyncExternalStore(subscribe, current, () => "system" as Theme);

/** ¿Se está viendo en oscuro ahora mismo? (resuelve la opción "Sistema"). */
export const isDarkNow = () =>
  current() === "dark" || (current() === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

export function setTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
  // Cookie (no localStorage) para que el servidor pinte el tema correcto sin parpadeo.
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
  listeners.forEach((listener) => listener());
}
