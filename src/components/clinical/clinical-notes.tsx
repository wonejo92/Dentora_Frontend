"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addAddendum, saveClinicalNote, type NoteInput } from "@/app/actions/clinical";
import { ClipboardIcon, LockIcon, PencilIcon } from "@/components/panel/icons";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Modal } from "@/components/ui/modal";
import { searchCie10 } from "@/lib/clinical";
import { cn } from "@/lib/cn";
import type { ClinicalNote, Diagnosis } from "@/lib/types";

/** Cita a la que se puede asociar una evolución. */
export type ChartableAppointment = {
  id: string;
  startsAt: string;
  label: string;
  completed: boolean;
};

type Props = {
  patientId: string;
  notes: ClinicalNote[];
  appointments: ChartableAppointment[];
  currentUserId: string;
  timeZone: string;
  /** Hora del servidor, para calcular el candado igual en servidor y cliente. */
  now: number;
  /** Cita con la que abre el formulario (al venir de "Registrar evolución"). */
  openAppointmentId?: string;
};

export function ClinicalNotes({
  patientId,
  notes,
  appointments,
  currentUserId,
  timeZone,
  now,
  openAppointmentId,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [dialog, setDialog] = useState<{
    note?: ClinicalNote;
    appointmentId?: string;
  } | null>(() =>
    openAppointmentId && appointments.some((a) => a.id === openAppointmentId)
      ? { appointmentId: openAppointmentId }
      : null,
  );

  const close = () => {
    setDialog(null);
    // Quita ?cita= para que no vuelva a abrirse al recargar.
    if (openAppointmentId) router.replace(`${pathname}?tab=historia`, { scroll: false });
  };

  const date = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-EC", { timeZone, ...opts }).format(new Date(iso));
  const pending = appointments.filter((a) => a.completed);

  return (
    <section className="rounded-3xl bg-surface p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Evoluciones</h2>
          <p className="text-xs text-muted">Se pueden editar durante 24 h; después solo admiten aclaraciones.</p>
        </div>
        <Button type="button" onClick={() => setDialog({})}>
          + Nueva evolución
        </Button>
      </div>

      {pending.length > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            {pending.length === 1 ? "1 cita atendida sin evolución" : `${pending.length} citas atendidas sin evolución`}
          </p>
          <ul className="mt-2 space-y-1.5">
            {pending.slice(0, 3).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 text-sm text-amber-900">
                <span className="min-w-0 truncate">
                  <span className="first-letter:uppercase">{date(a.startsAt, { day: "numeric", month: "short" })}</span>{" "}
                  · {a.label}
                </span>
                <button
                  type="button"
                  onClick={() => setDialog({ appointmentId: a.id })}
                  className="shrink-0 font-semibold text-amber-900 underline-offset-2 hover:underline"
                >
                  Registrar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <ClipboardIcon />
          </span>
          <p className="mt-3 font-semibold">Aún no hay evoluciones</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Registra el motivo, el diagnóstico y lo que se hizo en cada consulta.
          </p>
        </div>
      ) : (
        <ol className="relative space-y-5 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px before:bg-line">
          {notes.map((note, i) => (
            <NoteCard
              defaultOpen={i === 0}
              key={note.id}
              note={note}
              patientId={patientId}
              canEdit={note.authorId === currentUserId && Date.parse(note.editableUntil) > now}
              now={now}
              date={date}
              onEdit={() => setDialog({ note })}
            />
          ))}
        </ol>
      )}

      {dialog && (
        <NoteDialog
          patientId={patientId}
          note={dialog.note}
          appointments={appointments}
          initialAppointmentId={dialog.appointmentId}
          date={date}
          onClose={close}
        />
      )}
    </section>
  );
}

type DateFn = (iso: string, opts: Intl.DateTimeFormatOptions) => string;

function NoteCard({
  note: n,
  patientId,
  canEdit,
  now,
  date,
  onEdit,
  defaultOpen,
}: {
  note: ClinicalNote;
  patientId: string;
  defaultOpen: boolean;
  canEdit: boolean;
  now: number;
  date: DateFn;
  onEdit: () => void;
}) {
  const remaining = Date.parse(n.editableUntil) - now;
  const locked = remaining <= 0;
  const hours = Math.floor(remaining / 3_600_000);
  // Acordeón: la más reciente abierta; las demás muestran solo un resumen.
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = `note-${n.id}`;

  return (
    <li className="relative pl-7">
      <span
        className="absolute top-1.5 left-0 size-[11px] rounded-full border-2 border-surface bg-brand-500 ring-1 ring-brand-200"
        aria-hidden
      />
      <article className="rounded-2xl border border-line p-5">
        <header className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={bodyId}
            className="group flex min-w-0 flex-1 items-start gap-2 text-left"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className={cn(
                "mt-0.5 shrink-0 text-muted transition-transform group-hover:text-ink",
                open && "rotate-90",
              )}
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
            <span className="min-w-0">
              <span className="block font-semibold first-letter:uppercase group-hover:text-brand-600">
                {date(n.createdAt, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="block text-xs text-muted">
                {n.author.fullName}
                {n.appointment && ` · ${n.appointment.treatment.name}`} ·{" "}
                {date(n.createdAt, {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </span>
              {!open && <NoteSummary note={n} />}
            </span>
          </button>
          <div className="flex shrink-0 items-center gap-2">
            {locked ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-muted [&_svg]:size-3.5">
                <LockIcon /> Bloqueada
              </span>
            ) : (
              canEdit && (
                <>
                  <span className="text-xs text-muted">
                    Editable {hours >= 1 ? `${hours} h` : `${Math.max(1, Math.ceil(remaining / 60_000))} min`} más
                  </span>
                  <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-medium hover:border-brand-200 hover:text-brand-600 [&_svg]:size-3.5"
                  >
                    <PencilIcon /> Editar
                  </button>
                </>
              )
            )}
          </div>
        </header>

        {open && (
          <div id={bodyId} className="pl-[26px]">
            <dl className="mt-4 space-y-3 text-sm">
              <Block label="Motivo de consulta" value={n.reason} />
              <Block label="Examen y hallazgos" value={n.findings} />
              {n.diagnoses.length > 0 && (
                <div>
                  <dt className="text-xs text-muted">Diagnóstico</dt>
                  <dd className="mt-1 space-y-1.5">
                    {n.diagnoses.map((d, i) => (
                      <p key={i}>
                        {d.code && (
                          <span className="mr-2 rounded-md bg-brand-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-brand-700">
                            {d.code}
                          </span>
                        )}
                        {d.label}
                        {d.comment && <span className="text-muted"> — {d.comment}</span>}
                      </p>
                    ))}
                  </dd>
                </div>
              )}
              <Block label="Procedimiento realizado" value={n.procedure} />
              <Block label="Indicaciones" value={n.indications} />
              <Block label="Receta" value={n.prescription} />
              {n.vitals && (
                <div>
                  <dt className="text-xs text-muted">Signos vitales</dt>
                  <dd className="tabular-nums">
                    {[
                      n.vitals.bloodPressure && `PA ${n.vitals.bloodPressure} mmHg`,
                      n.vitals.pulse && `${n.vitals.pulse} lpm`,
                      n.vitals.temperature && `${n.vitals.temperature} °C`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </dd>
                </div>
              )}
            </dl>

            {n.addenda.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-line pt-4">
                {n.addenda.map((a) => (
                  <li key={a.id} className="rounded-xl bg-canvas px-3.5 py-2.5 text-sm">
                    <p className="text-xs text-muted">
                      Aclaración · {a.author.fullName} ·{" "}
                      {date(a.createdAt, {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </p>
                    <p className="mt-0.5 whitespace-pre-line">{a.text}</p>
                  </li>
                ))}
              </ul>
            )}

            {locked && <AddendumForm patientId={patientId} noteId={n.id} />}
          </div>
        )}
      </article>
    </li>
  );
}

/** Una línea con lo esencial de una evolución cerrada: diagnósticos y motivo. */
function NoteSummary({ note: n }: { note: ClinicalNote }) {
  const text = n.reason ?? n.procedure ?? n.findings;
  return (
    <span className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5 text-sm">
      {n.diagnoses.map((d, i) => (
        <span
          key={i}
          title={d.label}
          className="rounded-md bg-brand-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-brand-700"
        >
          {d.code || d.label}
        </span>
      ))}
      {text && <span className="min-w-0 flex-1 basis-40 truncate text-muted">{text}</span>}
      {n.addenda.length > 0 && (
        <span className="shrink-0 text-xs text-muted">
          · {n.addenda.length === 1 ? "1 aclaración" : `${n.addenda.length} aclaraciones`}
        </span>
      )}
    </span>
  );
}

function Block({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="whitespace-pre-line">{value}</dd>
    </div>
  );
}

function AddendumForm({ patientId, noteId }: { patientId: string; noteId: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 text-sm font-semibold text-brand-500 hover:text-brand-600"
      >
        + Agregar aclaración
      </button>
    );
  }

  const save = () =>
    startTransition(async () => {
      const result = await addAddendum(patientId, noteId, text);
      if (!result.ok) return setError(result.error);
      setText("");
      setOpen(false);
    });

  return (
    <div className="mt-4 space-y-2">
      <FormError message={error} />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        maxLength={2000}
        autoFocus
        placeholder="La aclaración queda registrada con tu nombre y la fecha"
        aria-label="Aclaración"
        className={cn(controlClass(), "w-full resize-y py-2.5")}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Button type="button" onClick={save} disabled={pending || !text.trim()}>
          {pending ? "Guardando…" : "Guardar aclaración"}
        </Button>
      </div>
    </div>
  );
}

const EMPTY: NoteInput = {
  reason: "",
  findings: "",
  diagnoses: [],
  procedure: "",
  indications: "",
  prescription: "",
  vitals: {},
};

function NoteDialog({
  patientId,
  note,
  appointments,
  initialAppointmentId,
  date,
  onClose,
}: {
  patientId: string;
  note?: ClinicalNote;
  appointments: ChartableAppointment[];
  initialAppointmentId?: string;
  date: DateFn;
  onClose: () => void;
}) {
  const [form, setForm] = useState<NoteInput>(() =>
    note
      ? {
          reason: note.reason ?? "",
          findings: note.findings ?? "",
          diagnoses: note.diagnoses,
          procedure: note.procedure ?? "",
          indications: note.indications ?? "",
          prescription: note.prescription ?? "",
          vitals: note.vitals ?? {},
        }
      : {
          ...EMPTY,
          appointmentId: initialAppointmentId ?? appointments.find((a) => a.completed)?.id,
        },
  );
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof NoteInput>(key: K, value: NoteInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const hasVitals = Object.values(form.vitals).some((v) => v !== undefined && v !== "");

  const save = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await saveClinicalNote(patientId, note?.id ?? null, form);
      if (result.ok) onClose();
      else setError(result.error);
    });
  };

  const text = (
    key: "reason" | "findings" | "procedure" | "indications" | "prescription",
    label: string,
    rows = 2,
    placeholder?: string,
  ) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`note-${key}`} className="text-sm font-medium">
        {label}
      </label>
      <textarea
        id={`note-${key}`}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        rows={rows}
        maxLength={key === "reason" ? 2000 : 4000}
        placeholder={placeholder}
        className={cn(controlClass(), "resize-y py-2.5")}
      />
    </div>
  );

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={note ? "Editar evolución" : "Nueva evolución"}
      description={
        note
          ? `Registrada el ${date(note.createdAt, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hour12: false })}`
          : undefined
      }
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={save} disabled={pending}>
            {pending ? "Guardando…" : "Guardar evolución"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <FormError message={error} />

        {!note && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="note-appointment" className="text-sm font-medium">
              Cita
            </label>
            <select
              id="note-appointment"
              value={form.appointmentId ?? ""}
              onChange={(e) => set("appointmentId", e.target.value || undefined)}
              className={cn(controlClass(), "h-11")}
            >
              <option value="">Sin cita asociada</option>
              {appointments.map((a) => (
                <option key={a.id} value={a.id}>
                  {date(a.startsAt, {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}{" "}
                  · {a.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {text("reason", "Motivo de consulta", 2, "Lo que refiere el paciente")}
        {text("findings", "Examen y hallazgos", 3)}
        <DiagnosisPicker value={form.diagnoses} onChange={(d) => set("diagnoses", d)} />
        {text("procedure", "Procedimiento realizado", 3, "Ej. Resina en pieza 36, cara oclusal")}
        {text("indications", "Indicaciones", 2)}
        {text("prescription", "Receta", 2, "Medicamento, dosis y duración")}

        <details open={hasVitals} className="group rounded-2xl border border-line">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
            Signos vitales <span className="text-xs font-normal text-muted">Opcional</span>
          </summary>
          <div className="grid gap-3 border-t border-line px-4 py-4 sm:grid-cols-3">
            <VitalInput
              label="Presión (mmHg)"
              placeholder="120/80"
              value={form.vitals.bloodPressure ?? ""}
              onChange={(v) => set("vitals", { ...form.vitals, bloodPressure: v || undefined })}
            />
            <VitalInput
              label="Pulso (lpm)"
              placeholder="72"
              inputMode="numeric"
              value={form.vitals.pulse?.toString() ?? ""}
              onChange={(v) =>
                set("vitals", {
                  ...form.vitals,
                  pulse: v ? Number(v) : undefined,
                })
              }
            />
            <VitalInput
              label="Temperatura (°C)"
              placeholder="36.5"
              inputMode="decimal"
              value={form.vitals.temperature?.toString() ?? ""}
              onChange={(v) =>
                set("vitals", {
                  ...form.vitals,
                  temperature: v ? Number(v.replace(",", ".")) : undefined,
                })
              }
            />
          </div>
        </details>
      </div>
    </Modal>
  );
}

function VitalInput({
  label,
  value,
  onChange,
  ...props
}: { label: string; value: string; onChange: (value: string) => void } & Pick<
  React.ComponentProps<"input">,
  "placeholder" | "inputMode"
>) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-muted">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(props.inputMode ? /[^\d.,]/g : /[^\d/]/g, ""))}
        maxLength={7}
        className={cn(controlClass(), "h-10 tabular-nums")}
        {...props}
      />
    </label>
  );
}

/** Buscador CIE-10: cada diagnóstico elegido admite un comentario libre. */
function DiagnosisPicker({ value, onChange }: { value: Diagnosis[]; onChange: (value: Diagnosis[]) => void }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const results = searchCie10(query)
    .filter((d) => !value.some((v) => v.code === d.code))
    .slice(0, 8);

  const add = (d: Diagnosis) => {
    onChange([...value, d]);
    setQuery("");
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="note-diagnosis" className="text-sm font-medium">
        Diagnóstico <span className="font-normal text-muted">(CIE-10)</span>
      </label>

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((d, i) => (
            <li key={`${d.code}-${i}`} className="rounded-xl border border-line px-3.5 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm">
                  {d.code && (
                    <span className="mr-2 rounded-md bg-brand-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-brand-700">
                      {d.code}
                    </span>
                  )}
                  {d.label}
                </p>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                  aria-label={`Quitar ${d.label}`}
                  className="shrink-0 rounded-full p-1 text-muted hover:bg-red-50 hover:text-red-600"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <input
                value={d.comment ?? ""}
                onChange={(e) => onChange(value.map((v, j) => (j === i ? { ...v, comment: e.target.value } : v)))}
                maxLength={500}
                placeholder="Comentario (pieza, cara, observación…)"
                aria-label={`Comentario de ${d.label}`}
                className={cn(controlClass(), "mt-2 h-9 w-full text-sm")}
              />
            </li>
          ))}
        </ul>
      )}

      {value.length < 10 && (
        <div className="relative">
          <input
            id="note-diagnosis"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (results[0]) add(results[0]);
              }
            }}
            maxLength={200}
            placeholder="Buscar por código o nombre: K02, caries, gingivitis…"
            autoComplete="off"
            className={cn(controlClass(), "h-11 w-full")}
          />
          {focused && (results.length > 0 || query.trim().length > 2) && (
            <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-line bg-surface py-1 shadow-xl shadow-black/10">
              {results.map((d) => (
                <li key={d.code}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => add(d)}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-canvas"
                  >
                    <span className="w-12 shrink-0 font-mono text-xs font-semibold text-brand-600">{d.code}</span>
                    {d.label}
                  </button>
                </li>
              ))}
              {query.trim().length > 2 && (
                <li className={cn(results.length > 0 && "border-t border-line")}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => add({ code: "", label: query.trim() })}
                    className="w-full px-4 py-2 text-left text-sm text-muted hover:bg-canvas"
                  >
                    Usar «{query.trim()}» sin código
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
