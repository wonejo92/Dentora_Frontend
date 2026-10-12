import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintHeader, PrintSheet } from "@/components/print/print-layout";
import { api, ApiError } from "@/lib/api";
import { methodLabels, money } from "@/lib/billing";
import { guard, requireClinicUser } from "@/lib/dal";
import { idTypeLabels } from "@/lib/labels";
import type { PaymentReceipt } from "@/lib/types";

export const metadata: Metadata = { title: "Recibo" };

async function loadReceipt(id: string) {
  try {
    return await guard(api<PaymentReceipt>(`/payments/${id}`));
  } catch (e) {
    if (e instanceof ApiError && [400, 403, 404].includes(e.status)) notFound();
    throw e;
  }
}

/** Recibo de un pago para entregar al paciente (no es factura electrónica). */
export default async function PrintReceiptPage({ params }: PageProps<"/imprimir/recibo/[id]">) {
  await requireClinicUser();
  const { id } = await params;
  const p = await loadReceipt(id);
  const c = p.clinic;
  const when = new Intl.DateTimeFormat("es-EC", {
    timeZone: c.timezone,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(p.paidAt));
  const voided = !!p.voidedAt;

  return (
    <PrintSheet>
      <div className="relative">
        {voided && (
          <p
            aria-hidden
            className="pointer-events-none absolute inset-0 flex -rotate-12 items-center justify-center text-7xl font-black tracking-widest text-red-500/20"
          >
            ANULADO
          </p>
        )}

        <PrintHeader clinic={c} title="Recibo" number={p.number} note={voided ? "Anulado" : undefined} />

        <section className="mt-5 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs text-gray-500">Recibí de</p>
            <p className="font-semibold">
              {p.patient.firstName} {p.patient.lastName}
            </p>
            <p className="text-gray-600">
              {idTypeLabels[p.patient.idType]} {p.patient.idNumber}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Fecha</p>
            <p>{when}</p>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between gap-6">
            <p className="text-sm text-gray-500">La cantidad de</p>
            <p className="text-3xl font-bold tabular-nums">{money(p.amount)}</p>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-gray-200 pt-4 text-sm">
            <div>
              <dt className="text-xs text-gray-500">Por concepto de</dt>
              <dd>{p.budget ? `Abono al presupuesto #${p.budget.number}` : p.concept}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Forma de pago</dt>
              <dd>
                {methodLabels[p.method]}
                {p.reference && <span className="text-gray-600"> · {p.reference}</span>}
              </dd>
            </div>
            {p.budget && p.balanceAfter !== null && (
              <>
                <div>
                  <dt className="text-xs text-gray-500">Total del presupuesto</dt>
                  <dd className="tabular-nums">{money(p.budget.total)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Saldo pendiente</dt>
                  <dd className="font-semibold tabular-nums">
                    {Number(p.balanceAfter) > 0 ? money(p.balanceAfter) : "Cancelado en su totalidad"}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </section>

        {voided && (
          <p className="mt-4 text-sm text-red-700">
            Pago anulado por {p.voidedBy?.fullName ?? "—"}: {p.voidReason}
          </p>
        )}

        <footer className="mt-16 grid grid-cols-2 gap-12 text-center text-xs text-gray-600">
          <div className="border-t border-gray-400 pt-2">
            Recibido por {p.receivedBy.fullName}
            <br />
            {c.name}
          </div>
          <div className="border-t border-gray-400 pt-2">
            Firma del paciente
            <br />
            {p.patient.firstName} {p.patient.lastName}
          </div>
        </footer>
        <p className="mt-8 text-center text-[10px] text-gray-400">
          Este recibo no es un comprobante de venta autorizado por el SRI.
        </p>
      </div>
    </PrintSheet>
  );
}
