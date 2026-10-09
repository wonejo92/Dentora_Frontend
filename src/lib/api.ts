import "server-only";
import { getSessionToken } from "./session";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

type Options = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** false para rutas públicas (login, registro, web de la clínica). */
  auth?: boolean;
};

/** Llama al backend desde el servidor de Next, adjuntando el token de la sesión. */
export async function api<T>(path: string, { method = "GET", body, auth = true }: Options = {}) {
  const token = auth ? await getSessionToken() : undefined;
  if (auth && !token) throw new ApiError(401, "Tu sesión expiró");

  let res: Response;
  try {
    res = await fetch(`${process.env.API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(503, "No se pudo conectar con el servidor. Intenta de nuevo.");
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // El backend responde { message: string | string[] }
    const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
    throw new ApiError(res.status, message ?? "Ocurrió un error inesperado");
  }
  return data as T;
}
