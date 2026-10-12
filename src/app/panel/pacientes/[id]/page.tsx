import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppointmentActions } from "@/components/appointments/appointment-actions";
import { ClinicalNotes, type ChartableAppointment } from "@/components/clinical/clinical-notes";
import { MedicalAlertsBanner } from "@/components/clinical/medical-alerts";
import { MedicalHistorySummary } from "@/components/clinical/medical-history-summary";
import { NewAppointmentDialog } from "@/components/appointments/new-appointment-dialog";
import { ChevronLeftIcon } from "@/components/panel/icons";
import { PatientDialog } from "@/components/patients/patient-dialog";
import { buttonClass } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { api, ApiError } from "@/lib/api";
import { guard, requireClinicUser } from "@/lib/dal";
import { ageFrom, whatsappLink } from "@/lib/format";
import { genderLabels, idTypeLabels, initials } from "@/lib/labels";
import { formatTime, isFuture } from "@/lib/time";
import { cn } from "@/lib/cn";
import type { ClinicalNote, MedicalHistory, PatientDetail } from "@/lib/types";

export const metadata: Metadata = { title: "Ficha del paciente" };

const HISTORY_LIMIT = 50;

async function loadPatient(id: string) {
  try {
    return await guard(api<PatientDetail>(`/patients/${id}`));
  } catch (e) {
    // 404: no existe o es de otra clínica. 400: el id no es un UUID válido.
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) notFound();
    throw e;
  }
}

/** La historia clínica solo la ven el dueño y los doctores (LOPDP). */
const canChart = (role: string) => role === "OWNER" || role === "DOCTOR";
const serverNow = () => Date.now();

export default async function PatientPage({ params, searchParams }: PageProps<"/panel/pacientes/[id]">) {
  const me = await requireClinicUser();
  const tz = me.clinic.timezone;
  const { id } = await params;
  const { tab, cita } = await searchParams;
  const chart = canChart(me.role);
  const showHistory = chart && tab === "historia";
  const p = await loadPatient(id);

  const date = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-EC", { timeZone: tz, ...opts }).format(new Date(iso));
  const whatsapp = whatsappLink(p.phone);

  return (
    <div className="w-full space-y-4">
      <Link href="/panel/pacientes" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <span className="scale-75">
          <ChevronLeftIcon />
        </span>
        Pacientes
      </Link>

      <section className="flex flex-wrap items-start gap-5 rounded-3xl bg-surface p-6">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xl font-bold text-brand-600">
          {initials(`${p.firstName.split(" ")[0]} ${p.lastName}`)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {p.firstName} {p.lastName}
          </h1>
          <p className="text-sm text-muted tabular-nums">
            {idTypeLabels[p.idType]} {p.idNumber}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {p.birthDate && (
              <Chip>
                {ageFrom(p.birthDate)} años · {date(p.birthDate, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
              </Chip>
            )}
            {p.gender && <Chip>{genderLabels[p.gender]}</Chip>}
            <Chip>Paciente desde {date(p.createdAt, { month: "long", year: "numeric" })}</Chip>
            {p.dataConsentAt ? (
              <span className="rounded-full bg-green-100 px-2.5 py-1 font-medium text-green-800">
                Datos autorizados el {date(p.dataConsentAt, { day: "numeric", month: "short", year: "numeric" })}
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-800">
                Sin autorización de datos (LOPDP)
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary")}>
              WhatsApp
            </a>
          )}
          <PatientDialog patient={p} triggerClassName={buttonClass("secondary")}>
            Editar
          </PatientDialog>
          <NewAppointmentDialog
            timeZone={tz}
            patient={p}
            afterCreate="stay"
            triggerClassName={buttonClass("primary")}
          >
            + Agendar cita
          </NewAppointmentDialog>
        </div>
      </section>

      <MedicalAlertsBanner alerts={p.medicalHistory} />

      {chart && (
        <nav aria-label="Secciones de la ficha" className="flex gap-1">
          {[
            { href: `/panel/pacientes/${p.id}`, label: "Resumen", active: !showHistory },
            { href: `/panel/pacientes/${p.id}?tab=historia`, label: "Historia clínica", active: showHistory },
          ].map((t) => (
            <Link
              key={t.label}
              href={t.href}
              aria-current={t.active ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                t.active ? "bg-night-900 text-white" : "bg-surface text-muted hover:text-ink",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      )}

      {showHistory ? (
        <ClinicalHistory
          patient={p}
          currentUserId={me.id}
          timeZone={tz}
          openAppointmentId={typeof cita === "string" ? cita : undefined}
        />
      ) : (
        <Overview patient={p} timeZone={tz} canChart={chart} />
      )}
    </div>
  );
}

function Overview({ patient: p, timeZone: tz, canChart }: { patient: PatientDetail; timeZone: string; canChart: boolean }) {
  const date = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-EC", { timeZone: tz, ...opts }).format(new Date(iso));
  const history = p.appointments;
  const upcoming = history
    .filter((a) => isFuture(a.startsAt) && (a.status === "PENDING" || a.status === "CONFIRMED"))
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const lastVisit = history.find((a) => a.status === "COMPLETED");
  const count = (status: string) => history.filter((a) => a.status === status).length;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="space-y-4">
        <Card title="Contacto">
          <dl className="space-y-3 text-sm">
            <Row label="Celular" value={p.phone} />
            <Row label="Correo" value={p.email} />
            <Row label="Dirección" value={p.address} />
          </dl>
        </Card>
        <Card title="Notas">
          {p.notes ? (
            <p className="text-sm whitespace-pre-line">{p.notes}</p>
          ) : (
            <p className="text-sm text-muted">Sin notas. Úsalas para preferencias o datos administrativos.</p>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Citas" value={history.length} />
          <Stat label="Atendidas" value={count("COMPLETED")} />
          <Stat label="No asistió" value={count("NO_SHOW")} tone={count("NO_SHOW") > 0 ? "danger" : undefined} />
          <Stat label="Canceladas" value={count("CANCELLED")} />
        </div>

        {(upcoming[0] || lastVisit) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming[0] && (
              <div className="rounded-3xl bg-night-900 p-5 text-white">
                <p className="text-xs text-night-300">Próxima cita</p>
                <p className="mt-1 text-lg font-bold first-letter:uppercase">
                  {date(upcoming[0].startsAt, { weekday: "long", day: "numeric", month: "short" })} ·{" "}
                  {formatTime(upcoming[0].startsAt, tz)}
                </p>
                <p className="text-sm text-night-200">
                  {upcoming[0].treatment.name} · {upcoming[0].doctor.fullName}
                </p>
              </div>
            )}
            {lastVisit && (
              <div className="rounded-3xl bg-surface p-5">
                <p className="text-xs text-muted">Última visita</p>
                <p className="mt-1 text-lg font-bold first-letter:uppercase">
                  {date(lastVisit.startsAt, { day: "numeric", month: "long", year: "numeric" })}
                </p>
                <p className="text-sm text-muted">
                  {lastVisit.treatment.name} · {lastVisit.doctor.fullName}
                </p>
              </div>
            )}
          </div>
        )}

        <Card title="Historial de citas">
          {history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Este paciente aún no tiene citas.</p>
          ) : (
            <div className="-mx-6 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-y border-line bg-canvas/60 text-xs text-muted">
                  <tr>
                    <th className="px-6 py-2.5 font-medium">Fecha</th>
                    <th className="px-4 py-2.5 font-medium">Tratamiento</th>
                    <th className="px-4 py-2.5 font-medium">Doctor</th>
                    <th className="px-4 py-2.5 font-medium">Origen</th>
                    <th className="px-4 py-2.5 font-medium">Estado</th>
                    <th className="w-px px-6 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {history.map((a) => (
                    <tr key={a.id}>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <Link
                          href={`/panel/agenda?fecha=${new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(a.startsAt))}`}
                          className="font-medium hover:text-brand-600 hover:underline"
                        >
                          {date(a.startsAt, { day: "numeric", month: "short", year: "numeric" })}
                        </Link>
                        <span className="ml-2 text-muted tabular-nums">{formatTime(a.startsAt, tz)}</span>
                      </td>
                      <td className="px-4 py-3">{a.treatment.name}</td>
                      <td className="px-4 py-3 text-muted">
                        <span className="flex items-center gap-2">
                          <span className="size-2 rounded-full" style={{ backgroundColor: a.doctor.color }} />
                          {a.doctor.fullName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">{a.source === "ONLINE" ? "Online" : "Panel"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-6 py-3 text-right">
                        <AppointmentActions appointment={a} timeZone={tz} canChart={canChart} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {history.length === HISTORY_LIMIT && (
                <p className="px-6 pt-3 text-xs text-muted">Se muestran las últimas {HISTORY_LIMIT} citas.</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

async function ClinicalHistory({
  patient: p,
  currentUserId,
  timeZone,
  openAppointmentId,
}: {
  patient: PatientDetail;
  currentUserId: string;
  timeZone: string;
  openAppointmentId?: string;
}) {
  const [history, notes] = await Promise.all([
    guard(api<MedicalHistory | null>(`/patients/${p.id}/medical-history`)),
    guard(api<ClinicalNote[]>(`/patients/${p.id}/clinical-notes`)),
  ]);
  const now = serverNow();
  const charted = new Set(notes.map((n) => n.appointmentId));
  // Citas sin evolución que ya empezaron (atendidas o aún sin marcar).
  const appointments: ChartableAppointment[] = p.appointments
    .filter(
      (a) =>
        !charted.has(a.id) &&
        (a.status === "COMPLETED" ||
          ((a.status === "CONFIRMED" || a.status === "PENDING") && Date.parse(a.startsAt) <= now)),
    )
    .slice(0, 15)
    .map((a) => ({
      id: a.id,
      startsAt: a.startsAt,
      label: `${a.treatment.name} · ${a.doctor.fullName}`,
      completed: a.status === "COMPLETED",
    }));

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <MedicalHistorySummary patientId={p.id} history={history} timeZone={timeZone} />
      <ClinicalNotes
        patientId={p.id}
        notes={notes}
        appointments={appointments}
        currentUserId={currentUserId}
        timeZone={timeZone}
        now={now}
        openAppointmentId={openAppointmentId}
      />
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-canvas px-2.5 py-1 font-medium text-ink/80">{children}</span>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-surface p-6">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={value ? "break-words" : "text-muted"}>{value ?? "—"}</dd>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "danger" }) {
  return (
    <div className="rounded-2xl bg-surface px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`text-2xl font-bold ${tone === "danger" ? "text-red-600" : ""}`}>{value}</p>
    </div>
  );
}
