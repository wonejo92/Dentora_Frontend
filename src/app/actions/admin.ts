"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { guard } from "@/lib/dal";
import type { ClinicStatus } from "@/lib/types";
import type { ActionResult } from "./appointments";

/** Cambia el estado, el plan o el fin de la prueba de una clínica (solo super-admin). */
export async function updateClinicAdmin(
  id: string,
  body: { status?: ClinicStatus; plan?: "BASIC" | "PRO" | "CLINIC"; trialEndsAt?: string },
): Promise<ActionResult> {
  try {
    await guard(api(`/admin/clinics/${id}`, { method: "PATCH", body }));
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    throw e;
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}
