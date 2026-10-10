"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { guard, requireClinicUser } from "@/lib/dal";
import { addDays, startOfLocalDay } from "@/lib/time";
import type { Appointment } from "@/lib/types";

export type TimeOffState = {
  ok?: boolean;
  error?: string;
  /** Citas activas que quedaron dentro del bloqueo y hay que reprogramar. */
  conflicts?: Appointment[];
};

const MAX_DAYS = 62;

/** "HH:MM" → minutos desde medianoche. */
const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

export async function createTimeOff(_prev: TimeOffState, formData: FormData): Promise<TimeOffState> {
  const me = await requireClinicUser();
  const tz = me.clinic.timezone;
  const text = (key: string) => String(formData.get(key) ?? "").trim();

  const doctorId = text("doctorId") || undefined;
  const from = text("from");
  const fullDay = text("mode") !== "hours";
  if (!from) return { error: "Elige la fecha" };

  let startsAt: Date;
  let endsAt: Date;
  if (fullDay) {
    const to = text("to") || from;
    if (to < from) return { error: "La fecha final no puede ser anterior a la inicial" };
    startsAt = startOfLocalDay(from, tz);
    endsAt = startOfLocalDay(addDays(to, 1), tz);
  } else {
    const start = text("startTime");
    const end = text("endTime");
    if (!start || !end || toMinutes(end) <= toMinutes(start)) {
      return { error: "La hora de fin debe ser posterior a la de inicio" };
    }
    const day = startOfLocalDay(from, tz).getTime();
    startsAt = new Date(day + toMinutes(start) * 60000);
    endsAt = new Date(day + toMinutes(end) * 60000);
  }
  if (endsAt.getTime() - startsAt.getTime() > MAX_DAYS * 864e5) {
    return { error: `Un bloqueo puede durar como máximo ${MAX_DAYS} días. Divídelo en partes.` };
  }

  try {
    await guard(
      api("/time-offs", {
        method: "POST",
        body: {
          doctorId,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          reason: text("reason") || undefined,
        },
      }),
    );
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }

  // El backend no impide bloquear días con citas: se avisa para reprogramarlas.
  const query = new URLSearchParams({ from: startsAt.toISOString(), to: endsAt.toISOString() });
  if (doctorId) query.set("doctorId", doctorId);
  const appointments = await guard(api<Appointment[]>(`/appointments?${query}`));
  const conflicts = appointments.filter((a) => a.status === "PENDING" || a.status === "CONFIRMED");

  revalidatePath("/panel", "layout");
  return { ok: true, conflicts };
}

export async function deleteTimeOff(id: string) {
  try {
    await guard(api(`/time-offs/${id}`, { method: "DELETE" }));
  } catch (e) {
    if (e instanceof ApiError) return { ok: false as const, error: e.message };
    throw e;
  }
  revalidatePath("/panel", "layout");
  return { ok: true as const };
}
