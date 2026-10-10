import type { Metadata } from "next";
import Link from "next/link";
import { AppointmentActions } from "@/components/appointments/appointment-actions";
import { NewAppointmentDialog } from "@/components/appointments/new-appointment-dialog";
import { DateInput } from "@/components/list/date-input";
import { ClearFilters, FilterSelect } from "@/components/list/filter-select";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/panel/icons";
import { buttonClass } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { guard, requireClinicUser } from "@/lib/dal";
import { hrefWith, param } from "@/lib/list";
import {
  addDays,
  describeRange,
  formatLongDate,
  formatTime,
  isValidDate,
  localDate,
  startOfLocalDay,
} from "@/lib/time";
import type { Appointment, AppointmentStatus, DoctorOption, TimeOff } from "@/lib/types";

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: "PENDING", label: "Pendientes" },
  { value: "CONFIRMED", label: "Confirmadas" },
  { value: "COMPLETED", label: "Atendidas" },
  { value: "NO_SHOW", label: "No asistió" },
  { value: "CANCELLED", label: "Canceladas" },
];

export const metadata: Metadata = { title: "Agenda" };

export default async function AgendaPage({ searchParams }: PageProps<"/panel/agenda">) {
  const me = await requireClinicUser();
  const tz = me.clinic.timezone;
  const params = await searchParams;
  const fecha = param(params, "fecha");
  const doctor = param(params, "doctor");
  const estado = param(params, "estado");

  const today = localDate(new Date(), tz);
  const date = isValidDate(fecha) ? fecha : today;
  const from = startOfLocalDay(date, tz).toISOString();
  const to = startOfLocalDay(addDays(date, 1), tz).toISOString();

  const [appointments, doctors, timeOffs] = await Promise.all([
    guard(api<Appointment[]>(`/appointments?from=${from}&to=${to}`)),
    guard(api<DoctorOption[]>("/doctors")),
    guard(api<TimeOff[]>("/time-offs")),
  ]);
  const blocks = timeOffs.filter((t) => t.startsAt < to && t.endsAt > from);
  // Los contadores son del día completo; los filtros solo afectan a la lista.
  const active = appointments.filter((a) => a.status !== "CANCELLED");
  const pending = appointments.filter((a) => a.status === "PENDING").length;
  const shown = appointments.filter(
    (a) => (!doctor || a.doctor.id === doctor) && (!estado || a.status === estado),
  );
  const dayHref = (d: string | null) => hrefWith("/panel/agenda", params, { fecha: d });

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{formatLongDate(date)}</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {date === today ? "Citas de hoy" : "Citas del día"}
          </h1>
        </div>
        <nav aria-label="Cambiar de día" className="flex items-center gap-2">
          <Link
            href={dayHref(addDays(date, -1))}
            aria-label="Día anterior"
            className={buttonClass("secondary", "px-2.5")}
          >
            <ChevronLeftIcon />
          </Link>
          {date !== today && (
            <Link href={dayHref(null)} className={buttonClass("secondary")}>
              Hoy
            </Link>
          )}
          <Link
            href={dayHref(addDays(date, 1))}
            aria-label="Día siguiente"
            className={buttonClass("secondary", "px-2.5")}
          >
            <ChevronRightIcon />
          </Link>
          <DateInput value={date} label="Ir a una fecha" />
          <NewAppointmentDialog
            timeZone={tz}
            initialDate={date}
            triggerClassName={buttonClass("primary", "ml-2")}
          >
            + Nueva cita
          </NewAppointmentDialog>
        </nav>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Citas" value={active.length} />
        <Stat label="Por confirmar" value={pending} highlight={pending > 0} />
        <Stat
          label="Online"
          value={active.filter((a) => a.source === "ONLINE").length}
          className="hidden sm:block"
        />
      </div>

      {blocks.length > 0 && (
        <div className="mb-4 space-y-2">
          {blocks.map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: b.doctor?.color ?? "#b45309" }} />
              <p>
                <span className="font-semibold">
                  {b.doctor ? `${b.doctor.fullName} no atiende` : "Clínica cerrada"}
                </span>
                {" · "}
                {describeRange(b.startsAt, b.endsAt, tz).label}
                {b.reason && ` · ${b.reason}`}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterSelect
          param="doctor"
          label="Doctor"
          options={doctors.map((d) => ({ value: d.id, label: d.fullName }))}
        />
        <FilterSelect param="estado" label="Estado" options={STATUS_OPTIONS} />
        <ClearFilters params={["doctor", "estado"]} />
      </div>

      {shown.length === 0 ? (
        <div className="rounded-3xl bg-white px-6 py-14 text-center">
          <p className="font-semibold">
            {appointments.length === 0 ? "No hay citas este día" : "Ninguna cita coincide con los filtros"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {appointments.length === 0
              ? "Las reservas online y las que agende la recepción aparecerán aquí."
              : "Quita algún filtro para ver todas las citas del día."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {shown.map((a) => (
            <li
              key={a.id}
              className={`grid grid-cols-[56px_4px_minmax(0,1fr)_auto_auto] items-center gap-4 rounded-2xl border border-line bg-white px-4 py-3.5 ${
                a.status === "CANCELLED" ? "opacity-60" : ""
              }`}
            >
              <div>
                <p className="text-sm font-semibold">{formatTime(a.startsAt, tz)}</p>
                <p className="text-xs text-muted">{formatTime(a.endsAt, tz)}</p>
              </div>
              <span
                className="h-10 rounded-full"
                style={{ backgroundColor: a.doctor.color }}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {a.patient.firstName} {a.patient.lastName}
                </p>
                <p className="truncate text-xs text-muted">
                  {a.treatment.name} · {a.doctor.fullName}
                  {a.source === "ONLINE" && " · Reserva online"}
                </p>
              </div>
              <StatusBadge status={a.status} />
              <AppointmentActions appointment={a} timeZone={tz} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
  className = "",
}: {
  label: string;
  value: number;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-line bg-white px-4 py-3 ${className}`}>
      <p className="text-xs text-muted">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? "text-amber-600" : ""}`}>{value}</p>
    </div>
  );
}
