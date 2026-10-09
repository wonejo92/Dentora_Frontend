"use server";

import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { createSession, deleteSession } from "@/lib/session";
import type { Me } from "@/lib/types";

export type AuthFormState = {
  error?: string;
  values?: Record<string, string>;
};

type Session = { token: string; user: Me };

const read = (formData: FormData, ...keys: string[]) =>
  Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "").trim()]));

/** Solo acepta rutas internas para evitar redirecciones a otros sitios. */
const safeRedirect = (path: string | undefined, fallback: string) =>
  path?.startsWith("/") && !path.startsWith("//") ? path : fallback;

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = read(formData, "email", "desde");
  const password = String(formData.get("password") ?? "");
  if (!values.email || !password) {
    return { error: "Ingresa tu correo y contraseña", values };
  }

  let session: Session;
  try {
    session = await api<Session>("/auth/login", {
      method: "POST",
      body: { email: values.email, password },
      auth: false,
    });
  } catch (e) {
    const wrongCredentials = e instanceof ApiError && (e.status === 400 || e.status === 401);
    return {
      error: wrongCredentials
        ? "Correo o contraseña incorrectos"
        : e instanceof ApiError
          ? e.message
          : "No se pudo iniciar sesión",
      values,
    };
  }

  await createSession(session.token);
  const home = session.user.role === "SUPER_ADMIN" ? "/admin" : "/panel";
  redirect(safeRedirect(values.desde, home));
}

export async function registerClinic(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = read(formData, "clinicName", "city", "phone", "ownerName", "email");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres", values };
  }

  let session: Session;
  try {
    session = await api<Session>("/auth/register-clinic", {
      method: "POST",
      body: {
        clinicName: values.clinicName,
        ownerName: values.ownerName,
        email: values.email,
        password,
        city: values.city || undefined,
        phone: values.phone || undefined,
      },
      auth: false,
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "No se pudo crear la clínica", values };
  }

  await createSession(session.token);
  redirect("/panel?bienvenida=1");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
