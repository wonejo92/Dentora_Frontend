"use client";

import { useState, useTransition } from "react";
import { updateClinicAdmin } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Modal } from "@/components/ui/modal";
import { plans, type PlanKey } from "@/lib/admin";
import { cn } from "@/lib/cn";
import type { AdminClinicDetail } from "@/lib/types";

const DAY = 864e5;

/**
 * Acciones del super-admin sobre una clínica: activar con un plan, extender la
 * prueba, cambiar de plan, suspender y reactivar.
 */
export function ClinicActions({ clinic: c, now }: { clinic: AdminClinicDetail; now: number }) {
  const [plan, setPlan] = useState<PlanKey>(c.plan);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<string>();
  const [pending, startTransition] = useTransition();

  const run = (body: Parameters<typeof updateClinicAdmin>[1], message: string) =>
    startTransition(async () => {
      setError(undefined);
      setDone(undefined);
      const result = await updateClinicAdmin(c.id, body);
      if (!result.ok) return setError(result.error);
      setDone(message);
      setConfirmSuspend(false);
    });

  /** La prueba se extiende desde hoy o desde su fin, lo que sea más tarde. */
  const extendTrial = (days: number) => {
    const base = Math.max(now, c.trialEndsAt ? Date.parse(c.trialEndsAt) : 0);
    run({ status: "TRIAL", trialEndsAt: new Date(base + days * DAY).toISOString() }, `Prueba extendida ${days} días`);
  };

  // Al reactivar: si su prueba aún no vence vuelve a prueba; si no, queda activa.
  const reactivateAs = c.trialEndsAt && Date.parse(c.trialEndsAt) > now ? "TRIAL" : "ACTIVE";
  const suspended = c.status === "SUSPENDED";

  return (
    <section className="h-full space-y-5 rounded-[28px] bg-surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Acciones</h2>
      <FormError message={error} />
      {done && (
        <p role="status" className="rounded-xl bg-green-100 px-4 py-2.5 text-sm font-medium text-green-800">
          {done}
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor="plan" className="text-sm font-medium">
          Plan
        </label>
        <div className="flex flex-wrap gap-2">
          <select
            id="plan"
            value={plan}
            onChange={(e) => setPlan(e.target.value as PlanKey)}
            className={cn(controlClass(), "h-10 min-w-40")}
          >
            {Object.entries(plans).map(([key, p]) => (
              <option key={key} value={key}>
                {p.label} · ${p.price}/mes
              </option>
            ))}
          </select>
          {c.status !== "ACTIVE" && !suspended ? (
            <Button
              type="button"
              disabled={pending}
              onClick={() => run({ status: "ACTIVE", plan }, `Clínica activada con el plan ${plans[plan].label}`)}
            >
              Activar con este plan
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              disabled={pending || plan === c.plan}
              onClick={() => run({ plan }, `Plan cambiado a ${plans[plan].label}`)}
            >
              Cambiar plan
            </Button>
          )}
        </div>
        {c.status !== "ACTIVE" && !suspended && (
          <p className="text-xs text-muted">Actívala cuando la clínica pague su primera mensualidad.</p>
        )}
      </div>

      {c.status !== "ACTIVE" && !suspended && (
        <div className="space-y-2 border-t border-line pt-5">
          <p className="text-sm font-medium">Prueba gratis</p>
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
