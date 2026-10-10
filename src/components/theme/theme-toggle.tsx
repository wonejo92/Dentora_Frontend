"use client";

import { cn } from "@/lib/cn";
import { isDarkNow, setTheme, useTheme, type Theme } from "./theme";

const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);
const MonitorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8M12 16v4" />
  </svg>
);

/** Botón redondo de la barra superior: alterna entre claro y oscuro. */
export function ThemeToggle({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => setTheme(isDarkNow() ? "light" : "dark")}
      aria-label="Cambiar entre modo claro y oscuro"
      title="Cambiar tema"
      className={cn(
        "flex size-11 items-center justify-center rounded-full bg-surface text-ink transition-colors hover:bg-brand-50",
        className,
      )}
    >
      {/* El ícono se decide con CSS, así coincide con el tema desde el primer pintado. */}
      <span className="dark:hidden">
        <MoonIcon />
      </span>
      <span className="hidden dark:inline">
        <SunIcon />
      </span>
    </button>
  );
}

const OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Claro", icon: <SunIcon /> },
  { value: "dark", label: "Oscuro", icon: <MoonIcon /> },
  { value: "system", label: "Sistema", icon: <MonitorIcon /> },
];

/** Selector de 3 opciones para el menú del usuario. */
export function ThemeSwitch() {
  const theme = useTheme();
  return (
    <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-1.5">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={theme === o.value}
          onClick={() => setTheme(o.value)}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-medium transition-colors",
            theme === o.value
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-line text-muted hover:border-brand-200 hover:text-ink",
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
