import type { Metadata } from "next";
import { TreatmentDialog } from "@/components/treatments/treatment-dialog";
import { buttonClass } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { guard, requireClinicUser } from "@/lib/dal";
import { formatDuration, formatPrice } from "@/lib/format";
import type { DoctorOption, Treatment } from "@/lib/types";

export const metadata: Metadata = { title: "Tratamientos" };

export default async function TreatmentsPage() {
  const me = await requireClinicUser();
  const canEdit = me.role === "OWNER";
  const [treatments, doctors] = await Promise.all([
    guard(api<Treatment[]>("/treatments")),
    canEdit ? guard(api<DoctorOption[]>("/doctors")) : Promise.resolve([]),
  ]);
  // Activos primero; dentro de cada grupo, el orden alfabético del backend.
  const sorted = [...treatments].sort((a, b) => Number(b.isActive) - Number(a.isActive));
  const activeCount = treatments.filter((t) => t.isActive).length;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tratamientos</h1>
          <p className="text-sm text-muted">
            {activeCount} {activeCount === 1 ? "activo" : "activos"}
            {treatments.length > activeCount && ` · ${treatments.length - activeCount} inactivos`}
          </p>
        </div>
        {canEdit && (
          <TreatmentDialog doctors={doctors} triggerClassName={buttonClass("primary")}>+ Nuevo tratamiento</TreatmentDialog>
        )}
      </div>

      <section className="overflow-hidden rounded-3xl bg-white">
        {treatments.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-semibold">Agrega tu primer tratamiento</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
              Limpiezas, extracciones, valoraciones… Con su duración, la agenda sabe cuánto
              espacio reservar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  <th className="px-6 py-3 font-medium">Tratamiento</th>
                  <th className="px-4 py-3 font-medium">Duración</th>
                  <th className="px-4 py-3 text-right font-medium">Precio</th>
                  <th className="px-4 py-3 font-medium">Doctores</th>
                  <th className="px-4 py-3 font-medium">Web</th>
                  {canEdit && <th className="w-px px-6 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sorted.map((t) => (
                  <tr key={t.id} className={cn(!t.isActive && "bg-canvas/50")}>
                    <td className="max-w-xs px-6 py-4">
                      <p className={cn("font-semibold", !t.isActive && "text-muted")}>
                        {t.name}
                        {!t.isActive && (
                          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            Inactivo
                          </span>
                        )}
                      </p>
                      {t.description && <p className="truncate text-xs text-muted">{t.description}</p>}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">{formatDuration(t.durationMin)}</td>
                    <td className="px-4 py-4 text-right tabular-nums">{formatPrice(t.price)}</td>
                    <td className="px-4 py-4">
                      {t.doctors.length === 0 ? (
                        <span className="text-xs text-amber-700">Sin doctor asignado</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {t.doctors.map((d) => (
                            <span key={d.id} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs whitespace-nowrap text-brand-700">
                              {d.fullName}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {t.isPublic ? (
                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                          Reservable
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          Solo panel
                        </span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 text-right">
                        <TreatmentDialog treatment={t} doctors={doctors} triggerClassName={buttonClass("ghost", "h-9 px-3")}>
                          Editar
                        </TreatmentDialog>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-muted">
        Un tratamiento sin doctor asignado no aparece en la agenda ni en la web. Asígnalo con
        Editar.
      </p>
    </div>
  );
}
