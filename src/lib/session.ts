import "server-only";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { SESSION_COOKIE } from "./constants";

/** Guarda el token del backend en una cookie httpOnly (el navegador no puede leerla). */
export async function createSession(token: string) {
  const { exp } = decodeJwt(token);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: exp ? new Date(exp * 1000) : undefined,
  });
}

export async function getSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
