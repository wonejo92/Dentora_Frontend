import { cn } from "@/lib/cn";

/**
 * Indicador con su comparación contra el período anterior.
 * `better`: si subir es bueno ("up") o malo ("down", p. ej. inasistencias).
 */
export function Kpi({
  label,
  value,
  current,
  previous,
  better = "up",
  mode = "percent",
  hint,
}: {
  label: string;
  value: string;
  current?: number | null;
  previous?: number | null;
  better?: "up" | "down";
  /** "percent": variación relativa; "points": diferencia en puntos (para tasas). */
  mode?: "percent" | "points";
  hint?: string;
}) {
  let delta: { text: string; good: boolean | null } | null = null;
  if (current != null && previous != null) {
    const diff = current - previous;
    if (mode === "points") {
      const pts = Math.round(diff * 1000) / 10;
      delta = {
        text: `${pts > 0 ? "+" : ""}${pts.toLocaleString("es-EC")} pts`,
        good: pts === 0 ? null : pts > 0 === (better === "up"),
      };
    } else if (previous > 0) {
      const pct = Math.round((diff / previous) * 100);
      delta = { text: `${pct > 0 ? "+" : ""}${pct} %`, good: pct === 0 ? null : pct > 0 === (better === "up") };
    } else if (current > 0) {
      delta = { text: "Nuevo", good: better === "up" };
    }
  }

  return (
    <div className="rounded-2xl bg-surface px-5 py-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        {delta && (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 font-semibold",
              delta.good === null ? "bg-canvas" : delta.good ? "bg-green-100 text-green-800" : "bg-red-50 text-red-700",
            )}
          >
            {delta.good !== null && (delta.text.startsWith("-") ? "▼ " : "▲ ")}
            {delta.text}
          </span>
        )}
        {hint}
      </p>
    </div>
  );
}

/** Lista con barras horizontales (un solo color): rankings y desgloses. */
export function BarList({
  items,
  format = (v) => v.toLocaleString("es-EC"),
  empty = "Sin datos en este período",
}: {
  items: { label: string; value: number; color?: string; detail?: string }[];
  format?: (value: number) => string;
  empty?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 0);
  if (max === 0) return <p className="py-6 text-center text-sm text-muted">{empty}</p>;
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              {i.color && (
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: i.color }} aria-hidden />
              )}
              <span className="truncate">{i.label}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums">
              {format(i.value)}
              {i.detail && <span className="ml-1.5 text-xs font-normal text-muted">{i.detail}</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-canvas" aria-hidden>
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Panel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-3xl bg-surface p-6", className)}>
      <h2 className="font-semibold">{title}</h2>
      {description && <p className="text-xs text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
