"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createAppointment, getBookingOptions } from "@/app/actions/appointments";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { formatDuration, formatPrice } from "@/lib/format";
import { idTypeLabels, initials } from "@/lib/labels";
import { formatTime, localDate } from "@/lib/time";
import type { BookingOptions, Patient } from "@/lib/types";
import { MedicalAlertsBanner } from "@/components/clinical/medical-alerts";
import { PatientPicker } from "./patient-picker";
import { SlotPicker, type SlotSelection } from "./slot-picker";

type Props = {
  timeZone: string;
  /** Paciente ya elegido (desde su ficha). */
  patient?: Patient;
  /** Día con el que abre el selector (por ejemplo, el que se está viendo en la agenda). */
  initialDate?: string;
  /** Tras agendar: ir a ese día en la agenda, o quedarse en la página actual. */
  afterCreate?: "agenda" | "stay";
  triggerClassName: string;
  triggerLabel?: string;
  children: React.ReactNode;
};

export function NewAppointmentDialog({ triggerClassName, triggerLabel, children, ...props }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => setOpen(true)}
        aria-label={triggerLabel}
        title={triggerLabel}
      >
        {children}
      </button>
      {/* Se monta al abrir: cada cita nueva empieza desde cero. */}
      {open && <NewAppointmentForm {...props} onClose={() => setOpen(false)} />}
    </>
  );
}

function NewAppointmentForm({
  timeZone,
  patient: initialPatient,
  initialDate,
  afterCreate = "agenda",
  onClose,
}: Omit<Props, "triggerClassName" | "triggerLabel" | "children"> & { onClose: () => void }) {
  const router = useRouter();
  const [options, setOptions] = useState<BookingOptions | null>(null);
  const [patient, setPatient] = useState<Patient | null>(initialPatient ?? null);
  const [treatmentId, setTreatmentId] = useState("");
  const [slot, setSlot] = useState<SlotSelection | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  // Para que el selector de horarios vuelva a pedir disponibilidad tras un choque.
  const [attempt, setAttempt] = useState(0);
  const today = localDate(new Date(), timeZone);

  useEffect(() => {
    getBookingOptions().then(setOptions);
  }, []);

  const treatment = options?.treatments.find((t) => t.id === treatmentId);
  const treatmentDoctors = options?.doctors.filter((d) => treatment?.doctors.some((td) => td.id === d.id)) ?? [];
  const doctor = options?.doctors.find((d) => d.id === slot?.doctorId);

  const submit = () => {
    if (!patient || !treatment || !slot) return;
    setError(undefined);
    startTransition(async () => {
      const result = await createAppointment({
        patientId: patient.id,
        treatmentId: treatment.id,
        doctorId: slot.doctorId,
        startsAt: slot.startsAt,
        notes: notes.trim(),
      });
      if (!result.ok) {
        // Normalmente: alguien tomó ese horario mientras se completaba el formulario.
        setError(result.error);
        setSlot(null);
        setAttempt((n) => n + 1);
        return;
      }
      onClose();
      if (afterCreate === "agenda") {
        router.push(`/panel/agenda?fecha=${localDate(new Date(slot.startsAt), timeZone)}`);
      }
    });
  };

  const summary =
    slot && treatment
      ? `${new Intl.DateTimeFormat("es-EC", { timeZone, weekday: "short", day: "numeric", month: "short" }).format(new Date(slot.startsAt))} · ${formatTime(slot.startsAt, timeZone)} a ${formatTime(new Date(Date.parse(slot.startsAt) + treatment.durationMin * 60000).toISOString(), timeZone)} · ${doctor?.fullName ?? ""}`
      : null;

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Nueva cita"
      description="Solo se muestran los horarios que de verdad están libres."
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted first-letter:uppercase">{summary ?? "Completa los pasos para agendar"}</p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" onClick={submit} disabled={!patient || !treatment || !slot || pending}>
              {pending ? "Agendando…" : "Agendar cita"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <FormError message={error} />

        <Step number={1} title="Paciente" done={!!patient}>
          {patient ? (
            <>
              <div className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-600">
                  {initials(`${patient.firstName.split(" ")[0]} ${patient.lastName}`)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-xs text-muted tabular-nums">
                    {idTypeLabels[patient.idType]} {patient.idNumber}
                  </p>
                </div>
                {!initialPatient && (
                  <button type="button" onClick={() => setPatient(null)} className="text-sm font-semibold text-brand-500 hover:text-brand-600">
                    Cambiar
                  </button>
                )}
              </div>
              <MedicalAlertsBanner alerts={patient.medicalHistory} className="mt-2" />
            </>
          ) : (
            <PatientPicker onSelect={setPatient} />
          )}
        </Step>

        <Step number={2} title="Tratamiento" done={!!treatment} disabled={!patient}>
          {!options ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <span key={i} className="h-12 w-40 animate-pulse rounded-2xl bg-canvas" />
              ))}
            </div>
          ) : options.treatments.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line px-4 py-4 text-sm text-muted">
              No hay tratamientos disponibles. Crea uno en Tratamientos y asígnale un doctor.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {options.treatments.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  disabled={!patient}
                  aria-pressed={t.id === treatmentId}
                  onClick={() => {
                    setTreatmentId(t.id);
                    setSlot(null);
                  }}
                  className={cn(
                    "rounded-2xl border px-4 py-2.5 text-left transition-colors disabled:cursor-not-allowed",
                    t.id === treatmentId
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-line bg-surface hover:border-brand-200 hover:bg-brand-50",
                  )}
                >
                  <span className="block text-sm font-semibold">{t.name}</span>
                  <span className={cn("block text-xs", t.id === treatmentId ? "text-white/75" : "text-muted")}>
                    {formatDuration(t.durationMin)}
                    {t.price !== null && ` · ${formatPrice(t.price)}`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Step>

        <Step number={3} title="Día y hora" done={!!slot} disabled={!treatment}>
          {treatment && (
            <SlotPicker
              key={`${treatment.id}-${attempt}`}
              treatmentId={treatment.id}
              doctors={treatmentDoctors}
              timeZone={timeZone}
              today={today}
              initialDate={initialDate}
              selected={slot}
              onSelect={setSlot}
            />
          )}
        </Step>

        <Step number={4} title="Notas" disabled={!slot} optional>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={!slot}
            rows={2}
            maxLength={1000}
            placeholder="Motivo de la consulta, indicaciones para la recepción…"
            className="w-full resize-y rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm placeholder:text-muted/70 focus:border-brand-500 focus:ring-4 focus:ring-brand-50 focus:outline-none disabled:bg-canvas"
          />
        </Step>
      </div>
    </Modal>
  );
}

function Step({
  number,
  title,
  done,
  disabled,
  optional,
  children,
}: {
  number: number;
  title: string;
  done?: boolean;
  disabled?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    // `inert` bloquea clics y foco de teclado en los pasos que aún no tocan.
    <div className={cn("transition-opacity", disabled && "opacity-40")} inert={disabled}>
      <h3 className="mb-3 flex items-center gap-2.5 text-sm font-semibold">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full text-xs",
            done ? "bg-brand-500 text-white" : "bg-canvas text-muted",
          )}
        >
          {done ? "✓" : number}
        </span>
        {title}
        {optional && <span className="font-normal text-muted">(opcional)</span>}
      </h3>
      {children}
    </div>
  );
}
