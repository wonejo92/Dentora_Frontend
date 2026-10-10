"use client";

import Link from "next/link";
import { useState } from "react";
import { createTimeOff, type TimeOffState } from "@/app/actions/time-offs";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Modal } from "@/components/ui/modal";
import { useFormAction } from "@/components/ui/use-form-action";
import { cn } from "@/lib/cn";
import { formatTime, localDate } from "@/lib/time";
import type { DoctorOption } from "@/lib/types";

const REASONS = ["Feriado", "Vacaciones", "Congreso", "Capacitación", "Asunto personal", "Mantenimiento"];

export function TimeOffDialog({
  doctors,
  timeZone,
  triggerClassName,
  children,
}: {
  doctors: DoctorOption[];
  timeZone: string;
  triggerClassName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {children}
      </button>
      {open && <TimeOffForm doctors={doctors} timeZone={timeZone} onClose={() => setOpen(false)} />}
    </>
  );
}

function TimeOffForm({
  doctors,
  timeZone,
  onClose,
}: {
  doctors: DoctorOption[];
  timeZone: string;
  onClose: () => void;
}) {
  const today = localDate(new Date(), timeZone);
  const [mode, setMode] = useState<"days" | "hours">("days");
  const [reason, setReason] = useState("");
  const { state, pending, onSubmit } = useFormAction<TimeOffState>(async (prev, formData) => {
    const result = await createTimeOff(prev, formData);
    if (result.ok && !result.conflicts?.length) onClose();
    return result;
  }, {});

  // Se creó, pero hay citas dentro del bloqueo: se muestran para reprogramarlas.
  if (state.ok && state.conflicts?.length) {
    return (
      <Modal
        open
        onClose={onClose}
        title="Bloqueo creado"
        description="Ya no se podrán agendar citas en esas fechas, pero estas ya estaban agendadas:"
        footer={<Button onClick={onClose}>Entendido</Button>}
      >
        <ul className="divide-y divide-line rounded-2xl border border-amber-200 bg-amber-50/50">
          {state.conflicts.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {a.patient.firstName} {a.patient.lastName}
                </p>
                <p className="text-xs text-muted">
                  {new Intl.DateTimeFormat("es-EC", { timeZone, weekday: "short", day: "numeric", month: "short" }).format(
                    new Date(a.startsAt),
                  )}{" "}
                  · {formatTime(a.startsAt, timeZone)} · {a.treatment.name} · {a.doctor.fullName}
                </p>
              </div>
              <Link
                href={`/panel/agenda?fecha=${localDate(new Date(a.startsAt), timeZone)}`}
                onClick={onClose}
                className="shrink-0 text-xs font-semibold text-brand-600 hover:underline"
              >
                Reprogramar
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          Avísale a cada paciente y muévelas desde la agenda con el menú «···» → Reprogramar.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Nuevo bloqueo"
      description="Durante el bloqueo no se ofrecen horarios, ni en el panel ni en la web."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError message={state.error} />

        <Select label="¿A quién aplica?" name="doctorId" defaultValue="">
          <option value="">Toda la clínica (feriado, cierre)</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              Solo {d.fullName}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-1 rounded-full bg-canvas p-1" role="radiogroup" aria-label="Duración">
          {(
            [
              ["days", "Días completos"],
              ["hours", "Solo unas horas"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                "rounded-full py-2 text-sm font-medium transition-colors",
                mode === value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <input type="hidden" name="mode" value={mode} />

        {mode === "days" ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Desde" name="from" type="date" min={today} defaultValue={today} required />
            <Field label="Hasta (incluido)" name="to" type="date" min={today} defaultValue={today} required />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Día" name="from" type="date" min={today} defaultValue={today} required />
            <Field label="Desde" name="startTime" type="time" step={900} defaultValue="14:00" required />
            <Field label="Hasta" name="endTime" type="time" step={900} defaultValue="18:00" required />
          </div>
        )}

        <div>
          <Field
            label="Motivo"
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            placeholder="Feriado de Navidad"
            hint="Opcional. Solo lo ve el personal de la clínica."
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  reason === r ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line hover:border-brand-200",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Crear bloqueo"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
