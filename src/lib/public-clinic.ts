import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { api, ApiError } from "./api";
import type { PublicClinic } from "./types";

/** Datos públicos de la clínica: una sola llamada por request (layout, metadata y página). */
export const loadPublicClinic = cache(async (slug: string) => {
  try {
    return await api<PublicClinic>(`/public/clinics/${encodeURIComponent(slug)}`, { auth: false });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
});

/**
 * Colores de marca de la clínica a partir de su color principal. Se mezclan con
 * los tokens de superficie y texto, así funcionan en modo claro y oscuro.
 */
export const brandVars = (color: string) =>
  ({
    "--color-brand-500": color,
    "--color-brand-600": `color-mix(in oklab, ${color} 82%, var(--color-ink))`,
    "--color-brand-700": `color-mix(in oklab, ${color} 55%, var(--color-ink))`,
    "--color-brand-50": `color-mix(in oklab, ${color} 12%, var(--color-surface))`,
    "--color-brand-100": `color-mix(in oklab, ${color} 22%, var(--color-surface))`,
    "--color-brand-200": `color-mix(in oklab, ${color} 40%, var(--color-surface))`,
  }) as React.CSSProperties;
