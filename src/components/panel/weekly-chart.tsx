"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const config: ChartConfig = {
  citas: { label: "Citas", color: "var(--color-brand-500)" },
};

const shortDate = new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "short", timeZone: "UTC" });
const fmt = (date: string, days = 0) =>
  shortDate.format(new Date(Date.parse(`${date}T00:00:00Z`) + days * 864e5)).replace(".", "");

/**
 * Citas por semana: área con la línea de promedio.
 * Al pasar el mouse, una línea vertical marca la semana y un cuadro muestra
 * las citas, el promedio y la diferencia.
 */
export function WeeklyChart({
  weeks,
  average,
}: {
  weeks: { weekStart: string; count: number }[];
  average: number;
}) {
  const data = weeks.map((w) => ({ week: w.weekStart, citas: w.count }));
  const lastWeek = weeks.at(-1)?.weekStart;
  // Una etiqueta cada 2 semanas, terminando siempre en la semana actual.
  const ticks = weeks.filter((_, i) => (weeks.length - 1 - i) % 2 === 0).map((w) => w.weekStart);
  const empty = weeks.every((w) => w.count === 0);

  return (
    <div>
      <div className="relative">
        <ChartContainer config={config} className="h-56">
          <AreaChart data={data} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fill-citas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-citas)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--color-citas)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="0" />
            <XAxis
              dataKey="week"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              ticks={ticks}
              interval={0}
              tick={{ fontSize: 12 }}
              tickFormatter={(w: string) => fmt(w)}
            />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 12 }} domain={[0, (max: number) => Math.max(4, Math.ceil(max / 4) * 4)]} />
            <ReferenceLine y={average} stroke="var(--color-warm-500)" strokeWidth={1.5} strokeDasharray="5 5" />
            <ChartTooltip
              cursor={{ stroke: "var(--color-muted)", strokeOpacity: 0.4 }}
              content={
                <ChartTooltipContent
                  labelFormatter={(w) =>
                    w === lastWeek ? "Esta semana" : `Semana del ${fmt(String(w))} al ${fmt(String(w), 6)}`
                  }
                  footer={(payload) => {
                    const value = Number(payload[0]?.value ?? 0);
                    const diff = value - average;
                    return (
                      <div className="space-y-1">
                        <p className="flex justify-between gap-4 text-muted">
                          Promedio <span className="font-semibold text-ink tabular-nums">{average.toLocaleString("es-EC")}</span>
                        </p>
                        {average > 0 && (
                          <p className={diff >= 0 ? "text-green-700" : "text-red-600"}>
                            {diff >= 0 ? "▲" : "▼"} {Math.abs(Math.round((diff / average) * 100))}% vs. el promedio
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
              }
            />
            <Area
              dataKey="citas"
              type="monotone"
              stroke="var(--color-citas)"
              strokeWidth={2}
              fill="url(#fill-citas)"
              activeDot={{ r: 5, fill: "var(--color-citas)", stroke: "var(--color-surface)", strokeWidth: 2 }}
              animationDuration={600}
            />
          </AreaChart>
        </ChartContainer>
        {empty && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center pb-8 text-sm text-muted">
            Aún no hay citas en estas semanas
          </p>
        )}
      </div>

      <div className="mt-3">
        <ChartLegendContent
          items={[
            { label: "Citas", color: "var(--color-brand-500)" },
            { label: `Promedio (${average.toLocaleString("es-EC")})`, color: "var(--color-warm-500)", dashed: true },
          ]}
        />
      </div>
      {/* Los mismos datos en tabla, para lectores de pantalla. Va dentro de un div
          porque una <table> ignora el recorte de sr-only y alargaría la página. */}
      <div className="sr-only">
        <table>
          <caption>Citas por semana</caption>
          <tbody>
            {weeks.map((w) => (
              <tr key={w.weekStart}>
                <td>{fmt(w.weekStart)}</td>
                <td>{w.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
