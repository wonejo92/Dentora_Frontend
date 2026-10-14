"use server";

import { api, ApiError } from "@/lib/api";
import { clientIp } from "@/lib/client-ip";
import type { DoctorSlots, NextAvailable, PublicBooking } from "@/lib/types";

export async function getPublicAvailability(
  slug: string,
  treatmentId: string,
  date: string,
  doctorId?: string,
): Promise<DoctorSlots[]> {
  const query = new URLSearchParams({ treatmentId, date });
  if (doctorId) query.set("doctorId", doctorId);
  try {
    return await api<DoctorSlots[]>(
      `/public/clinics/${encodeURIComponent(slug)}/availability?${query}`,
      { auth: false, clientIp: await clientIp() },
    );
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) return [];
    throw e;
  }
}

/** Primer horario libre de cada doctor que realiza el tratamiento. */
export async function getNextAvailable(slug: string, treatmentId: string): Promise<NextAvailable[]> {
  try {
    return await api<NextAvailable[]>(
      `/public/clinics/${encodeURIComponent(slug)}/next-available?treatmentId=${encodeURIComponent(treatmentId)}`,
      { auth: false, clientIp: await clientIp() },
    );
  } catch {
    // Es información de apoyo: si falla, la reserva sigue funcionando sin ella.
    return [];
  }
}

export type BookingResult = { ok: true; booking: PublicBooking } | { ok: false; error: string };

export async function bookPublic(
  slug: string,
  input: {
    treatmentId: string;
    doctorId: string;
    startsAt: string;
    notes?: string;
    patient: { idType: string; idNumber: string; firstName: string; lastName: string; phone: string; email?: string };
  },
): Promise<BookingResult> {
  try {
    const booking = await api<PublicBooking>(`/public/clinics/${encodeURIComponent(slug)}/appointments`, {
      method: "POST",
      auth: false,
      clientIp: await clientIp(),
      body: { ...input, dataConsent: true },
    });
    return { ok: true, booking };
  } catch (e) {
    if (e instanceof ApiError) {
      return {
        ok: false,
        error: e.status === 429 ? "Hiciste demasiados intentos. Espera un minuto y vuelve a intentarlo." : e.message,
      };
    }
    throw e;
  }
}
