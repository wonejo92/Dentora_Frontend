"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { getBudgetTreatments, saveBudget } from "@/app/actions/billing";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Modal } from "@/components/ui/modal";
import { applyDiscount, lineTotal, money } from "@/lib/billing";
import { cn } from "@/lib/cn";
import type { Budget } from "@/lib/types";

type CatalogItem = { id: string; name: string; price: string | null };

/** Línea en edición: los números como texto para poder borrarlos al escribir. */
type Row = {
  key: number;
  treatmentId: string;
  description: string;
  tooth: string;
  quantity: string;
  unitPrice: string;
  discountPercent: string;
};

let nextKey = 0;
const emptyRow = (): Row => ({
  key: nextKey++,
  treatmentId: "",
  description: "",
  tooth: "",
  quantity: "1",
  unitPrice: "",
  discountPercent: "",
});

const num = (value: string) => {
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
/** Solo dígitos y un separador decimal. */
const decimalInput = (value: string) => value.replace(/[^\d.,]/g, "").replace(/([.,].*)[.,]/, "$1");

const inDays = (days: number) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);

export function BudgetDialog({
  patientId,
  budget,
  onClose,
}: {
  patientId: string;
  budget?: Budget;
  onClose: () => void;
}) {
  const [catalog, setCatalog] = useState<CatalogItem[] | null>(null);
  const [rows, setRows] = useState<Row[]>(() =>
    budget
      ? budget.items.map((i) => ({
          key: nextKey++,
          treatmentId: i.treatmentId ?? "",
          description: i.description,
          tooth: i.tooth ?? "",
          quantity: String(i.quantity),
          unitPrice: String(Number(i.unitPrice)),
          discountPercent: Number(i.discountPercent) ? String(Number(i.discountPercent)) : "",
        }))
      : [emptyRow()],
  );
  const [discount, setDiscount] = useState(
    budget && Number(budget.discountPercent) ? String(Number(budget.discountPercent)) : "",
  );
  const [notes, setNotes] = useState(budget?.notes ?? "");
  const [validUntil, setValidUntil] = useState(budget ? (budget.validUntil?.slice(0, 10) ?? "") : inDays(30));
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    getBudgetTreatments().then(setCatalog);
  }, []);

  const update = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const pickTreatment = (key: number, treatmentId: string) => {
    const t = catalog?.find((c) => c.id === treatmentId);
    update(key, {
      treatmentId,
      ...(t && { description: t.name, unitPrice: t.price ? String(Number(t.price)) : "" }),
    });
  };

  const totals = rows.map((r) =>
    lineTotal(Math.max(1, num(r.quantity)), num(r.unitPrice), Math.min(100, num(r.discountPercent))),
  );
  const subtotal = totals.reduce((a, b) => a + b, 0);
  const total = applyDiscount(subtotal, Math.min(100, num(discount)));

  const save = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await saveBudget(patientId, budget?.id ?? null, {
        items: rows.map((r) => ({
          treatmentId: r.treatmentId || undefined,
          description: r.description,
          tooth: r.tooth,
          quantity: Math.max(1, Math.round(num(r.quantity))),
          unitPrice: num(r.unitPrice),
          discountPercent: num(r.discountPercent) || undefined,
        })),
        discountPercent: num(discount) || undefined,
        notes,
        validUntil,
      });
      if (!result.ok) return setError(result.error);
      onClose();
      toast.success(budget ? "Presupuesto guardado" : "Presupuesto creado");
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={budget ? `Editar presupuesto #${budget.number}` : "Nuevo presupuesto"}
      description="Queda como borrador hasta que el paciente lo apruebe."
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Total <span className="ml-1 text-lg font-bold text-ink tabular-nums">{money(total)}</span>
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" onClick={save} disabled={pending}>
              {pending ? "Guardando…" : "Guardar presupuesto"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <FormError message={error} />

        <div className="overflow-hidden rounded-2xl border border-line">
          <div className="hidden grid-cols-[minmax(0,1fr)_64px_56px_88px_64px_88px_32px] gap-2 border-b border-line bg-canvas px-3 py-2 text-xs text-muted md:grid">
            <span>Tratamiento</span>
            <span>Pieza</span>
            <span>Cant.</span>
            <span>Precio</span>
            <span>Desc. %</span>
            <span className="text-right">Total</span>
            <span />
          </div>
          <ul className="divide-y divide-line">
            {rows.map((r, i) => (
              <li
                key={r.key}
                className="grid grid-cols-[repeat(4,minmax(0,1fr))_32px] items-center gap-2 px-3 py-2.5 md:grid-cols-[minmax(0,1fr)_64px_56px_88px_64px_88px_32px]"
              >
                <div className="col-span-4 flex min-w-0 flex-col gap-1.5 md:col-span-1">
                  <select
                    aria-label={`Tratamiento de la línea ${i + 1}`}
                    value={r.treatmentId}
                    onChange={(e) => pickTreatment(r.key, e.target.value)}
                    className={cn(controlClass(), "h-9 min-w-0 pr-8")}
                  >
                    <option value="">{catalog ? "Otro (escribir)" : "Cargando…"}</option>
                    {catalog?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  {!r.treatmentId && (
                    <input
                      aria-label={`Descripción de la línea ${i + 1}`}
                      value={r.description}
                      onChange={(e) => update(r.key, { description: e.target.value })}
                      maxLength={200}
                      placeholder="Descripción"
                      className={cn(controlClass(), "h-9")}
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : rs))}
                  disabled={rows.length === 1}
                  aria-label={`Quitar línea ${i + 1}`}
                  className="col-start-5 row-start-1 flex size-8 items-center justify-center rounded-full text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent md:order-last md:col-start-auto md:row-start-auto"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
                <SmallInput
                  label="Pieza"
                  value={r.tooth}
                  placeholder="36"
                  onChange={(v) => update(r.key, { tooth: v.slice(0, 20) })}
                />
                <SmallInput
                  label="Cant."
                  value={r.quantity}
                  inputMode="numeric"
                  onChange={(v) => update(r.key, { quantity: v.replace(/\D/g, "").slice(0, 2) })}
                />
                <SmallInput
                  label="Precio"
                  value={r.unitPrice}
                  inputMode="decimal"
                  placeholder="0"
                  onChange={(v) => update(r.key, { unitPrice: decimalInput(v) })}
                />
                <SmallInput
                  label="Desc. %"
                  value={r.discountPercent}
                  inputMode="decimal"
                  placeholder="0"
                  onChange={(v) => update(r.key, { discountPercent: decimalInput(v) })}
                />
                <p className="col-span-4 text-right text-sm font-semibold tabular-nums md:col-span-1">
                  {money(totals[i])}
                </p>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, emptyRow()])}
            disabled={rows.length >= 50}
            className="w-full border-t border-line px-4 py-2.5 text-left text-sm font-semibold text-brand-500 hover:bg-canvas"
          >
            + Agregar tratamiento
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="budget-notes" className="text-sm font-medium">
                Notas para el paciente
              </label>
              <textarea
                id="budget-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Forma de pago, número de sesiones, garantía…"
                className={cn(controlClass(), "resize-y py-2.5")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="budget-valid" className="text-sm font-medium">
                Válido hasta
              </label>
              <input
                id="budget-valid"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className={cn(controlClass(), "h-11 w-48")}
              />
            </div>
          </div>

          <dl className="space-y-2 self-start rounded-2xl bg-canvas p-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums">{money(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>
                <label htmlFor="budget-discount" className="text-muted">
                  Descuento general %
                </label>
              </dt>
              <dd>
                <input
                  id="budget-discount"
                  value={discount}
                  onChange={(e) => setDiscount(decimalInput(e.target.value))}
                  inputMode="decimal"
                  placeholder="0"
                  className={cn(controlClass(), "h-8 w-20 text-right tabular-nums")}
                />
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{money(total)}</dd>
            </div>
            <p className="text-xs text-muted">Servicios de salud: IVA 0 %.</p>
          </dl>
        </div>
      </div>
    </Modal>
  );
}

function SmallInput({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "decimal";
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-[11px] text-muted md:block">
      <span className="md:sr-only">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-label={label}
        className={cn(controlClass(), "h-9 w-full px-2 text-ink tabular-nums")}
      />
    </label>
  );
}
