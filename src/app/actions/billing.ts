"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { guard } from "@/lib/dal";
import type { BudgetStatus, PaymentMethod, Treatment } from "@/lib/types";
import type { ActionResult } from "./appointments";

async function mutate(call: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await guard(call());
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    throw e;
  }
  revalidatePath("/panel", "layout");
  return { ok: true };
}

export type BudgetInput = {
  items: {
    treatmentId?: string;
    description: string;
    tooth?: string;
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
  }[];
  discountPercent?: number;
  notes?: string;
  validUntil?: string;
};

export async function saveBudget(patientId: string, budgetId: string | null, input: BudgetInput) {
  const body = {
    ...input,
    items: input.items.map((i) => ({
      ...i,
      treatmentId: i.treatmentId || undefined,
      tooth: i.tooth?.trim() || undefined,
      description: i.description.trim(),
    })),
    notes: input.notes?.trim() || undefined,
    validUntil: input.validUntil || undefined,
  };
  if (body.items.some((i) => !i.description)) {
    return { ok: false, error: "Cada línea necesita una descripción" } as const;
  }
  return mutate(() =>
    budgetId
      ? api(`/budgets/${budgetId}`, { method: "PUT", body })
      : api(`/patients/${patientId}/budgets`, { method: "POST", body }),
  );
}

export async function changeBudgetStatus(budgetId: string, status: BudgetStatus) {
  return mutate(() => api(`/budgets/${budgetId}/status`, { method: "PATCH", body: { status } }));
}

export async function deleteBudget(budgetId: string) {
  return mutate(() => api(`/budgets/${budgetId}`, { method: "DELETE" }));
}

export async function completeBudgetItem(budgetId: string, itemId: string, done: boolean) {
  return mutate(() => api(`/budgets/${budgetId}/items/${itemId}`, { method: "PATCH", body: { done } }));
}

export async function createPayment(
  patientId: string,
  input: {
    budgetId?: string;
    amount: number;
    method: PaymentMethod;
    reference?: string;
    concept?: string;
  },
) {
  if (!(input.amount > 0)) return { ok: false, error: "Escribe un monto mayor a 0" } as const;
  if (!input.budgetId && !input.concept?.trim()) {
    return { ok: false, error: "Escribe el concepto del pago suelto" } as const;
  }
  let payment: { id: string; number: number };
  try {
    payment = await guard(
      api<{ id: string; number: number }>(`/patients/${patientId}/payments`, {
        method: "POST",
        body: {
          ...input,
          budgetId: input.budgetId || undefined,
          reference: input.reference?.trim() || undefined,
          concept: input.concept?.trim() || undefined,
        },
      }),
    );
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message } as const;
    throw e;
  }
  revalidatePath("/panel", "layout");
  return { ok: true, paymentId: payment.id, number: payment.number } as const;
}

export async function voidPayment(paymentId: string, reason: string) {
  if (reason.trim().length < 3) return { ok: false, error: "Escribe el motivo de la anulación" } as const;
  return mutate(() => api(`/payments/${paymentId}/void`, { method: "POST", body: { reason: reason.trim() } }));
}

/** Tratamientos activos para armar presupuestos (incluye los que no tienen doctor). */
export async function getBudgetTreatments() {
  const treatments = await guard(api<Treatment[]>("/treatments"));
  return treatments.filter((t) => t.isActive).map((t) => ({ id: t.id, name: t.name, price: t.price }));
}
