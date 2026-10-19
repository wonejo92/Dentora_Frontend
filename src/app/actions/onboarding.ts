"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { guard } from "@/lib/dal";
import type { OnboardingStatus } from "@/lib/types";

/** El dueño copió el enlace de reservas: cuenta como el paso "Comparte tu página". */
export async function markLinkShared() {
  await guard(api("/clinic/onboarding/link-shared", { method: "POST" }));
  revalidatePath("/panel");
}

/** Oculta la lista de primeros pasos del Resumen. */
export async function dismissOnboarding() {
  await guard(api("/clinic/onboarding/dismiss", { method: "POST" }));
  // "layout": así aparece "Mostrar primeros pasos" en el menú del usuario.
  revalidatePath("/panel", "layout");
}

/**
 * Vuelve a mostrar la lista de primeros pasos. Devuelve si quedan pasos
 * pendientes: con todo hecho, la lista no aparece aunque se restaure.
 */
export async function restoreOnboarding() {
  await guard(api("/clinic/onboarding/restore", { method: "POST" }));
  const status = await guard(api<OnboardingStatus>("/clinic/onboarding"));
  revalidatePath("/panel", "layout");
  return { pending: Object.values(status.steps).some((done) => !done) };
}

/** El usuario vio (o saltó) el tour: ya no se abre solo. */
export async function markTourSeen() {
  await guard(api("/auth/tour-seen", { method: "POST" }));
}
