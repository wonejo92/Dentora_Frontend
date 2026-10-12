import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PaymentConcept, ReceiptLink } from "@/components/billing/account-view";
import { VoidPaymentButton } from "@/components/billing/void-payment-button";
import { DateInput } from "@/components/list/date-input";
import { FilterSelect } from "@/components/list/filter-select";
import { api } from "@/lib/api";
import { methodLabels, money } from "@/lib/billing";
import { cn } from "@/lib/cn";
import { guard, requireClinicUser } from "@/lib/dal";
import { localDate } from "@/lib/time";
import type { CashReport, PaymentMethod } from "@/lib/types";

export const metadata: Metadata = { title: "Caja" };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const METHODS = Object.keys(methodLabels) as PaymentMethod[];

/** Último día del mes de una fecha `YYYY-MM-DD`. */
const lastDayOfMonth = (date: string) => {
  const [y, m] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
};

const shift = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * 864e5).toISOString().slice(0, 10);

export default async function CashPage({ searchParams }: PageProps<"/panel/caja">) {
  const me = await requireClinicUser();
  if (me.role === "ASSISTANT") redirect("/panel");
  const tz = me.clinic.timezone;
  const today = localDate(new Date(), tz);
  const sp = await searchParams;
  const pick = (key: string) => (typeof sp[key] === "string" && DATE.test(sp[key]) ? sp[key] : undefined);
  const from = pick("desde") ?? today;
  const to = pick("hasta") ?? from;
  const method = typeof sp.metodo === "string" && METHODS.includes(sp.metodo as PaymentMethod) ? sp.metodo : undefined;

  const query = new URLSearchParams({ from, to: to < from ? from : to });
  if (method) query.set("method", method);
  const { items, summary } = await guard(api<CashReport>(`/payments?${query}`));

  const weekday = (Number(new Date(`${today}T12:00:00Z`).getUTCDay()) + 6) % 7; // lunes = 0
  const ranges = [
    { label: "Hoy", from: today, to: today },
    { label: "Ayer", from: shift(today, -1), to: shift(today, -1) },
    // Períodos completos: así no coinciden con "Hoy" un lunes o el día 1.
    { label: "Esta semana", from: shift(today, -weekday), to: shift(today, 6 - weekday) },
    { label: "Este mes", from: `${today.slice(0, 8)}01`, to: lastDayOfMonth(today) },
  ];
  const activeRange = ranges.find((r) => r.from === from && r.to === to)?.label;
  const href = (r: { from: string; to: string }) => {
    const q = new URLSearchParams({ desde: r.from, hasta: r.to });
    if (method) q.set("metodo", method);
    return `/panel/caja?${q}`;
  };
  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-EC", { timeZone: tz, ...opts }).format(new Date(iso));
  const multiDay = from !== to;

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Caja</h1>
          <p className="text-sm text-muted">Lo cobrado en el período, por método de pago.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {ranges.map((r) => {
          const active = r.label === activeRange;
          return (
            <Link
              key={r.label}
              href={href(r)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                active ? "bg-night-900 text-white" : "bg-surface text-muted hover:text-ink",
              )}
            >
              {r.label}
            </Link>
          );
        })}
        <span className="ml-1 flex items-center gap-2 text-sm text-muted">
          <DateInput param="desde" value={from} label="Desde" />
          a
          <DateInput param="hasta" value={to} label="Hasta" />
        </span>
        <FilterSelect
          param="metodo"
          label="Método"
          options={METHODS.map((m) => ({ value: m, label: methodLabels[m] }))}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl bg-night-900 px-5 py-4 text-white sm:col-span-2 lg:col-span-1">
          <p className="text-xs text-night-200">Total cobrado</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{money(summary.total)}</p>
          <p className="text-xs text-night-200">
            {summary.count} {summary.count === 1 ? "pago" : "pagos"}
            {summary.voided > 0 && ` · ${summary.voided} anulado${summary.voided === 1 ? "" : "s"}`}
          </p>
        </div>
        {METHODS.map((m) => (
          <div key={m} className="rounded-2xl bg-surface px-5 py-4">
            <p className="text-xs text-muted">{methodLabels[m]}</p>
            <p className={cn("mt-1 text-xl font-bold tabular-nums", Number(summary.byMethod[m]) === 0 && "text-muted")}>
              {money(summary.byMethod[m])}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-3xl bg-surface p-6">
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">No hay pagos en este período.</p>
        ) : (
          <div className="-mx-6 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  <th className="px-6 pb-2.5 font-medium">{multiDay ? "Fecha" : "Hora"}</th>
                  <th className="px-4 pb-2.5 font-medium">Paciente</th>
                  <th className="px-4 pb-2.5 font-medium">Concepto</th>
                  <th className="px-4 pb-2.5 font-medium">Método</th>
                  <th className="px-4 pb-2.5 font-medium">Recibió</th>
                  <th className="px-4 pb-2.5 text-right font-medium">Monto</th>
                  <th className="w-px px-6 pb-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((p) => {
                  const voided = !!p.voidedAt;
                  return (
                    <tr key={p.id} className={cn(voided && "text-muted")}>
                      <td className="px-6 py-3 whitespace-nowrap tabular-nums">
                        {multiDay && `${fmt(p.paidAt, { day: "numeric", month: "short" })} · `}
                        {fmt(p.paidAt, { hour: "2-digit", minute: "2-digit", hour12: false })}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/panel/pacientes/${p.patient.id}?tab=cuenta`}
                          className="font-medium hover:text-brand-600 hover:underline"
                        >
                          {p.patient.firstName} {p.patient.lastName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(voided && "line-through")}>
                          <PaymentConcept payment={p} />
                        </span>
                        {voided && <p className="text-xs text-red-600">Anulado: {p.voidReason}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {methodLabels[p.method]}
                        {p.reference && <span className="block text-xs text-muted">{p.reference}</span>}
                      </td>
                      <td className="px-4 py-3 text-muted">{p.receivedBy.fullName}</td>
                      <td className={cn("px-4 py-3 text-right font-semibold tabular-nums", voided && "line-through")}>
                        {money(p.amount)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="flex justify-end gap-3 whitespace-nowrap">
                          <ReceiptLink payment={p} />
                          {me.role === "OWNER" && !voided && <VoidPaymentButton payment={p} />}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
