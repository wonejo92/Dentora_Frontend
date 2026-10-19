import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DateInput } from "@/components/list/date-input";
import { IncomeChart } from "@/components/reports/income-chart";
import { BarList, Kpi, Panel } from "@/components/reports/report-parts";
import { PlanUpgrade } from "@/components/panel/plan-upgrade";
import { api } from "@/lib/api";
import { hasFeature } from "@/lib/plan-limits";
import { methodLabels, money } from "@/lib/billing";
import { cn } from "@/lib/cn";
import { guard, requireClinicUser } from "@/lib/dal";
import { localDate } from "@/lib/time";
import type { PaymentMethod, ReportSummary } from "@/lib/types";

export const metadata: Metadata = { title: "Reportes" };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const shift = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * 864e5).toISOString().slice(0, 10);
const monthStart = (date: string, offset = 0) => {
  const [y, m] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + offset, 1)).toISOString().slice(0, 10);
};

const pct = (rate: number | null) => (rate === null ? "—" : `${Math.round(rate * 100)} %`);
const shortDate = (date: string) =>
  new Intl.DateTimeFormat("es-EC", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" })
    .format(new Date(`${date}T00:00:00Z`))
    .replace(".", "");

export default async function ReportsPage({ searchParams }: PageProps<"/panel/reportes">) {
  const me = await requireClinicUser();
  if (me.role !== "OWNER") redirect("/panel");
  if (!hasFeature(me, "reports")) return <PlanUpgrade feature="reports" plan={me.clinic.plan} />;
  const today = localDate(new Date(), me.clinic.timezone);

  const presets = [
    { key: "mes", label: "Este mes", from: monthStart(today), to: today },
    { key: "mes-pasado", label: "Mes pasado", from: monthStart(today, -1), to: shift(monthStart(today), -1) },
    { key: "3-meses", label: "Últimos 3 meses", from: monthStart(today, -2), to: today },
    { key: "anio", label: "Este año", from: `${today.slice(0, 4)}-01-01`, to: today },
  ];
  const sp = await searchParams;
  const pick = (key: string) => (typeof sp[key] === "string" && DATE.test(sp[key]) ? sp[key] : undefined);
  const preset = presets.find((p) => p.key === sp.periodo) ?? (pick("desde") ? undefined : presets[0]);
  const from = preset?.from ?? pick("desde")!;
  const to = preset?.to ?? (pick("hasta") && pick("hasta")! >= from ? pick("hasta")! : today);

  const r = await guard(api<ReportSummary>(`/reports/summary?${new URLSearchParams({ from, to })}`));
  const a = r.appointments;
  const methods = Object.entries(r.income.byMethod) as [PaymentMethod, string][];
  const vs = `vs. ${shortDate(r.range.previous.from)} – ${shortDate(r.range.previous.to)}`;

  return (
    <div className="w-full space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
        <p className="text-sm text-muted">
          Del {shortDate(r.range.from)} al {shortDate(r.range.to)} · comparado con el período anterior
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {presets.map((p) => (
          <Link
            key={p.key}
            href={`/panel/reportes?periodo=${p.key}`}
            aria-current={preset?.key === p.key ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              preset?.key === p.key ? "bg-night-900 text-white" : "bg-surface text-muted hover:text-ink",
            )}
          >
            {p.label}
          </Link>
        ))}
        <span className="ml-1 flex items-center gap-2 text-sm text-muted">
          <DateInput param="desde" value={from} label="Desde" />
          a
          <DateInput param="hasta" value={to} label="Hasta" />
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi
          label="Ingresos"
          value={money(r.income.total)}
          current={Number(r.income.total)}
          previous={Number(r.income.previous)}
          hint={vs}
        />
        <Kpi label="Citas atendidas" value={String(a.completed)} current={a.completed} previous={a.previousCompleted} />
        <Kpi
          label="Pacientes nuevos"
          value={String(r.patients.new)}
          current={r.patients.new}
          previous={r.patients.previous}
        />
        <Kpi
          label="Inasistencia"
          value={pct(a.noShowRate)}
          current={a.noShowRate}
          previous={a.previousNoShowRate}
          better="down"
          mode="points"
          hint={`${a.noShow} de ${a.completed + a.noShow}`}
        />
        <Kpi label="Por cobrar hoy" value={money(r.receivable)} hint="Saldo de presupuestos aprobados" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel
          title="Ingresos"
          description={`${r.income.count} ${r.income.count === 1 ? "pago" : "pagos"} · por ${
            r.range.granularity === "day" ? "día" : r.range.granularity === "week" ? "semana" : "mes"
          }`}
        >
          <IncomeChart series={r.income.series} granularity={r.range.granularity} />
        </Panel>
        <Panel title="Por método de pago">
          <BarList
            items={methods.map(([m, v]) => ({ label: methodLabels[m], value: Number(v) }))}
            format={(v) => money(v)}
            empty="Sin cobros en este período"
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Citas" description={`${a.total} agendadas · ${a.online} reservadas online`}>
          <BarList
            items={[
              { label: "Atendidas", value: a.completed },
              { label: "Confirmadas", value: a.confirmed },
              { label: "Pendientes", value: a.pending },
              { label: "No asistió", value: a.noShow },
              { label: "Canceladas", value: a.cancelled },
            ]}
            empty="No hay citas en este período"
          />
        </Panel>
        <Panel title="Tratamientos más agendados" description="Sin contar citas canceladas">
          <BarList
            items={r.treatments.map((t) => ({ label: t.name, value: t.count }))}
            empty="No hay citas en este período"
          />
        </Panel>
        <Panel title="Presupuestos">
          <dl className="space-y-4">
            <div>
              <dt className="text-xs text-muted">Aprobados en el período</dt>
              <dd className="text-2xl font-bold tabular-nums">{money(r.budgets.approvedTotal)}</dd>
              <dd className="text-xs text-muted">
                {r.budgets.approvedCount} {r.budgets.approvedCount === 1 ? "presupuesto" : "presupuestos"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Tasa de aceptación</dt>
              <dd className="text-2xl font-bold tabular-nums">{pct(r.budgets.acceptanceRate)}</dd>
              <dd className="text-xs text-muted">Aprobados frente a rechazados, de los creados en el período</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <Panel title="Por doctor">
        {r.doctors.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No hay doctores registrados.</p>
        ) : (
          <div className="-mx-6 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  <th className="px-6 pb-2.5 font-medium">Doctor</th>
                  <th className="px-4 pb-2.5 text-right font-medium">Agendadas</th>
                  <th className="px-4 pb-2.5 text-right font-medium">Atendidas</th>
                  <th className="px-4 pb-2.5 text-right font-medium">No asistió</th>
                  <th className="px-4 pb-2.5 text-right font-medium">Canceladas</th>
                  <th className="px-6 pb-2.5 text-right font-medium">Inasistencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {r.doctors.map((d) => (
                  <tr key={d.id}>
                    <td className="px-6 py-3">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ backgroundColor: d.color }} aria-hidden />
                        {d.fullName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{d.total}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{d.completed}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{d.noShow}</td>
                    <td className="px-4 py-3 text-right text-muted tabular-nums">{d.cancelled}</td>
                    <td className="px-6 py-3 text-right tabular-nums">
                      {pct(d.completed + d.noShow > 0 ? d.noShow / (d.completed + d.noShow) : null)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
