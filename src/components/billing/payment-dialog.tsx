"use client";

import { useState, useTransition } from "react";
import { createPayment } from "@/app/actions/billing";
import { Button, buttonClass } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Modal } from "@/components/ui/modal";
import { methodLabels, money } from "@/lib/billing";
import { cn } from "@/lib/cn";
import type { Budget, PaymentMethod } from "@/lib/types";

const METHODS = Object.keys(methodLabels) as PaymentMethod[];

export function PaymentDialog({
  patientId,
  budgets,
  initialBudgetId,
  onClose,
}: {
  patientId: string;
  /** Presupuestos aprobados con saldo pendiente. */
  budgets: Budget[];
  initialBudgetId?: string;
  onClose: () => void;
}) {
  const [budgetId, setBudgetId] = useState(initialBudgetId ?? budgets[0]?.id ?? "");
  const selected = budgets.find((b) => b.id === budgetId);
  const [amount, setAmount] = useState(selected ? String(Number(selected.balance)) : "");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [reference, setReference] = useState("");
  const [concept, setConcept] = useState("");
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState<{ id: string; number: number } | null>(null);
  const [pending, startTransition] = useTransition();

  const choose = (id: string) => {
    setBudgetId(id);
    const b = budgets.find((x) => x.id === id);
    setAmount(b ? String(Number(b.balance)) : "");
  };

  const save = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await createPayment(patientId, {
        budgetId: budgetId || undefined,
        amount: Number(amount.replace(",", ".")),
        method,
        reference: method === "CASH" ? undefined : reference,
        concept: budgetId ? undefined : concept,
      });
      if (result.ok) setSaved({ id: result.paymentId, number: result.number });
      else setError(result.error);
    });
  };

  if (saved) {
    return (
      <Modal
        open
        onClose={onClose}
        title="Pago registrado"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={onClose}>
              Listo
            </Button>
            <a
              href={`/imprimir/recibo/${saved.id}`}
              target="_blank"
              rel="noopener"
              onClick={onClose}
              className={buttonClass("primary")}
            >
              Imprimir recibo
            </a>
          </>
        }
      >
        <div className="flex flex-col items-center py-4 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-green-100 text-green-700">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m5 12 5 5L20 7" />
            </svg>
          </span>
          <p className="mt-3 text-2xl font-bold tabular-nums">{money(Number(amount.replace(",", ".")))}</p>
          <p className="text-sm text-muted">
            {methodLabels[method]} · Recibo #{String(saved.number).padStart(6, "0")}
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Registrar pago"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={save} disabled={pending || !amount || (!budgetId && !concept.trim())}>
            {pending ? "Guardando…" : "Registrar pago"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <FormError message={error} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="pay-budget" className="text-sm font-medium">
            Aplicar a
          </label>
          <select
            id="pay-budget"
            value={budgetId}
            onChange={(e) => choose(e.target.value)}
            className={cn(controlClass(), "h-11")}
          >
            {budgets.map((b) => (
              <option key={b.id} value={b.id}>
                Presupuesto #{b.number} · saldo {money(b.balance)}
              </option>
            ))}
            <option value="">Pago suelto (sin presupuesto)</option>
          </select>
        </div>

        {!budgetId && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pay-concept" className="text-sm font-medium">
              Concepto <span className="text-red-600">*</span>
            </label>
            <input
              id="pay-concept"
              required
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              maxLength={200}
              placeholder="Ej. Consulta de valoración"
              className={cn(controlClass(), "h-11")}
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="pay-amount" className="text-sm font-medium">
            Monto
          </label>
          <div className="flex items-center gap-2">
            <div className="relative w-40">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted">$</span>
              <input
                id="pay-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
                inputMode="decimal"
                autoFocus
                className={cn(controlClass(), "h-11 w-full pl-7 text-lg font-semibold tabular-nums")}
              />
            </div>
            {selected && Number(amount.replace(",", ".")) !== Number(selected.balance) && (
              <button
                type="button"
                onClick={() => setAmount(String(Number(selected.balance)))}
                className="text-sm font-semibold text-brand-500 hover:text-brand-600"
              >
                Saldo completo ({money(selected.balance)})
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span id="pay-method" className="text-sm font-medium">
            Método
          </span>
          <div role="radiogroup" aria-labelledby="pay-method" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={method === m}
                onClick={() => setMethod(m)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                  method === m ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line hover:border-brand-200",
                )}
              >
                {methodLabels[m]}
              </button>
            ))}
          </div>
        </div>

        {method !== "CASH" && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pay-ref" className="text-sm font-medium">
              Referencia <span className="font-normal text-muted">(opcional)</span>
            </label>
            <input
              id="pay-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              maxLength={100}
              placeholder={method === "CARD" ? "Nº de voucher" : "Nº de transferencia"}
              className={cn(controlClass(), "h-11")}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
