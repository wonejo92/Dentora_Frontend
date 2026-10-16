import type { ClinicStatus } from "./types";

export type PlanKey = "BASIC" | "PRO" | "CLINIC";

export const clinicStatus: Record<ClinicStatus, { label: string; className: string }> = {
  TRIAL: { label: "Prueba", className: "bg-brand-50 text-brand-700" },
  ACTIVE: { label: "Activa", className: "bg-green-100 text-green-800" },
  PAST_DUE: { label: "Pago atrasado", className: "bg-amber-100 text-amber-800" },
  SUSPENDED: { label: "Suspendida", className: "bg-red-100 text-red-700" },
};

/** Los mismos precios que muestra la landing. */
export const plans: Record<PlanKey, { label: string; price: number }> = {
  BASIC: { label: "Básico", price: 19 },
  PRO: { label: "Pro", price: 39 },
  CLINIC: { label: "Clínica", price: 69 },
};

export const DAY_MS = 864e5;

/** "hoy", "ayer", "hace 3 días", "hace 2 meses". */
export function ago(iso: string, now: number) {
  const days = Math.floor((now - Date.parse(iso)) / DAY_MS);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  return months === 1 ? "hace 1 mes" : `hace ${months} meses`;
}

/** Días que le quedan a una prueba (negativo si ya venció). */
export const trialDaysLeft = (trialEndsAt: string | null, now: number) =>
  trialEndsAt ? Math.ceil((Date.parse(trialEndsAt) - now) / DAY_MS) : null;

/**
 * Porcentaje de la prueba que todavía queda (0–100), medido sobre su duración
 * real: desde el alta hasta el fin, que puede haberse extendido.
 */
export function trialLeftPercent(createdAt: string, trialEndsAt: string | null, now: number) {
  if (!trialEndsAt) return 0;
  const end = Date.parse(trialEndsAt);
  const total = end - Date.parse(createdAt);
  return total > 0 ? Math.max(0, Math.min(100, ((end - now) / total) * 100)) : 0;
}
