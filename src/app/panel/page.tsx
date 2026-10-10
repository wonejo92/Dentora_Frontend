import type { Metadata } from "next";
import Link from "next/link";
import { confirmAppointment } from "@/app/actions/appointments";
import { AppointmentActions } from "@/components/appointments/appointment-actions";
import {
  CalendarCheckIcon,
  ClockIcon,
  WorldIcon,
} from "@/components/panel/icons";
import { WeeklyChart } from "@/components/panel/weekly-chart";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import { guard, requireClinicUser } from "@/lib/dal";
import { formatTime, localDate } from "@/lib/time";
import type { Appointment, DashboardSummary } from "@/lib/types";

export const metadata: Metadata = { title: "Resumen" };

const monthName = (date: string, offset = 0) => {
  const [y, m] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("es-EC", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1 + offset, 1)),
  );
};

export default async function DashboardPage({ searchParams }: PageProps<"/panel">) {
  const me = await requireClinicUser();
  const tz = me.clinic.timezone;
  const { bienvenida } = await searchParams;
  const data = await guard(api<DashboardSummary>("/dashboard"));
  const { month } = data;

  return (
    <div className="w-full space-y-4">
      {bienvenida && (
        <Alert tone="info">
          ¡Bienvenido a Dentora! Empieza agregando tus tratamientos y doctores para abrir la
          agenda.
        </Alert>
      )}

      <section className="rounded-3xl bg-surface p-5 sm:p-7">
        <p className="text-muted">Citas en {monthName(data.today)}</p>
        <div className="mt-1 mb-6 flex flex-wrap items-center gap-3">
          <span className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            {month.count.toLocaleString("es-EC")}
          </span>
          {month.changePct !== null ? (
            <>
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  month.changePct >= 0 ? "bg-brand-500 text-white" : "bg-red-100 text-red-700"
                }`}
              >
                {month.changePct >= 0 ? "+" : ""}
                {month.changePct}%
              </span>
              <span className="text-sm text-muted">vs. {monthName(data.today, -1)}</span>
            </>
          ) : (
            <span className="text-sm text-muted">Primer mes con citas registradas</span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Kpi icon={<CalendarCheckIcon />} label="Hoy" value={data.todayCount} unit="citas" />
          <Kpi
            icon={<ClockIcon />}
            label="Por confirmar"
            value={data.pendingUpcoming}
            tone={data.pendingUpcoming > 0 ? "warning" : "brand"}
          />
          <Kpi icon={<WorldIcon />} label="Reservas online del mes" value={`${month.onlinePct}%`} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className="rounded-3xl bg-surface p-5 sm:p-6">
          <h2 className="mb-4 font-semibold">Citas por semana, últimas 12 semanas</h2>
          <WeeklyChart weeks={data.weekly} average={data.weeklyAverage} />
        </section>

        <NextAppointment appointment={data.nextAppointment} timeZone={tz} today={data.today} />
      </div>

      <section className="rounded-3xl bg-surface p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Citas de hoy</h2>
          <Link href="/panel/agenda" className="text-sm font-semibold text-brand-500 hover:text-brand-600">
            Ver agenda
          </Link>
        </div>
        {data.todayAppointments.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No hay citas para hoy.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-line">
                  <th className="py-2 pr-4 font-medium">Hora</th>
                  <th className="py-2 pr-4 font-medium">Paciente</th>
                  <th className="py-2 pr-4 font-medium">Tratamiento</th>
                  <th className="py-2 pr-4 font-medium">Doctor</th>
                  <th className="py-2 font-medium">Estado</th>
                  <th className="w-px py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.todayAppointments.map((a) => (
                  <tr key={a.id}>
                    <td className="py-3 pr-4 font-semibold tabular-nums">{formatTime(a.startsAt, tz)}</td>
                    <td className="py-3 pr-4">
                      {a.patient.firstName} {a.patient.lastName}
                    </td>
                    <td className="py-3 pr-4 text-muted">{a.treatment.name}</td>
                    <td className="py-3 pr-4 text-muted">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ backgroundColor: a.doctor.color }} />
                        {a.doctor.fullName}
                      </span>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="py-3 text-right">
                      <AppointmentActions appointment={a} timeZone={tz} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  unit,
  tone = "brand",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  unit?: string;
  tone?: "brand" | "warning";
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line px-4 py-4">
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
          tone === "warning" ? "bg-amber-100 text-amber-700" : "bg-brand-50 text-brand-500"
        }`}
      >
        {icon}
      </span>
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="text-2xl font-bold">
          {value} {unit && <span className="text-sm font-medium text-muted">{unit}</span>}
        </p>
      </div>
    </div>
  );
}

function NextAppointment({
  appointment: a,
  timeZone,
  today,
}: {
  appointment: Appointment | null;
  timeZone: string;
  today: string;
}) {
  if (!a) {
    return (
      <section className="flex flex-col justify-center rounded-3xl bg-night-900 p-6 text-white">
        <p className="text-sm text-night-300">Próxima cita</p>
        <p className="mt-2 text-lg font-semibold">No hay citas próximas</p>
        <p className="mt-1 text-sm text-night-200">
          Comparte el enlace de reservas de tu clínica para recibir citas online.
        </p>
      </section>
    );
  }

  const day = localDate(new Date(a.startsAt), timeZone);
  const dayLabel =
    day === today
      ? "Hoy"
      : new Intl.DateTimeFormat("es-EC", {
          weekday: "long",
          day: "numeric",
          month: "short",
          timeZone,
        }).format(new Date(a.startsAt));

  return (
    <section className="flex flex-col justify-between rounded-3xl bg-night-900 p-6 text-white">
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-night-300">Próxima cita</p>
          {a.status === "PENDING" && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              Por confirmar
            </span>
          )}
        </div>
        <p className="mt-2 text-4xl font-extrabold tracking-tight">{formatTime(a.startsAt, timeZone)}</p>
        <p className="text-sm text-night-200 first-letter:uppercase">{dayLabel}</p>
        <p className="mt-5 text-lg font-semibold">
          {a.patient.firstName} {a.patient.lastName}
        </p>
        <p className="text-sm text-night-200">
          {a.treatment.name} · {a.doctor.fullName}
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {a.status === "PENDING" && (
          <form action={confirmAppointment}>
            <input type="hidden" name="id" value={a.id} />
            <button
              type="submit"
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold transition-colors hover:bg-brand-600"
            >
              Confirmar
            </button>
          </form>
        )}
        <Link
          href={`/panel/agenda?fecha=${day}`}
          className="rounded-xl border border-night-700 px-4 py-2 text-sm transition-colors hover:bg-night-800"
        >
          Ver en la agenda
        </Link>
      </div>
    </section>
  );
}
