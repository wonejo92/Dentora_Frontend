"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { guard } from "@/lib/dal";
import { createSession } from "@/lib/session";
import type { Me } from "@/lib/types";

export type ProfileState = { ok?: boolean; error?: string };

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  if (fullName.length < 3) return { error: "El nombre debe tener al menos 3 caracteres" };
  try {
    await guard(api<Me>("/auth/me", { method: "PATCH", body: { fullName } }));
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changePassword(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  if (!currentPassword || !newPassword) return { error: "Completa la contraseña actual y la nueva" };
  if (newPassword.length < 8) return { error: "La contraseña nueva debe tener al menos 8 caracteres" };
  if (newPassword !== confirm) return { error: "Las contraseñas nuevas no coinciden" };

  let session: { token: string };
  try {
    session = await guard(
      api<{ token: string }>("/auth/change-password", {
        method: "POST",
        body: { currentPassword, newPassword },
      }),
    );
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  // El backend invalidó los tokens anteriores: este dispositivo sigue con el nuevo.
  await createSession(session.token);
  return { ok: true };
}
