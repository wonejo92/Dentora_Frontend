"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateClinicAdmin } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Modal } from "@/components/ui/modal";
import { plans, type PlanKey } from "@/lib/admin";
import { cn } from "@/lib/cn";
import type { AdminClinicDetail } from "@/lib/types";

const DAY = 864e5;

/** Opción "Prueba gratis" de la lista, junto a los planes. */
const TRIAL = "TRIAL";
type Choice = PlanKey | typeof TRIAL;

const dayMonth = (ms: number) =>
  new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "long", timeZone: "America/Guayaquil" }).format(ms);

/**
 * Acciones del super-admin sobre una clínica: pasarla a prueba o activarla con
 * un plan, extender la prueba, cambiar de plan, suspender y reactivar.
 */
export function ClinicActions({ clinic: c, now }: { clinic: AdminClinicDetail; now: number }) {
  const inTrial = c.status === "TRIAL";
  const [choice, setChoice] = useState<Choice>(inTrial ? TRIAL : c.plan);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const run = (body: Parameters<typeof updateClinicAdmin>[1], message: string) =>
    startTransition(async () => {
      setError(undefined);
      const result = await updateClinicAdmin(c.id, body);
      if (!result.ok) return setError(result.error);
      toast.success(message);
      setConfirmSuspend(false);
    });

  /** La prueba se extiende desde hoy o desde su fin, lo que sea más tarde. */
  const extendTrial = (days: number) => {
    const base = Math.max(now, c.trialEndsAt ? Date.parse(c.trialEndsAt) : 0);
    run({ status: "TRIAL", trialEndsAt: new Date(base + days * DAY).toISOString() }, `Prueba extendida ${days} días`);
  };

  /** Volver a prueba: conserva la fecha de fin si aún no pasa; si ya pasó, 7 días desde hoy. */
  const trialEnd = c.trialEndsAt && Date.parse(c.trialEndsAt) > now ? Date.parse(c.trialEndsAt) : now + 7 * DAY;

  /** El botón junto a la lista según lo elegido y el estado actual. */
  const apply =
    choice === TRIAL
      ? {
          label: "Pasar a prueba",
          disabled: inTrial,
          action: () =>
            run(
              { status: "TRIAL", trialEndsAt: new Date(trialEnd).toISOString() },
              `Clínica en prueba gratis hasta el ${dayMonth(trialEnd)}`,
            ),
        }
      : c.status === "ACTIVE"
        ? {
            label: "Cambiar plan",
            disabled: choice === c.plan,
            action: () => run({ plan: choice }, `Plan cambiado a ${plans[choice].label}`),
          }
        : {
            label: "Activar con este plan",
            disabled: false,
            action: () =>
              run({ status: "ACTIVE", plan: choice }, `Clínica activada con el plan ${plans[choice].label}`),
          };

  // Al reactivar: si su prueba aún no vence vuelve a prueba; si no, queda activa.
  const reactivateAs = c.trialEndsAt && Date.parse(c.trialEndsAt) > now ? "TRIAL" : "ACTIVE";
  const suspended = c.status === "SUSPENDED";

  return (
    <section className="h-full space-y-5 rounded-[28px] bg-surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Acciones</h2>
      <FormError message={error} />

      <div className="space-y-2">
        <label htmlFor="plan" className="text-sm font-medium">
          Plan
        </label>
        <div className="flex flex-wrap gap-2">
          <select
            id="plan"
            value={choice}
            onChange={(e) => setChoice(e.target.value as Choice)}
            className={cn(controlClass(), "h-10 min-w-40")}
          >
            <option value={TRIAL}>Prueba gratis · todo incluido</option>
            {Object.entries(plans).map(([key, p]) => (
              <option key={key} value={key}>
                {p.label} · ${p.price}/mes
              </option>
            ))}
          </select>
          {!suspended && (
            <Button
              type="button"
              variant={apply.label === "Cambiar plan" ? "secondary" : "primary"}
              disabled={pending || apply.disabled}
              onClick={apply.action}
            >
              {apply.label}
            </Button>
          )}
        </div>
        {!suspended && (
          <p className="text-xs text-muted">
            {inTrial
              ? "Elige un plan y actívala cuando la clínica pague su primera mensualidad."
              : choice === TRIAL
                ? "En prueba vuelve a tener todos los módulos, sin los límites del plan."
                : "Actívala o cámbiale el plan cuando la clínica pague."}
          </p>
        )}
      </div>

      {inTrial && (
        <div className="space-y-2 border-t border-line pt-5">
          <p className="text-sm font-medium">Agregar días de prueba</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled={pending} onClick={() => extendTrial(7)}>
              +7 días
            </Button>
            <Button type="button" variant="secondary" disabled={pending} onClick={() => extendTrial(14)}>
              +14 días
            </Button>
          </div>
        </div>
      )}

      <div className="border-t border-line pt-5">
        {suspended ? (
          <Button
            type="button"
            disabled={pending}
            onClick={() =>
              run(
                { status: reactivateAs },
                reactivateAs === "TRIAL" ? "Clínica reactivada (sigue en prueba)" : "Clínica reactivada",
              )
            }
          >
            Reactivar clínica
          </Button>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmSuspend(true)}
            className="text-sm font-semibold text-red-600 hover:underline"
          >
            Suspender clínica
          </button>
        )}
      </div>

      {confirmSuspend && (
        <Modal
          open
          onClose={() => setConfirmSuspend(false)}
          title={`Suspender ${c.name}`}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setConfirmSuspend(false)}>
                Volver
              </Button>
              <Button
                type="button"
                disabled={pending}
                className="bg-red-600 hover:bg-red-700"
                onClick={() => run({ status: "SUSPENDED" }, "Clínica suspendida")}
              >
                {pending ? "Suspendiendo…" : "Suspender"}
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted">
            Todo su personal perderá el acceso al instante y su web de reservas dejará de funcionar. Los datos no se
            borran: puedes reactivarla cuando quieras.
          </p>
        </Modal>
      )}
    </section>
  );
}
