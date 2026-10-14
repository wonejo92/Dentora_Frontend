"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { money } from "@/lib/billing";

const config: ChartConfig = {
  ingresos: { label: "Ingresos", color: "var(--color-brand-500)" },
};

type Granularity = "day" | "week" | "month";

const fmt = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-EC", { timeZone: "UTC", ...opts }).format(new Date(`${date}T00:00:00Z`)).replace(".", "");

const tickLabel = (bucket: string, g: Granularity) =>
  g === "month" ? fmt(bucket, { month: "short" }) : fmt(bucket, { day: "numeric", month: "short" });

const tooltipLabel = (bucket: string, g: Granularity) => {
  if (g === "day") return fmt(bucket, { weekday: "long", day: "numeric", month: "long" });
  if (g === "month") return fmt(bucket, { month: "long", year: "numeric" });
  const end = new Date(Date.parse(`${bucket}T00:00:00Z`) + 6 * 864e5).toISOString().slice(0, 10);
  return `Semana del ${fmt(bucket, { day: "numeric", month: "short" })} al ${fmt(end, { day: "numeric", month: "short" })}`;
};

/** Ingresos del período por día, semana o mes (una sola serie, en el color de la marca). */
export function IncomeChart({
  series,
  granularity,
}: {
  series: { bucket: string; amount: string }[];
  granularity: Granularity;
}) {
  const data = series.map((s) => ({ bucket: s.bucket, ingresos: Number(s.amount) }));
  const empty = data.every((d) => d.ingresos === 0);
  // Con muchos días, una etiqueta cada tanto para que no se encimen.
  const every = Math.max(1, Math.ceil(data.length / 10));

  return (
    <div className="relative">
      <ChartContainer config={config} className="h-64">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="bucket"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            interval={every - 1}
            tick={{ fontSize: 12 }}
            tickFormatter={(b: string) => tickLabel(b, granularity)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => `$${v.toLocaleString("es-EC", { maximumFractionDigits: 0 })}`}
          />
          <ChartTooltip
            cursor={{ fill: "var(--color-canvas)" }}
            content={
              <ChartTooltipContent
                labelFormatter={(b) => tooltipLabel(String(b), granularity)}
                valueFormatter={(v) => money(v)}
              />
            }
          />
          <Bar
            dataKey="ingresos"
            fill="var(--color-ingresos)"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
            animationDuration={500}
          />
        </BarChart>
      </ChartContainer>
      {empty && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center pb-8 text-sm text-muted">
          Sin cobros en este período
        </p>
      )}

      {/* Los mismos datos en tabla, para lectores de pantalla. Va dentro de un div
          porque una <table> ignora el recorte de sr-only y alargaría la página. */}
      <div className="sr-only">
        <table>
          <caption>Ingresos por {granularity === "day" ? "día" : granularity === "week" ? "semana" : "mes"}</caption>
          <tbody>
            {series.map((s) => (
              <tr key={s.bucket}>
                <td>{tooltipLabel(s.bucket, granularity)}</td>
                <td>{money(s.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
