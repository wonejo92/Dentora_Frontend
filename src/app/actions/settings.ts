"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { guard } from "@/lib/dal";

export type SettingsState = { ok?: boolean; error?: string; savedAt?: number };

async function save(path: string, method: "POST" | "PATCH", body: unknown): Promise<SettingsState> {
  try {
    await guard(api(path, { method, body }));
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  // El nombre de la clínica aparece en el menú lateral: se refresca todo el panel.
  revalidatePath("/panel", "layout");
  return { ok: true, savedAt: Date.now() };
}

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
/** Campo opcional: vacío → null para poder borrarlo. */
const optional = (formData: FormData, key: string) => text(formData, key) || null;

/** 0991234567 → 593991234567 (el backend guarda el número con código de país). */
function toWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  return /^0\d{9}$/.test(digits) ? `593${digits.slice(1)}` : digits;
}

export async function saveClinic(_prev: SettingsState, formData: FormData) {
  const name = text(formData, "name");
  if (name.length < 3) return { error: "Escribe el nombre de la clínica" };

  const slug = text(formData, "slug").toLowerCase();
  if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { error: "La dirección solo admite minúsculas, números y guiones (sin espacios ni tildes)" };
  }

  return save("/clinic", "PATCH", {
    name,
    slug: slug || undefined,
    ruc: optional(formData, "ruc"),
    description: optional(formData, "description"),
    phone: optional(formData, "phone"),
    whatsapp: toWhatsapp(text(formData, "whatsapp")),
    email: optional(formData, "email"),
    address: optional(formData, "address"),
    city: optional(formData, "city"),
    logoUrl: optional(formData, "logoUrl"),
    primaryColor: text(formData, "primaryColor") || undefined,
  });
}

export async function saveAgendaRules(_prev: SettingsState, formData: FormData) {
  return save("/clinic", "PATCH", {
    slotStepMin: Number(formData.get("slotStepMin")),
    minBookingNoticeMin: Number(formData.get("minBookingNoticeMin")),
    maxBookingDaysAhead: Number(formData.get("maxBookingDaysAhead")),
    autoConfirmOnline: formData.get("autoConfirmOnline") === "on",
  });
}

export async function saveUser(_prev: SettingsState, formData: FormData) {
  const id = text(formData, "id");
  const fullName = text(formData, "fullName");
  const password = String(formData.get("password") ?? "");
  if (fullName.length < 3) return { error: "Escribe el nombre completo" };
  if ((!id || password) && password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres" };
  }

  if (!id) {
    return save("/users", "POST", {
      fullName,
      email: text(formData, "email"),
      password,
      role: text(formData, "role"),
    });
  }
  return save(`/users/${id}`, "PATCH", {
    fullName,
    role: text(formData, "role") || undefined,
    ...(formData.has("isActive") || formData.has("isActiveField")
      ? { isActive: formData.get("isActive") === "on" }
      : {}),
    ...(password && { password }),
  });
}
