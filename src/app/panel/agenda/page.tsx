import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/panel/icons";
import { buttonClass } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { guard, requireClinicUser } from "@/lib/dal";
import {
  addDays,
  formatLongDate,
  formatTime,
  isValidDate,
  localDate,
  startOfLocalDay,
} from "@/lib/time";
import type { Appointment } from "@/lib/types";

export const metadata: Metadata = { title: "Agenda" };

export default async function AgendaPage({ searchParams }: PageProps<"/panel/agenda">) {
  const me = await requireClinicUser();
  const tz = me.clinic.timezone;
  const { fecha } = await searchParams;

  const today = localDate(new Date(), tz);
  const date = isValidDate(fecha) ? fecha : today;
  const from = startOfLocalDay(date, tz).toISOString();
  const to = startOfLocalDay(addDays(date, 1), tz).toISOString();

  const appointments = await guard(
    api<Appointment[]>(`/appointments?from=${from}&to=${to}`),
  );
  const active = appointments.filter((a) => a.status !== "CANCELLED");
  const pending = appointments.filter((a) => a.status === "PENDING").length;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{formatLongDate(date)}</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {date === today ? "Citas de hoy" : "Citas del día"}
          </h1>
        </div>
        <nav aria-label="Cambiar de día" className="flex items-center gap-2">
          <Link
            href={`/panel/agenda?fecha=${addDays(date, -1)}`}
            aria-label="Día anterior"
            className={buttonClass("secondary", "px-2.5")}
          >
            <ChevronLeftIcon />
          </Link>
          {date !== today && (
            <Link href="/panel/agenda" className={buttonClass("secondary")}>
              Hoy
            </Link>
          )}
          <Link
            href={`/panel/agenda?fecha=${addDays(date, 1)}`}
            aria-label="Día siguiente"
            className={buttonClass("secondary", "px-2.5")}
          >
            <ChevronRightIcon />
          </Link>
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

      {appointments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
          <p className="font-semibold">No hay citas este día</p>
          <p className="mt-1 text-sm text-muted">
            Las reservas online y las que agende la recepción aparecerán aquí.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {appointments.map((a) => (
            <li
              key={a.id}
              className={`grid grid-cols-[56px_4px_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-line bg-white px-4 py-3.5 ${
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
