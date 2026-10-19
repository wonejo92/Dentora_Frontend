"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { changeBudgetStatus, completeBudgetItem, deleteBudget } from "@/app/actions/billing";
import { Button, buttonClass } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Modal } from "@/components/ui/modal";
import { budgetStatusLabels, budgetStatusStyles, methodLabels, money } from "@/lib/billing";
import { cn } from "@/lib/cn";
import type { Budget, BudgetStatus, Payment, PatientAccount, Role } from "@/lib/types";
import { BudgetDialog } from "./budget-dialog";
import { PaymentDialog } from "./payment-dialog";
import { VoidPaymentDialog } from "./void-payment-dialog";

type Dialog =
  | { kind: "budget"; budget?: Budget }
  | { kind: "payment"; budgetId?: string }
  | { kind: "void"; payment: Payment }
  | null;

export function AccountView({
  patientId,
  account,
  role,
  timeZone,
}: {
  patientId: string;
  account: PatientAccount;
  role: Role;
  timeZone: string;
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = () => setDialog(null);
  const date = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) =>
    new Intl.DateTimeFormat("es-EC", { timeZone, ...opts }).format(new Date(iso));

  const { summary, budgets, payments } = account;
  const payable = budgets.filter((b) => b.status === "APPROVED" && Number(b.balance) > 0);
  const owes = Number(summary.balance) > 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label="Presupuestos aprobados" value={money(summary.charged)} />
        <Tile label="Pagado" value={money(summary.paid)} />
        <Tile label="Saldo pendiente" value={money(summary.balance)} tone={owes ? "warn" : "ok"} />
      </div>

      <section className="rounded-3xl bg-surface p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Presupuestos</h2>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setDialog({ kind: "payment" })}>
              Registrar pago
            </Button>
            <Button type="button" onClick={() => setDialog({ kind: "budget" })}>
              + Nuevo presupuesto
            </Button>
          </div>
        </div>

        {budgets.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            Aún no hay presupuestos. Crea uno con los tratamientos y precios para que el paciente lo apruebe.
          </p>
        ) : (
          <ul className="space-y-3">
            {budgets.map((b, i) => (
              <BudgetCard
                key={b.id}
                budget={b}
                defaultOpen={i === 0}
                date={date}
                onEdit={() => setDialog({ kind: "budget", budget: b })}
                onPay={() => setDialog({ kind: "payment", budgetId: b.id })}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl bg-surface p-6">
        <h2 className="mb-4 font-semibold">Pagos</h2>
        {payments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Sin pagos registrados.</p>
        ) : (
          <div className="-mx-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-y border-line bg-canvas/60 text-xs text-muted">
                <tr>
                  <th className="px-6 py-2.5 font-medium">Fecha</th>
                  <th className="px-4 py-2.5 font-medium">Concepto</th>
                  <th className="px-4 py-2.5 font-medium">Método</th>
                  <th className="px-4 py-2.5 font-medium">Recibió</th>
                  <th className="px-4 py-2.5 text-right font-medium">Monto</th>
                  <th className="w-px px-6 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.map((p) => (
                  <PaymentRow
                    key={p.id}
                    payment={p}
                    date={date}
                    canVoid={role === "OWNER"}
                    onVoid={() => setDialog({ kind: "void", payment: p })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {dialog?.kind === "budget" && <BudgetDialog patientId={patientId} budget={dialog.budget} onClose={close} />}
      {dialog?.kind === "payment" && (
        <PaymentDialog patientId={patientId} budgets={payable} initialBudgetId={dialog.budgetId} onClose={close} />
      )}
      {dialog?.kind === "void" && <VoidPaymentDialog payment={dialog.payment} onClose={close} />}
    </div>
  );
}

type DateFn = (iso: string, opts?: Intl.DateTimeFormatOptions) => string;

function Tile({ label, value, tone }: { label: string; value: string; tone?: "warn" | "ok" }) {
  return (
    <div className="rounded-2xl bg-surface px-5 py-4">
      <p className="text-xs text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          tone === "warn" && "text-amber-700",
          tone === "ok" && "text-green-700",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function ReceiptLink({ payment }: { payment: Payment }) {
  return (
    <a
      href={`/imprimir/recibo/${payment.id}`}
      target="_blank"
      rel="noopener"
      title={`Recibo #${String(payment.number).padStart(6, "0")}`}
      className="text-xs font-medium text-brand-600 hover:underline"
    >
      Recibo
    </a>
  );
}

export function PaymentConcept({ payment: p }: { payment: Payment }) {
  return <>{p.budget ? `Presupuesto #${p.budget.number}` : (p.concept ?? "Pago suelto")}</>;
}

function PaymentRow({
  payment: p,
  date,
  canVoid,
  onVoid,
}: {
  payment: Payment;
  date: DateFn;
  canVoid: boolean;
  onVoid: () => void;
}) {
  const voided = !!p.voidedAt;
  return (
    <tr className={cn(voided && "text-muted")}>
      <td className="px-6 py-3 whitespace-nowrap">
        {date(p.paidAt)}
        <span className="ml-2 text-muted tabular-nums">
          {date(p.paidAt, { hour: "2-digit", minute: "2-digit", hour12: false })}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={cn(voided && "line-through")}>
          <PaymentConcept payment={p} />
        </span>
        {voided && (
          <p className="text-xs text-red-600">
            Anulado por {p.voidedBy?.fullName ?? "—"}: {p.voidReason}
          </p>
        )}
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
          {canVoid && !voided && (
            <button type="button" onClick={onVoid} className="text-xs font-medium text-red-600 hover:underline">
              Anular
            </button>
          )}
        </span>
      </td>
    </tr>
  );
}

type Confirm = {
  title: string;
  text: string;
  action: string;
  /** Mensaje del toast al terminar ("Presupuesto anulado"). */
  done: string;
  run: () => Promise<{ ok: boolean; error?: string }>;
};

/** Toast al cambiar el estado de un presupuesto. */
const STATUS_DONE: Partial<Record<BudgetStatus, string>> = {
  APPROVED: "Presupuesto aprobado",
  REJECTED: "Presupuesto rechazado",
  DRAFT: "Presupuesto devuelto a borrador",
};

function BudgetCard({
  budget: b,
  defaultOpen,
  date,
  onEdit,
  onPay,
}: {
  budget: Budget;
  defaultOpen: boolean;
  date: DateFn;
  onEdit: () => void;
  onPay: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(undefined);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.error);
    });
  };
  const setStatus = (status: BudgetStatus) =>
    run(async () => {
      const result = await changeBudgetStatus(b.id, status);
      if (result.ok) toast.success(STATUS_DONE[status] ?? "Presupuesto actualizado");
      return result;
    });

  const approved = b.status === "APPROVED";
  const paidPct = Number(b.total) > 0 ? Math.min(100, (Number(b.paid) / Number(b.total)) * 100) : 0;
  const done = b.items.filter((i) => i.completedAt).length;
  const lineDiscount = b.items.some((i) => Number(i.discountPercent) > 0);

  return (
    <li className="rounded-2xl border border-line">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="group flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={cn("shrink-0 text-muted transition-transform", open && "rotate-90")}
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-semibold group-hover:text-brand-600">Presupuesto #{b.number}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", budgetStatusStyles[b.status])}>
                {budgetStatusLabels[b.status]}
              </span>
            </span>
            <span className="block text-xs text-muted">
              {date(b.createdAt)} · {b.createdBy.fullName} · {b.items.length}{" "}
              {b.items.length === 1 ? "tratamiento" : "tratamientos"}
              {approved && ` · ${done} de ${b.items.length} realizados`}
            </span>
          </span>
        </button>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums">{money(b.total)}</p>
          {approved && (
            <p className="text-xs text-muted tabular-nums">
              {Number(b.balance) > 0 ? (
                <>
                  Saldo <span className="font-semibold text-amber-700">{money(b.balance)}</span>
                </>
              ) : (
                <span className="font-semibold text-green-700">Pagado</span>
              )}
            </p>
          )}
        </div>
        {approved && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas" aria-hidden>
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${paidPct}%` }} />
          </div>
        )}
      </div>

      {open && (
        <div className="border-t border-line p-4">
          <FormError message={error} />
          <div className="-mx-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  {approved && (
                    <th className="w-10 pl-4 font-medium">
                      <span className="sr-only">Realizado</span>
                    </th>
                  )}
                  <th className={cn("py-2 font-medium", !approved && "pl-4")}>Tratamiento</th>
                  <th className="px-3 py-2 text-right font-medium">Cant.</th>
                  <th className="px-3 py-2 text-right font-medium">Precio</th>
                  {lineDiscount && <th className="px-3 py-2 text-right font-medium">Desc.</th>}
                  <th className="py-2 pr-4 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {b.items.map((i) => (
                  <tr key={i.id} className={cn(i.completedAt && "text-muted")}>
                    {approved && (
                      <td className="pl-4">
                        <input
                          type="checkbox"
                          checked={!!i.completedAt}
                          disabled={pending}
                          onChange={(e) => run(() => completeBudgetItem(b.id, i.id, e.target.checked))}
                          aria-label={`Marcar ${i.description} como realizado`}
                          title={i.completedAt ? `Realizado el ${date(i.completedAt)}` : "Marcar como realizado"}
                          className="size-4 accent-brand-500"
                        />
                      </td>
                    )}
                    <td className={cn("py-2.5", !approved && "pl-4")}>
                      <span className={cn(i.completedAt && "line-through")}>{i.description}</span>
                      {i.tooth && (
                        <span className="ml-2 rounded-md bg-canvas px-1.5 py-0.5 text-xs text-muted">
                          Pieza {i.tooth}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{i.quantity}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{money(i.unitPrice)}</td>
                    {lineDiscount && (
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {Number(i.discountPercent) > 0 ? `${Number(i.discountPercent)} %` : "—"}
                      </td>
                    )}
                    <td className="py-2.5 pr-4 text-right font-medium tabular-nums">{money(i.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-md space-y-1 text-sm">
              {b.notes && <p className="whitespace-pre-line text-muted">{b.notes}</p>}
              {b.validUntil && b.status === "DRAFT" && (
                <p className="text-xs text-muted">
                  Válido hasta el{" "}
                  {date(b.validUntil, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
                </p>
              )}
            </div>
            <dl className="min-w-56 space-y-1 text-sm">
              {Number(b.discountPercent) > 0 && (
                <>
                  <Line label="Subtotal" value={money(b.subtotal)} />
                  <Line
                    label={`Descuento ${Number(b.discountPercent)} %`}
                    value={`− ${money(Number(b.subtotal) - Number(b.total))}`}
                  />
                </>
              )}
              <Line label="Total" value={money(b.total)} strong />
              {approved && (
                <>
                  <Line label="Pagado" value={money(b.paid)} />
                  <Line label="Saldo" value={money(b.balance)} strong />
                </>
              )}
            </dl>
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
            <a
              href={`/imprimir/presupuesto/${b.id}`}
              target="_blank"
              rel="noopener"
              className={buttonClass("ghost", "h-9")}
            >
              Imprimir / PDF
            </a>
            {(b.status === "DRAFT" || b.status === "REJECTED") && (
              <Button
                type="button"
                variant="ghost"
                className="h-9 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() =>
                  setConfirm({
                    title: `Eliminar presupuesto #${b.number}`,
                    text: "Se borra por completo. Esta acción no se puede deshacer.",
                    action: "Eliminar",
                    done: "Presupuesto eliminado",
                    run: () => deleteBudget(b.id),
                  })
                }
              >
                Eliminar
              </Button>
            )}
            {approved && Number(b.paid) === 0 && (
              <Button
                type="button"
                variant="ghost"
                className="h-9 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() =>
                  setConfirm({
                    title: `Anular presupuesto #${b.number}`,
                    text: "Queda en el historial como anulado y deja de sumar al saldo del paciente.",
                    action: "Anular",
                    done: "Presupuesto anulado",
                    run: () => changeBudgetStatus(b.id, "CANCELLED"),
                  })
                }
              >
                Anular
              </Button>
            )}
            {b.status === "REJECTED" && (
              <Button
                type="button"
                variant="secondary"
                className="h-9"
                disabled={pending}
                onClick={() => setStatus("DRAFT")}
              >
                Reabrir como borrador
              </Button>
            )}
            {b.status === "DRAFT" && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9"
                  disabled={pending}
                  onClick={() => setStatus("REJECTED")}
                >
                  Rechazar
                </Button>
                <Button type="button" variant="secondary" className="h-9" onClick={onEdit}>
                  Editar
                </Button>
                <Button type="button" className="h-9" disabled={pending} onClick={() => setStatus("APPROVED")}>
                  Aprobar
                </Button>
              </>
            )}
            {approved && Number(b.balance) > 0 && (
              <Button type="button" className="h-9" onClick={onPay}>
                Registrar pago
              </Button>
            )}
          </div>
        </div>
      )}

      {confirm && <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />}
    </li>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-6", strong ? "font-semibold" : "text-muted")}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function ConfirmDialog({ confirm, onClose }: { confirm: Confirm; onClose: () => void }) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const go = () =>
    startTransition(async () => {
      const result = await confirm.run();
      if (!result.ok) return setError(result.error);
      onClose();
      toast.success(confirm.done);
    });
  return (
    <Modal
      open
      onClose={onClose}
      title={confirm.title}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Volver
          </Button>
          <Button type="button" onClick={go} disabled={pending} className="bg-red-600 hover:bg-red-700">
            {pending ? "…" : confirm.action}
          </Button>
        </>
      }
    >
      <FormError message={error} />
      <p className="text-sm text-muted">{confirm.text}</p>
    </Modal>
  );
}
