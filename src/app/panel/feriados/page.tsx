import type { Metadata } from "next";
import { DeleteTimeOff } from "@/components/time-offs/delete-time-off";
import { TimeOffDialog } from "@/components/time-offs/time-off-dialog";
import { buttonClass } from "@/components/ui/button";
import { api } from "@/lib/api";
import { guard, requireClinicUser } from "@/lib/dal";
import { describeRange, isFuture, spanDays } from "@/lib/time";
import type { DoctorOption, TimeOff } from "@/lib/types";

export const metadata: Metadata = { title: "Feriados y vacaciones" };

export default async function TimeOffsPage() {
  const me = await requireClinicUser();
  const tz = me.clinic.timezone;
  // Igual que en el backend: solo el dueño y la recepción crean o eliminan bloqueos.
  const canEdit = me.role === "OWNER" || me.role === "RECEPTIONIST";
  const [timeOffs, doctors] = await Promise.all([
    guard(api<TimeOff[]>("/time-offs")),
    guard(api<DoctorOption[]>("/doctors")),
  ]);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feriados y vacaciones</h1>
          <p className="text-sm text-muted">Días u horas en que no se puede agendar.</p>
        </div>
        {canEdit && (
          <TimeOffDialog
            doctors={doctors.filter((d) => d.isActive)}
            timeZone={tz}
            triggerClassName={buttonClass("primary")}
          >
            + Nuevo bloqueo
          </TimeOffDialog>
        )}
      </div>

      {timeOffs.length === 0 ? (
        <section className="rounded-3xl bg-white px-6 py-16 text-center">
          <p className="font-semibold">No hay feriados ni vacaciones programados</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Bloquea los feriados para toda la clínica o las vacaciones de un doctor, y la agenda dejará de
            ofrecer esos horarios.
          </p>
        </section>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {timeOffs.map((t) => {
            const { label, fullDay } = describeRange(t.startsAt, t.endsAt, tz);
            const days = spanDays(t.startsAt, t.endsAt);
            const ongoing = !isFuture(t.startsAt);
            return (
              <li key={t.id} className="flex items-start gap-4 rounded-3xl bg-white p-5">
                <span
                  className="mt-1 size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: t.doctor?.color ?? "#073b49" }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold first-letter:uppercase">{label}</p>
                  <p className="text-sm text-muted">
                    {t.doctor ? t.doctor.fullName : "Toda la clínica"}
                    {t.reason && ` · ${t.reason}`}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    {ongoing && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-medium text-amber-800">En curso</span>
                    )}
                    <span className="rounded-full bg-canvas px-2.5 py-0.5 text-ink/80">
                      {fullDay ? `${days} ${days === 1 ? "día" : "días"}` : "Unas horas"}
                    </span>
                  </div>
                </div>
                {canEdit && <DeleteTimeOff id={t.id} label={`${label} · ${t.doctor?.fullName ?? "Toda la clínica"}`} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
