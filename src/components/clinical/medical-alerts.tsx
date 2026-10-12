import { AlertTriangleIcon } from "@/components/panel/icons";
import { conditionLabel } from "@/lib/clinical";
import { cn } from "@/lib/cn";
import type { MedicalAlerts as Alerts } from "@/lib/types";

const hasAlerts = (a?: Alerts | null): a is Alerts => !!a && a.allergies.length + a.conditions.length > 0;

/** Resumen en texto: "Alergia: Penicilina · Diabetes". */
export function alertsText(a: Alerts) {
  return [a.allergies.length ? `Alergia: ${a.allergies.join(", ")}` : null, ...a.conditions.map(conditionLabel)]
    .filter(Boolean)
    .join(" · ");
}

/** Franja roja con alergias y condiciones; la ve todo el personal. */
export function MedicalAlertsBanner({ alerts, className }: { alerts?: Alerts | null; className?: string }) {
  if (!hasAlerts(alerts)) return null;
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800",
        className,
      )}
    >
      <span className="mt-px shrink-0 text-red-600">
        <AlertTriangleIcon />
      </span>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {alerts.allergies.length > 0 && (
          <p>
            <span className="font-semibold">Alérgico a:</span> {alerts.allergies.join(", ")}
          </p>
        )}
        {alerts.conditions.length > 0 && (
          <p className="flex flex-wrap gap-1.5">
            {alerts.conditions.map((c) => (
              <span key={c} className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium">
                {conditionLabel(c)}
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}

/** Ícono pequeño junto al nombre del paciente (agenda, resumen). */
export function MedicalAlertsBadge({ alerts }: { alerts?: Alerts | null }) {
  if (!hasAlerts(alerts)) return null;
  const text = alertsText(alerts);
  return (
    <span
      title={text}
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 align-middle text-[11px] font-semibold text-red-600 [&_svg]:size-3.5"
    >
      <AlertTriangleIcon />
      <span className="sr-only">Alertas médicas: </span>
      {alerts.allergies.length ? "Alergia" : "Alerta"}
      <span className="sr-only">. {text}</span>
    </span>
  );
}
