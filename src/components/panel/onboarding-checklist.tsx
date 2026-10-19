import Link from "next/link";
import type { OnboardingStatus } from "@/lib/types";
import { cn } from "@/lib/cn";
import { CopyBookingLink, DismissOnboarding, StartTourButton } from "./onboarding-actions";

type StepKey = keyof OnboardingStatus["steps"];

const STEPS: { key: StepKey; title: string; text: string; href?: string; cta?: string }[] = [
  {
    key: "profile",
    title: "Completa los datos de tu clínica",
    text: "Dirección y teléfono o WhatsApp, para que los pacientes te encuentren.",
    href: "/panel/ajustes",
    cta: "Ir a Ajustes",
  },
  {
    key: "treatments",
    title: "Agrega tus tratamientos",
    text: "Con su duración y precio. Son los que eligen los pacientes al reservar.",
    href: "/panel/tratamientos",
    cta: "Agregar tratamientos",
  },
  {
    key: "doctors",
    title: "Agrega a tus doctores",
    text: "Y elige qué tratamientos hace cada uno.",
    href: "/panel/doctores",
    cta: "Agregar doctores",
  },
  {
    key: "schedules",
    title: "Configura los horarios de atención",
    text: "Los días y horas en que atiende cada doctor. Sin horario no se ofrecen citas.",
    href: "/panel/doctores",
    cta: "Configurar horarios",
  },
  {
    key: "shareLink",
    title: "Comparte tu página de reservas",
    text: "Envíala por WhatsApp o ponla en tu Instagram para que tus pacientes reserven solos.",
  },
  {
    key: "firstAppointment",
    title: "Agenda tu primera cita",
    text: "Con el botón + de arriba o desde la agenda.",
    href: "/panel/agenda",
    cta: "Ir a la agenda",
  },
];

/**
 * Lista de primeros pasos para una clínica nueva, en el Resumen. Cada paso se
 * marca solo cuando está hecho; al completarlos todos (o al ocultarla) desaparece.
 */
export function OnboardingChecklist({ status, bookingUrl }: { status: OnboardingStatus; bookingUrl: string }) {
  const done = STEPS.filter((s) => status.steps[s.key]).length;
  if (status.dismissed || done === STEPS.length) return null;
  // El siguiente paso pendiente va destacado.
  const next = STEPS.find((s) => !status.steps[s.key])?.key;

  return (
    <section data-tour="onboarding" className="rounded-3xl bg-surface p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Prepara tu clínica para recibir reservas</h2>
          <p className="text-sm text-muted">
            {done} de {STEPS.length} pasos listos
          </p>
        </div>
        <div className="flex items-center gap-1">
          <StartTourButton />
          <DismissOnboarding />
        </div>
      </div>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-canvas"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={STEPS.length}
        aria-valuenow={done}
        aria-label="Progreso de los primeros pasos"
      >
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${(done / STEPS.length) * 100}%` }}
        />
      </div>

      <ol className="mt-5 grid items-start gap-2 md:grid-cols-2">
        {STEPS.map((step, i) => {
          const isDone = status.steps[step.key];
          const isNext = step.key === next;
          return (
            <li
              key={step.key}
              className={cn("flex gap-3 rounded-2xl p-4", isNext ? "bg-brand-50 ring-1 ring-brand-200" : "bg-canvas")}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  isDone ? "bg-brand-500 text-white" : "bg-surface text-muted ring-1 ring-line",
                )}
              >
                {isDone ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-semibold", isDone && "text-muted line-through")}>
                  {step.title}
                  <span className="sr-only">{isDone ? " (hecho)" : " (pendiente)"}</span>
                </p>
                {!isDone && <p className="mt-0.5 text-xs text-muted">{step.text}</p>}
                {!isDone && step.key === "shareLink" && <CopyBookingLink url={bookingUrl} />}
                {!isDone && step.href && (
                  <Link
                    href={step.href}
                    className={cn(
                      "mt-2 inline-flex h-8 items-center rounded-full px-3.5 text-xs font-semibold transition-colors",
                      isNext ? "bg-brand-500 text-white hover:bg-brand-600" : "bg-surface text-ink hover:bg-line",
                    )}
                  >
                    {step.cta}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
