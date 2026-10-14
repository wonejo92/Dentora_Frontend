import "server-only";
import { headers } from "next/headers";

/** IP del visitante, para que el backend limite las peticiones por persona y no por servidor. */
export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
}
