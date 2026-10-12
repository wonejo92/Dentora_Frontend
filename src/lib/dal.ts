import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { api, ApiError } from "./api";
import type { Me } from "./types";

/** Motivo de cierre según el 401 del backend: contraseña cambiada o sesión vencida. */
const expiredReason = (e: ApiError) =>
  e.message.includes("contraseña cambió") ? "/salir?motivo=contrasena" : "/salir?motivo=expirada";

/**
 * Usuario de la sesión, validado contra el backend (una vez por request).
 * Si el token expiró o la clínica está suspendida, cierra la sesión.
 */
export const getMe = cache(async (): Promise<Me> => {
  try {
    return await api<Me>("/auth/me");
  } catch (e) {
    if (e instanceof ApiError && e.status === 403) redirect("/salir?motivo=suspendida");
    if (e instanceof ApiError && e.status === 401) redirect(expiredReason(e));
    throw e;
  }
});

export type ClinicMe = Me & { clinic: NonNullable<Me["clinic"]> };

/** Para el panel: solo usuarios de una clínica. */
export async function requireClinicUser(): Promise<ClinicMe> {
  const me = await getMe();
  if (me.role === "SUPER_ADMIN" || !me.clinic) redirect("/admin");
  return me as ClinicMe;
}

/** Para /admin: solo el dueño de Dentora. */
export async function requireSuperAdmin(): Promise<Me> {
  const me = await getMe();
  if (me.role !== "SUPER_ADMIN") redirect("/panel");
  return me;
}

/** Envuelve llamadas del panel: si la sesión cae a mitad de camino, vuelve al login. */
export async function guard<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect(expiredReason(e));
    if (e instanceof ApiError && e.status === 403 && e.message.includes("suspendida")) {
      redirect("/salir?motivo=suspendida");
    }
    throw e;
  }
}
