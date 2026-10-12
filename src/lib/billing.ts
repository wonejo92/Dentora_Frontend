import type { BudgetStatus, PaymentMethod } from "./types";

export const budgetStatusLabels: Record<BudgetStatus, string> = {
  DRAFT: "Borrador",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  CANCELLED: "Anulado",
};

export const budgetStatusStyles: Record<BudgetStatus, string> = {
  DRAFT: "bg-canvas text-muted",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-50 text-red-700",
  CANCELLED: "bg-canvas text-muted line-through",
};

export const methodLabels: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  OTHER: "Otro",
};

const usd = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

/** $1.234,50 — a diferencia de formatPrice, 0 se muestra como $0,00. */
export const money = (value: string | number) => usd.format(Number(value));

/** Redondeo a centavos igual que el backend (mitad hacia arriba). */
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const lineTotal = (quantity: number, unitPrice: number, discountPercent: number) =>
  round2(quantity * unitPrice * (1 - discountPercent / 100));

export const applyDiscount = (subtotal: number, discountPercent: number) =>
  round2(subtotal * (1 - discountPercent / 100));
