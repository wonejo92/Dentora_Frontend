import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

/**
 * Cierra la sesión cuando el backend la rechaza (token expirado, clínica suspendida).
 * Es una ruta y no un Server Component porque solo aquí se pueden borrar cookies.
 */
export function GET(request: NextRequest) {
  const motivo = request.nextUrl.searchParams.get("motivo");
  const url = new URL("/login", request.url);
  if (motivo) url.searchParams.set("motivo", motivo);

  const response = NextResponse.redirect(url);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
