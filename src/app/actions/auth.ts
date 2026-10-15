"use server";

import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { clientIp } from "@/lib/client-ip";
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

export type RegisterInput = {
  clinicName: string;
  city: string;
  phone: string;
  ownerName: string;
  email: string;
  password: string;
};

/** Valida los datos del registro antes de enviar el código (los mismos que exige el backend). */
function registerError(d: RegisterInput) {
  if (d.clinicName.trim().length < 3) return "El nombre de la clínica debe tener al menos 3 caracteres";
  if (d.ownerName.trim().length < 3) return "Escribe tu nombre completo";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) return "Escribe un correo válido";
  if (d.password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
  return null;
}

/** Paso 1 del registro: envía un código de 6 dígitos al correo. */
export async function requestRegisterCode(data: RegisterInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const error = registerError(data);
  if (error) return { ok: false, error };
  try {
    await api("/auth/register-clinic/code", {
      method: "POST",
      body: { email: data.email.trim() },
      auth: false,
      clientIp: await clientIp(),
    });
  } catch (e) {
    return { ok: false, error: e instanceof ApiError ? e.message : "No se pudo enviar el código" };
  }
  return { ok: true };
}

/**
 * Paso 2 del registro: crea la clínica con el código recibido e inicia sesión.
 * No redirige: el formulario muestra la animación de éxito y luego va al panel.
 */
export async function registerClinic(
  data: RegisterInput & { code: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const error = registerError(data);
  if (error) return { ok: false, error };
  if (!/^\d{6}$/.test(data.code)) return { ok: false, error: "Escribe los 6 dígitos del código" };

  let session: Session;
  try {
    session = await api<Session>("/auth/register-clinic", {
      method: "POST",
      body: {
        clinicName: data.clinicName.trim(),
        ownerName: data.ownerName.trim(),
        email: data.email.trim(),
        password: data.password,
        city: data.city.trim() || undefined,
        phone: data.phone.trim() || undefined,
        code: data.code,
      },
      auth: false,
      clientIp: await clientIp(),
    });
  } catch (e) {
    return { ok: false, error: e instanceof ApiError ? e.message : "No se pudo crear la clínica" };
  }

  await createSession(session.token);
  return { ok: true };
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

const isEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/** Recuperar contraseña, paso 1: pide el código. Siempre responde igual, exista o no el correo. */
export async function requestPasswordReset(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isEmail(email)) return { ok: false, error: "Escribe un correo válido" };
  try {
    await api("/auth/password/forgot", {
      method: "POST",
      body: { email: email.trim() },
      auth: false,
      clientIp: await clientIp(),
    });
  } catch (e) {
    return { ok: false, error: e instanceof ApiError ? e.message : "No se pudo enviar el código" };
  }
  return { ok: true };
}

/** Recuperar contraseña, paso 2: cambia la contraseña con el código e inicia sesión. */
export async function resetPassword(input: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<{ ok: true; home: string } | { ok: false; error: string }> {
  if (!/^\d{6}$/.test(input.code)) return { ok: false, error: "Escribe los 6 dígitos del código" };
  if (input.newPassword.length < 8) {
    return { ok: false, error: "La contraseña nueva debe tener al menos 8 caracteres" };
  }

  let session: Session;
  try {
    session = await api<Session>("/auth/password/reset", {
      method: "POST",
      body: { email: input.email.trim(), code: input.code, newPassword: input.newPassword },
      auth: false,
      clientIp: await clientIp(),
    });
  } catch (e) {
    return { ok: false, error: e instanceof ApiError ? e.message : "No se pudo cambiar la contraseña" };
  }

  await createSession(session.token);
  return { ok: true, home: session.user.role === "SUPER_ADMIN" ? "/admin" : "/panel" };
}
