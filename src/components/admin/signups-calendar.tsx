import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/panel/icons";
import { cn } from "@/lib/cn";
import type { AdminClinic } from "@/lib/types";
import { ClinicAvatar } from "./clinic-avatar";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

/**
 * Mes con las altas de clínicas (días oscuros) y los vencimientos de prueba
 * (días celestes). Sobre cada día se ven las clínicas involucradas.
 */
export function SignupsCalendar({
  month,
  today,
  signups,
  expiries,
  prevHref,
  nextHref,
}: {
  /** "2026-10" */
  month: string;
  /** "2026-10-15", en la zona horaria de Ecuador. */
  today: string;
  /** Clínicas por día ("2026-10-15") en que se registraron. */
  signups: Map<string, AdminClinic[]>;
  /** Clínicas en prueba por día en que les vence. */
  expiries: Map<string, AdminClinic[]>;
  prevHref: string;
  nextHref: string;
}) {
  const [year, m] = month.split("-").map(Number);
  const offset = (new Date(Date.UTC(year, m - 1, 1)).getUTCDay() + 6) % 7;
  const total = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const label = new Intl.DateTimeFormat("es-EC", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, m - 1, 15)),
  );

  return (
    <>
      <div className="mt-5 flex items-center justify-between">
        <Link
          href={prevHref}
          scroll={false}
          aria-label="Mes anterior"
          className="flex size-10 items-center justify-center rounded-full border border-line hover:bg-canvas"
        >
          <ChevronLeftIcon />
        </Link>
        <p className="font-semibold first-letter:uppercase">{label}</p>
        <Link
          href={nextHref}
          scroll={false}
          aria-label="Mes siguiente"
          className="flex size-10 items-center justify-center rounded-full border border-line hover:bg-canvas"
        >
          <ChevronRightIcon />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-muted sm:gap-2">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <ol className="mt-2 grid grid-cols-7 gap-x-1.5 gap-y-3 sm:gap-x-2">
        {Array.from({ length: offset }, (_, i) => (
          <li key={`blank-${i}`} aria-hidden />
        ))}
        {Array.from({ length: total }, (_, i) => {
          const day = i + 1;
          const key = `${month}-${String(day).padStart(2, "0")}`;
          const joined = signups.get(key) ?? [];
          const ending = expiries.get(key) ?? [];
          const people = [...joined, ...ending];
          const detail = [
            joined.length && `Alta: ${joined.map((c) => c.name).join(", ")}`,
            ending.length && `Vence la prueba: ${ending.map((c) => c.name).join(", ")}`,
          ]
            .filter(Boolean)
            .join(". ");
          return (
            <li
              key={key}
              title={detail || undefined}
              className={cn(
                "relative flex h-12 items-end rounded-2xl p-2 text-xs font-semibold sm:h-14",
                joined.length
                  ? "bg-night-900 text-white"
                  : ending.length
                    ? "bg-brand-200 text-ink"
                    : "bg-canvas text-muted",
                key === today && "ring-2 ring-brand-500 ring-offset-2 ring-offset-surface",
              )}
            >
              {people.length > 0 && (
                <span className="absolute -top-2 left-1/2 flex -translate-x-1/2 -space-x-1.5">
                  {people.slice(0, 2).map((c) => (
                    <ClinicAvatar
                      key={c.id}
                      clinic={c}
                      className="size-5 rounded-full text-[8px] ring-2 ring-surface"
                    />
                  ))}
                  {people.length > 2 && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-surface text-[8px] font-bold text-ink ring-2 ring-surface">
                      +{people.length - 2}
                    </span>
                  )}
                </span>
              )}
              {day}
              {detail && <span className="sr-only">. {detail}</span>}
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-full bg-night-900" />
          Alta de clínica
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-full bg-brand-200" />
          Vence la prueba
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-full ring-2 ring-brand-500" />
          Hoy
        </span>
      </div>
    </>
  );
}
