"use client";

import { useEffect, useRef, useState } from "react";
import { getAvailability } from "@/app/actions/appointments";
import { cn } from "@/lib/cn";
import { addDays, formatTime } from "@/lib/time";
import type { DoctorOption, DoctorSlots } from "@/lib/types";

export type SlotSelection = { doctorId: string; startsAt: string };

const DAYS_SHOWN = 14;
/** Hasta cuántos días adelante busca el botón "próximo día con horarios". */
const SEARCH_DAYS = 60;

const dayLabel = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-EC", { timeZone: "UTC", ...opts })
    .format(new Date(`${date}T12:00:00Z`))
    .replace(".", "");

const PERIODS = [
  { label: "Mañana", test: (h: number) => h < 12 },
  { label: "Tarde", test: (h: number) => h >= 12 && h < 18 },
  { label: "Noche", test: (h: number) => h >= 18 },
];

/**
 * Elige día, doctor y hora libre para un tratamiento.
 * Los horarios vienen del backend, así que solo se ofrece lo que realmente está libre.
 */
export function SlotPicker({
  treatmentId,
  doctors,
  timeZone,
  today,
  initialDate,
  initialDoctorId = "",
  selected,
  onSelect,
}: {
  treatmentId: string;
  /** Doctores que realizan el tratamiento. */
  doctors: DoctorOption[];
  timeZone: string;
  today: string;
  initialDate?: string;
  initialDoctorId?: string;
  selected: SlotSelection | null;
  onSelect: (slot: SlotSelection | null) => void;
}) {
  const [date, setDate] = useState(initialDate && initialDate >= today ? initialDate : today);
  const [doctorId, setDoctorId] = useState(initialDoctorId);
  const key = `${treatmentId}|${date}|${doctorId}`;
  const [result, setResult] = useState<{ key: string; data: DoctorSlots[] } | null>(null);
  const [searching, setSearching] = useState<"idle" | "busy" | "none">("idle");
  const loading = result?.key !== key;
  const stripRef = useRef<HTMLDivElement>(null);

  // Mantiene visible en la tira el día elegido (p. ej. tras "buscar el próximo día").
  useEffect(() => {
    stripRef.current
      ?.querySelector('[aria-pressed="true"]')
      ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [date]);

  useEffect(() => {
    let active = true;
    getAvailability(treatmentId, date, doctorId || undefined).then((data) => {
      if (active) setResult({ key, data });
    });
    return () => {
      active = false;
    };
  }, [key, treatmentId, date, doctorId]);

  const changeDate = (next: string) => {
    setDate(next);
    setSearching("idle");
    onSelect(null);
  };

  /** Recorre los días siguientes hasta encontrar uno con horarios libres. */
  const findNextAvailable = async () => {
    setSearching("busy");
    for (let i = 1; i <= SEARCH_DAYS; i++) {
      const candidate = addDays(date, i);
      const data = await getAvailability(treatmentId, candidate, doctorId || undefined);
      if (data.some((g) => g.slots.length > 0)) {
        setResult({ key: `${treatmentId}|${candidate}|${doctorId}`, data });
        changeDate(candidate);
        return;
      }
    }
    setSearching("none");
  };
  const changeDoctor = (next: string) => {
    setDoctorId(next);
    setSearching("idle");
    onSelect(null);
  };

  const strip = Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(today, i));
  const groups = (result?.data ?? []).filter((g) => g.slots.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium first-letter:uppercase">
          {dayLabel(date, { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <div className="flex items-center gap-2">
          {doctors.length > 1 && (
            <select
              aria-label="Doctor"
              value={doctorId}
              onChange={(e) => changeDoctor(e.target.value)}
              className="h-9 rounded-full border border-line bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">Cualquier doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName}
                </option>
              ))}
            </select>
          )}
          <input
            type="date"
            aria-label="Elegir otra fecha"
            min={today}
            value={date}
            onChange={(e) => e.target.value && changeDate(e.target.value)}
            className="h-9 rounded-full border border-line bg-white px-3 text-sm tabular-nums focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      <div
        ref={stripRef}
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {strip.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => changeDate(d)}
            aria-pressed={d === date}
            className={cn(
              "flex w-14 shrink-0 flex-col items-center rounded-2xl border py-2 transition-colors",
              d === date
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-line bg-white hover:border-brand-200 hover:bg-brand-50",
            )}
          >
            <span className={cn("text-[11px] capitalize", d === date ? "text-brand-100" : "text-muted")}>
              {d === today ? "Hoy" : dayLabel(d, { weekday: "short" })}
            </span>
            <span className="text-lg font-bold tabular-nums">{dayLabel(d, { day: "numeric" })}</span>
          </button>
        ))}
      </div>

      <div className="min-h-32" aria-live="polite" aria-busy={loading}>
        {loading ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} className="h-10 animate-pulse rounded-xl bg-canvas" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center">
            <p className="text-sm font-medium">No hay horarios libres este día</p>
            <p className="mx-auto mt-0.5 max-w-sm text-xs text-muted">
              {date === today
                ? "Puede que ya haya pasado la hora de atención de hoy, que la agenda esté llena o que el doctor no atienda hoy."
                : "La agenda está llena, el doctor no atiende ese día o hay un feriado."}
            </p>
            {searching === "none" ? (
              <p className="mt-3 text-xs font-medium text-amber-700">
                No encontramos horarios en los próximos {SEARCH_DAYS} días. Revisa el horario de los doctores.
              </p>
            ) : (
              <button
                type="button"
                onClick={findNextAvailable}
                disabled={searching === "busy"}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
              >
                {searching === "busy" && (
                  <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {searching === "busy" ? "Buscando…" : "Buscar el próximo día con horarios"}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.doctor.id}>
                {(groups.length > 1 || !doctorId) && (
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: doctors.find((d) => d.id === group.doctor.id)?.color }}
                    />
                    {group.doctor.fullName}
                  </p>
                )}
                {PERIODS.map(({ label, test }) => {
                  const slots = group.slots.filter((s) => test(Number(formatTime(s.startsAt, timeZone).slice(0, 2))));
                  if (!slots.length) return null;
                  return (
                    <div key={label} className="mb-3">
                      <p className="mb-1.5 text-xs text-muted">{label}</p>
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                        {slots.map((s) => {
                          const isSelected = selected?.startsAt === s.startsAt && selected.doctorId === group.doctor.id;
                          // Opciones del mismo doctor que se cruzan con la elegida: solo se puede agendar una.
                          const chosen = selected?.doctorId === group.doctor.id
                            ? group.slots.find((x) => x.startsAt === selected.startsAt)
                            : undefined;
                          const overlaps =
                            !isSelected && !!chosen && s.startsAt < chosen.endsAt && chosen.startsAt < s.endsAt;
                          return (
                            <button
                              key={s.startsAt}
                              type="button"
                              onClick={() => onSelect({ doctorId: group.doctor.id, startsAt: s.startsAt })}
                              aria-pressed={isSelected}
                              title={
                                overlaps
                                  ? "Se cruza con la hora elegida: solo puedes agendar una"
                                  : `${formatTime(s.startsAt, timeZone)} a ${formatTime(s.endsAt, timeZone)}`
                              }
                              className={cn(
                                "h-10 rounded-xl border text-sm font-semibold tabular-nums transition-colors",
                                isSelected
                                  ? "col-span-2 border-brand-500 bg-brand-500 text-white"
                                  : overlaps
                                    ? "border-dashed border-line bg-canvas/60 text-muted/60 hover:border-brand-200"
                                    : "border-line bg-white hover:border-brand-500 hover:text-brand-600",
                              )}
                            >
                              {formatTime(s.startsAt, timeZone)}
                              {isSelected && ` – ${formatTime(s.endsAt, timeZone)}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
