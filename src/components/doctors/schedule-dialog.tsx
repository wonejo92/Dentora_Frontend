"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveSchedule } from "@/app/actions/doctors";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { TIME_OPTIONS, WEEK, toTime } from "@/lib/schedule";
import type { Doctor, ScheduleBlock } from "@/lib/types";

type Block = { start: number; end: number };
type Week = Record<number, Block[]>;

const DEFAULT_BLOCK: Block = { start: 9 * 60, end: 13 * 60 };
/** Rango que dibuja la barra de tiempo: 06:00 a 22:00. */
const DAY_START = 6 * 60;
const DAY_END = 22 * 60;

const toWeek = (blocks: ScheduleBlock[]): Week =>
  Object.fromEntries(
    WEEK.map(({ day }) => [
      day,
      blocks
        .filter((b) => b.dayOfWeek === day)
        .sort((a, b) => a.startMinute - b.startMinute)
        .map((b) => ({ start: b.startMinute, end: b.endMinute })),
    ]),
  );

/** Devuelve el error del día, o null si sus bloques son válidos. */
function dayError(blocks: Block[]) {
  const sorted = [...blocks].sort((a, b) => a.start - b.start);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].start >= sorted[i].end) return "La hora de fin debe ser posterior a la de inicio";
    if (i > 0 && sorted[i].start < sorted[i - 1].end) return "Hay bloques que se cruzan";
  }
  return null;
}

const formatHours = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
};

export function ScheduleDialog({
  doctor,
  triggerClassName,
  children,
}: {
  doctor: Doctor;
  triggerClassName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {children}
      </button>
      {/* Se monta solo al abrir, así cada vez arranca con el horario guardado. */}
      {open && <ScheduleEditor doctor={doctor} onClose={() => setOpen(false)} />}
    </>
  );
}

function ScheduleEditor({ doctor, onClose }: { doctor: Doctor; onClose: () => void }) {
  const [week, setWeek] = useState<Week>(() => toWeek(doctor.schedules));
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const update = (day: number, blocks: Block[]) => setWeek((w) => ({ ...w, [day]: blocks }));

  const addBlock = (day: number) => {
    const last = week[day].at(-1);
    if (!last) return update(day, [DEFAULT_BLOCK]);
    // El nuevo bloque empieza 2 h después del último (la tarde, tras el almuerzo).
    const start = Math.min(last.end + 120, 21 * 60);
    update(day, [...week[day], { start, end: Math.min(start + 180, DAY_END) }]);
  };

  const copyMondayToWeekdays = () =>
    setWeek((w) => ({ ...w, 2: [...w[1]], 3: [...w[1]], 4: [...w[1]], 5: [...w[1]] }));

  const errors = Object.fromEntries(WEEK.map(({ day }) => [day, dayError(week[day])]));
  const hasErrors = Object.values(errors).some(Boolean);
  const totalMinutes = WEEK.reduce(
    (sum, { day }) => sum + week[day].reduce((s, b) => s + Math.max(0, b.end - b.start), 0),
    0,
  );
  const workingDays = WEEK.filter(({ day }) => week[day].length > 0).length;

  const save = () => {
    setError(undefined);
    const blocks = WEEK.flatMap(({ day }) =>
      week[day].map((b) => ({ dayOfWeek: day, startMinute: b.start, endMinute: b.end })),
    );
    startTransition(async () => {
      const result = await saveSchedule(doctor.id, blocks);
      if (!result.ok) return setError(result.error);
      onClose();
      toast.success("Horario guardado");
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`Horario de ${doctor.fullName}`}
      description="Los pacientes solo podrán reservar dentro de estos horarios."
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={save} disabled={pending || hasErrors}>
            {pending ? "Guardando…" : "Guardar horario"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert>{error}</Alert>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-6">
            <Stat label="Por semana" value={formatHours(totalMinutes)} />
            <Stat label="Días de atención" value={String(workingDays)} />
          </div>
          {week[1].length > 0 && (
            <button
              type="button"
              onClick={copyMondayToWeekdays}
              className="flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-sm font-medium text-brand-600 transition-colors hover:border-brand-200 hover:bg-brand-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="8" y="8" width="12" height="12" rx="2" />
                <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
              </svg>
              Copiar lunes a martes–viernes
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-line">
          <div className="hidden grid-cols-[150px_minmax(0,1fr)_150px] gap-4 border-b border-line bg-canvas px-4 py-2 text-xs text-muted md:grid">
            <span>Día</span>
            <span>Horario de atención</span>
            <span className="flex justify-between tabular-nums">
              <span>06</span>
              <span>14</span>
              <span>22</span>
            </span>
          </div>

          <ul className="divide-y divide-line">
            {WEEK.map(({ day, long }) => {
              const blocks = week[day];
              const works = blocks.length > 0;
              return (
                <li
                  key={day}
                  className={cn(
                    "grid grid-cols-[130px_minmax(0,1fr)] items-center gap-x-4 gap-y-2 px-4 py-3 md:grid-cols-[150px_minmax(0,1fr)_150px]",
                    !works && "bg-canvas/50",
                  )}
                >
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={works}
                      onChange={(e) => update(day, e.target.checked ? [DEFAULT_BLOCK] : [])}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden
                      className="relative h-5 w-9 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-brand-500 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-50 after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-4"
                    />
                    <span className={cn("text-sm font-semibold", !works && "font-medium text-muted")}>
                      {long}
                    </span>
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    {!works && <span className="text-sm text-muted">Cerrado</span>}
                    {blocks.map((block, i) => (
                      <TimePill
                        key={i}
                        day={long}
                        index={i}
                        block={block}
                        invalid={!!errors[day]}
                        onChange={(next) => update(day, blocks.map((b, j) => (j === i ? next : b)))}
                        onRemove={() => update(day, blocks.filter((_, j) => j !== i))}
                      />
                    ))}
                    {works && (
                      <button
                        type="button"
                        onClick={() => addBlock(day)}
                        aria-label={`Agregar bloque al ${long}`}
                        title="Agregar bloque"
                        className="flex size-8 items-center justify-center rounded-full border border-dashed border-brand-200 text-brand-500 transition-colors hover:border-brand-500 hover:bg-brand-50"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <Timeline blocks={blocks} />

                  {errors[day] && (
                    <p className="col-span-full text-xs text-red-600 md:col-start-2">{errors[day]}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

/** Bloque de horario compacto: "09:00 – 13:00 ×". */
function TimePill({
  day,
  index,
  block,
  invalid,
  onChange,
  onRemove,
}: {
  day: string;
  index: number;
  block: Block;
  invalid: boolean;
  onChange: (block: Block) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border py-0.5 pr-0.5 pl-1 transition-colors",
        invalid ? "border-red-300 bg-red-50" : "border-line bg-surface hover:border-brand-200",
      )}
    >
      <TimeSelect
        label={`${day}, bloque ${index + 1}, inicio`}
        value={block.start}
        onChange={(start) => onChange({ ...block, start })}
      />
      <span className="text-muted" aria-hidden>
        –
      </span>
      <TimeSelect
        label={`${day}, bloque ${index + 1}, fin`}
        value={block.end}
        onChange={(end) => onChange({ ...block, end })}
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar bloque ${index + 1} del ${day}`}
        className="ml-0.5 flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-red-100 hover:text-red-600"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function TimeSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (minutes: number) => void;
}) {
  const options = TIME_OPTIONS.includes(value)
    ? TIME_OPTIONS
    : [...TIME_OPTIONS, value].sort((a, b) => a - b);
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="cursor-pointer appearance-none rounded-full bg-transparent px-2.5 py-1.5 text-sm font-semibold tabular-nums transition-colors hover:bg-brand-50 focus:bg-brand-50 focus:outline-none"
    >
      {options.map((m) => (
        <option key={m} value={m}>
          {toTime(m)}
        </option>
      ))}
    </select>
  );
}

/** Barra de 06:00 a 22:00 con los bloques de atención pintados. */
function Timeline({ blocks }: { blocks: Block[] }) {
  const pct = (m: number) =>
    ((Math.min(Math.max(m, DAY_START), DAY_END) - DAY_START) / (DAY_END - DAY_START)) * 100;
  return (
    <div className="relative hidden h-2 rounded-full bg-canvas md:block" aria-hidden>
      {blocks
        .filter((b) => b.end > b.start)
        .map((b, i) => (
          <span
            key={i}
            className="absolute inset-y-0 rounded-full bg-brand-500"
            style={{ left: `${pct(b.start)}%`, width: `${pct(b.end) - pct(b.start)}%` }}
          />
        ))}
    </div>
  );
}
