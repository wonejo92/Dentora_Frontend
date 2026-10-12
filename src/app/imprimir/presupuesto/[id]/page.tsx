import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintHeader, PrintSheet } from "@/components/print/print-layout";
import { api, ApiError } from "@/lib/api";
import { budgetStatusLabels, money } from "@/lib/billing";
import { guard, requireClinicUser } from "@/lib/dal";
import { idTypeLabels } from "@/lib/labels";
import type { BudgetDetail } from "@/lib/types";

export const metadata: Metadata = { title: "Presupuesto" };

async function loadBudget(id: string) {
  try {
    return await guard(api<BudgetDetail>(`/budgets/${id}`));
  } catch (e) {
    if (e instanceof ApiError && [400, 403, 404].includes(e.status)) notFound();
    throw e;
  }
}

/** Presupuesto listo para imprimir o guardar como PDF. */
export default async function PrintBudgetPage({ params }: PageProps<"/imprimir/presupuesto/[id]">) {
  await requireClinicUser();
  const { id } = await params;
  const b = await loadBudget(id);
  const c = b.clinic;
  const date = (iso: string, utc = false) =>
    new Intl.DateTimeFormat("es-EC", {
      timeZone: utc ? "UTC" : c.timezone,
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  const lineDiscount = b.items.some((i) => Number(i.discountPercent) > 0);
  const showTooth = b.items.some((i) => i.tooth);

  return (
    <PrintSheet>
      <PrintHeader
        clinic={c}
        title="Presupuesto"
        number={b.number}
        note={b.status !== "APPROVED" ? budgetStatusLabels[b.status] : undefined}
      />

      <section className="mt-5 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-xs text-gray-500">Paciente</p>
          <p className="font-semibold">
            {b.patient.firstName} {b.patient.lastName}
          </p>
          <p className="text-gray-600">
            {idTypeLabels[b.patient.idType]} {b.patient.idNumber}
          </p>
          {b.patient.phone && <p className="text-gray-600">{b.patient.phone}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Fecha</p>
          <p>{date(b.createdAt)}</p>
          {b.validUntil && (
            <>
              <p className="mt-1 text-xs text-gray-500">Válido hasta</p>
              <p>{date(b.validUntil, true)}</p>
            </>
          )}
        </div>
      </section>

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-300 text-xs text-gray-500">
            <th className="py-2 font-medium">#</th>
            <th className="py-2 font-medium">Tratamiento</th>
            {showTooth && <th className="px-2 py-2 font-medium">Pieza</th>}
            <th className="px-2 py-2 text-right font-medium">Cant.</th>
            <th className="px-2 py-2 text-right font-medium">Precio</th>
            {lineDiscount && <th className="px-2 py-2 text-right font-medium">Desc.</th>}
            <th className="py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {b.items.map((i, n) => (
            <tr key={i.id} className="border-b border-gray-200 break-inside-avoid">
              <td className="py-2 text-gray-500 tabular-nums">{n + 1}</td>
              <td className="py-2">{i.description}</td>
              {showTooth && <td className="px-2 py-2">{i.tooth ?? "—"}</td>}
              <td className="px-2 py-2 text-right tabular-nums">{i.quantity}</td>
              <td className="px-2 py-2 text-right tabular-nums">{money(i.unitPrice)}</td>
              {lineDiscount && (
                <td className="px-2 py-2 text-right tabular-nums">
                  {Number(i.discountPercent) > 0 ? `${Number(i.discountPercent)} %` : "—"}
                </td>
              )}
              <td className="py-2 text-right font-medium tabular-nums">{money(i.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end break-inside-avoid">
        <dl className="w-64 space-y-1 text-sm">
          <Row label="Subtotal" value={money(b.subtotal)} />
          {Number(b.discountPercent) > 0 && (
            <Row
              label={`Descuento ${Number(b.discountPercent)} %`}
              value={`− ${money(Number(b.subtotal) - Number(b.total))}`}
            />
          )}
          <Row label="IVA 0 %" value={money(0)} />
          <div className="flex justify-between border-t border-gray-300 pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{money(b.total)}</dd>
          </div>
          {b.status === "APPROVED" && Number(b.paid) > 0 && (
            <>
              <Row label="Pagado" value={money(b.paid)} />
              <Row label="Saldo" value={money(b.balance)} />
            </>
          )}
        </dl>
      </div>

      {b.notes && (
        <section className="mt-6 break-inside-avoid rounded-lg bg-gray-50 p-4 text-sm print:border print:border-gray-200 print:bg-white">
          <p className="mb-1 text-xs font-semibold text-gray-500">Observaciones</p>
          <p className="whitespace-pre-line">{b.notes}</p>
        </section>
      )}

      <footer className="mt-16 grid grid-cols-2 gap-12 text-center text-xs text-gray-600 break-inside-avoid">
        <div className="border-t border-gray-400 pt-2">
          {b.createdBy.fullName}
          <br />
          {c.name}
        </div>
        <div className="border-t border-gray-400 pt-2">
          Firma del paciente
          <br />
          Acepto el presupuesto
        </div>
      </footer>
      <p className="mt-8 text-center text-[10px] text-gray-400">
        Los valores pueden variar si cambia el diagnóstico durante el tratamiento.
      </p>
    </PrintSheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-gray-600">
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
