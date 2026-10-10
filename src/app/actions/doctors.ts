"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { guard } from "@/lib/dal";
import type { ScheduleBlock } from "@/lib/types";

export type FormState = { ok?: boolean; error?: string };

async function send(path: string, method: "POST" | "PATCH" | "PUT", body: unknown) {
  try {
    await guard(api(path, { method, body }));
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath("/panel/doctores");
  revalidatePath("/panel/tratamientos");
  return { ok: true };
}

export async function saveDoctor(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const text = (key: string) => String(formData.get(key) ?? "").trim();

  const fullName = text("fullName");
  if (fullName.length < 3) return { error: "Escribe el nombre del doctor" };

  const body = {
    fullName,
    specialty: text("specialty") || null,
    bio: text("bio") || null,
    color: text("color") || undefined,
    userId: text("userId") || null,
    treatmentIds: formData.getAll("treatmentIds").map(String),
    ...(id && { isActive: formData.get("isActive") === "on" }),
  };

  return send(id ? `/doctors/${id}` : "/doctors", id ? "PATCH" : "POST", body);
}

export async function saveSchedule(doctorId: string, blocks: ScheduleBlock[]): Promise<FormState> {
  return send(`/doctors/${doctorId}/schedule`, "PUT", { blocks });
}
