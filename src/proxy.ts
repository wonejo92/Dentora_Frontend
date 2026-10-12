import { NextResponse, type NextRequest } from "next/server";
import { decodeJwt } from "jose";
import { SESSION_COOKIE } from "@/lib/constants";

const PROTECTED = ["/panel", "/admin"];
const AUTH_PAGES = ["/login", "/registro"];

/**
 * Chequeo optimista: solo mira si hay un token sin expirar.
 * La validación real la hace el backend en cada llamada (ver lib/dal.ts).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Web de las clínicas: los slugs son en minúsculas (/DentriClinic/reservar → /dentriclinic/reservar).
  if (/[A-Z]/.test(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.toLowerCase();
    return NextResponse.redirect(url, 308);
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const loggedIn = !!token && !isExpired(token);

  if (!loggedIn && PROTECTED.some((p) => pathname.startsWith(p))) {
    const url = new URL("/login", request.url);
    url.searchParams.set("desde", pathname);
    return NextResponse.redirect(url);
  }
  if (loggedIn && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL("/panel", request.url));
  }
  return NextResponse.next();
}

function isExpired(token: string) {
  try {
    const { exp } = decodeJwt(token);
    return !exp || exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export const config = {
  // Todas las páginas (la web de cada clínica vive en la raíz), menos archivos internos y estáticos.
  matcher: ["/((?!_next/|api/|favicon.ico|.*\\.[a-z0-9]+$).*)"],
};
