"use client";

/**
 * Piezas base para gráficos con Recharts, al estilo de shadcn/ui Charts,
 * adaptadas a los tokens de Dentora (funcionan en claro y oscuro).
 *
 * Uso:
 *   <ChartContainer config={{ citas: { label: "Citas", color: "var(--color-brand-500)" } }}>
 *     <AreaChart data={...}>
 *       <Area dataKey="citas" stroke="var(--color-citas)" />
 *       <ChartTooltip content={<ChartTooltipContent />} />
 *     </AreaChart>
 *   </ChartContainer>
 *
 * Cada serie del `config` queda disponible como variable CSS `--color-<clave>`.
 */
import { createContext, useContext } from "react";
import { ResponsiveContainer, Tooltip, Legend } from "recharts";
import { cn } from "@/lib/cn";

export type ChartConfig = Record<string, { label: string; color: string }>;

const ChartContext = createContext<ChartConfig>({});

export function ChartContainer({
  config,
  className,
  children,
}: {
  config: ChartConfig;
  className?: string;
  children: React.ComponentProps<typeof ResponsiveContainer>["children"];
}) {
  const vars = Object.fromEntries(Object.entries(config).map(([key, { color }]) => [`--color-${key}`, color]));
  return (
    <ChartContext.Provider value={config}>
      <div
        className={cn(
          "w-full text-xs",
          // Estilo de los elementos internos de Recharts con nuestros tokens.
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted [&_.recharts-cartesian-grid_line]:stroke-line",
          "[&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none",
          className,
        )}
        style={vars as React.CSSProperties}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = Tooltip;
export const ChartLegend = Legend;

type TooltipItem = { dataKey?: string | number; name?: string | number; value?: number | string; color?: string };

/**
 * Cuadro flotante: el valor va primero y destacado, el nombre de la serie en gris
 * (al revés que la leyenda, porque aquí el lector ya sabe qué serie mira).
 */
export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter = (v) => String(v),
  footer,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string | number;
  labelFormatter?: (label: string | number) => React.ReactNode;
  valueFormatter?: (value: number | string, key: string) => React.ReactNode;
  footer?: (payload: TooltipItem[]) => React.ReactNode;
}) {
  const config = useContext(ChartContext);
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-44 rounded-2xl border border-line bg-surface px-4 py-3 text-ink shadow-lg shadow-black/10">
      {label !== undefined && (
        <p className="mb-2 text-xs font-medium text-muted">{labelFormatter ? labelFormatter(label) : label}</p>
      )}
      <div className="space-y-1.5">
        {payload.map((item) => {
          const key = String(item.dataKey ?? item.name);
          const serie = config[key];
          return (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-xs text-muted">
                {/* Clave de línea, no un cuadro relleno. */}
                <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: serie?.color ?? item.color }} />
                {serie?.label ?? item.name}
              </span>
              <span className="text-sm font-bold tabular-nums">
                {item.value !== undefined ? valueFormatter(item.value, key) : "—"}
              </span>
            </div>
          );
        })}
      </div>
      {footer && <div className="mt-2 border-t border-line pt-2 text-xs">{footer(payload)}</div>}
    </div>
  );
}

/** Leyenda con la forma de cada serie: línea continua o punteada. */
export function ChartLegendContent({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="flex flex-wrap gap-5 text-xs text-muted">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-2">
          <span
            className={cn("w-4", i.dashed ? "border-t-2 border-dashed" : "h-0.5 rounded-full")}
            style={i.dashed ? { borderColor: i.color } : { backgroundColor: i.color }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}
