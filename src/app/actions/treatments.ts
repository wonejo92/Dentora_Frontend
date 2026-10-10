"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { guard } from "@/lib/dal";

export type FormState = { ok?: boolean; error?: string };

export async function saveTreatment(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const durationMin = Number(formData.get("durationMin"));
  const priceText = String(formData.get("price") ?? "").trim().replace(",", ".");

  if (!name) return { error: "Escribe el nombre del tratamiento" };
  if (!Number.isInteger(durationMin) || durationMin < 5) {
    return { error: "Elige una duración válida" };
  }
  const price = priceText === "" ? null : Number(priceText);
  if (price !== null && (Number.isNaN(price) || price < 0)) {
    return { error: "El precio debe ser un número mayor o igual a 0" };
  }

  const body = {
    name,
    description: description || null,
    durationMin,
    price,
    isPublic: formData.get("isPublic") === "on",
    doctorIds: formData.getAll("doctorIds").map(String),
    ...(id && { isActive: formData.get("isActive") === "on" }),
  };

  try {
    await guard(
      api(id ? `/treatments/${id}` : "/treatments", { method: id ? "PATCH" : "POST", body }),
    );
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }

  revalidatePath("/panel/tratamientos");
  return { ok: true };
}
