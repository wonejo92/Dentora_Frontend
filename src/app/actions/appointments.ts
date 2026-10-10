"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { guard } from "@/lib/dal";
import type {
  AppointmentStatus,
  BookingOptions,
  DoctorOption,
  DoctorSlots,
  Paginated,
  Patient,
  Treatment,
} from "@/lib/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Ejecuta una llamada que modifica datos y refresca todo el panel. */
async function mutate(call: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await guard(call());
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    throw e;
  }
  revalidatePath("/panel", "layout");
  return { ok: true };
}

// ─── Lecturas para los formularios ───

export async function getBookingOptions(): Promise<BookingOptions> {
  const [treatments, doctors] = await Promise.all([
    guard(api<Treatment[]>("/treatments")),
    guard(api<DoctorOption[]>("/doctors")),
  ]);
  return {
    // Solo lo que se puede agendar: activo y con al menos un doctor.
    treatments: treatments.filter((t) => t.isActive && t.doctors.length > 0),
    doctors: doctors.filter((d) => d.isActive),
  };
}

export async function searchPatients(q: string): Promise<Patient[]> {
  const query = new URLSearchParams({ limit: "8" });
  if (q.trim()) query.set("q", q.trim());
  const { items } = await guard(api<Paginated<Patient>>(`/patients?${query}`));
  return items;
}

export async function getAvailability(
  treatmentId: string,
  date: string,
  doctorId?: string,
): Promise<DoctorSlots[]> {
  const query = new URLSearchParams({ treatmentId, date });
  if (doctorId) query.set("doctorId", doctorId);
  try {
    return await guard(api<DoctorSlots[]>(`/appointments/availability?${query}`));
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return [];
    throw e;
  }
}

// ─── Cambios ───

export async function createAppointment(input: {
  patientId: string;
  treatmentId: string;
  doctorId: string;
  startsAt: string;
  notes?: string;
}) {
  return mutate(() =>
    api("/appointments", { method: "POST", body: { ...input, notes: input.notes || undefined } }),
  );
}

export async function rescheduleAppointment(id: string, input: { doctorId: string; startsAt: string }) {
  return mutate(() => api(`/appointments/${id}`, { method: "PATCH", body: input }));
}

export async function changeAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  cancelReason?: string,
) {
  return mutate(() =>
    api(`/appointments/${id}/status`, {
      method: "PATCH",
      body: { status, cancelReason: cancelReason || undefined },
    }),
  );
}

/** Usado por el botón "Confirmar" de la tarjeta "Próxima cita" del resumen. */
export async function confirmAppointment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) await changeAppointmentStatus(id, "CONFIRMED");
}
