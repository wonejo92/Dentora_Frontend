"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { guard } from "@/lib/dal";

export async function confirmAppointment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await guard(api(`/appointments/${id}/status`, { method: "PATCH", body: { status: "CONFIRMED" } }));
  revalidatePath("/panel", "layout");
}
