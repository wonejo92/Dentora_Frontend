import type { Metadata } from "next";
import { ClearFilters, FilterSelect } from "@/components/list/filter-select";
import { Pagination } from "@/components/list/pagination";
import { SearchInput } from "@/components/list/search-input";
import { TreatmentDialog } from "@/components/treatments/treatment-dialog";
import { buttonClass } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { guard, requireClinicUser } from "@/lib/dal";
import { formatDuration, formatPrice } from "@/lib/format";
import { matches, pageParam, pageSizeParam, paginate, param } from "@/lib/list";
import type { DoctorOption, Treatment } from "@/lib/types";

export const metadata: Metadata = { title: "Tratamientos" };

const DEFAULT_SIZE = 10;

export default async function TreatmentsPage({ searchParams }: PageProps<"/panel/tratamientos">) {
  const me = await requireClinicUser();
  const canEdit = me.role === "OWNER";
  const params = await searchParams;
  const [treatments, doctors] = await Promise.all([
    guard(api<Treatment[]>("/treatments")),
    guard(api<DoctorOption[]>("/doctors")),
  ]);
  const activeCount = treatments.filter((t) => t.isActive).length;

  const q = param(params, "q");
  const estado = param(params, "estado");
  const web = param(params, "web");
  const doctor = param(params, "doctor");
  const filtered = treatments
    .filter((t) => matches(q, t.name, t.description))
    .filter((t) => !estado || (estado === "activos" ? t.isActive : !t.isActive))
    .filter((t) => !web || (web === "reservable" ? t.isPublic : !t.isPublic))
    .filter((t) =>
      !doctor ? true : doctor === "ninguno" ? t.doctors.length === 0 : t.doctors.some((d) => d.id === doctor),
    )
    // Activos primero; dentro de cada grupo, el orden alfabético del backend.
    .sort((a, b) => Number(b.isActive) - Number(a.isActive));
  const size = pageSizeParam(params, DEFAULT_SIZE);
  const page = paginate(filtered, pageParam(params), size);

  return (
    <div className="w-full space-y-4">
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

      {treatments.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput placeholder="Buscar tratamiento" />
          <FilterSelect
            param="estado"
            label="Estado"
            options={[
              { value: "activos", label: "Activos" },
              { value: "inactivos", label: "Inactivos" },
            ]}
          />
          <FilterSelect
            param="web"
            label="Web"
            options={[
              { value: "reservable", label: "Reservable" },
              { value: "panel", label: "Solo panel" },
            ]}
          />
          <FilterSelect
            param="doctor"
            label="Doctor"
            options={[
              ...doctors.map((d) => ({ value: d.id, label: d.fullName })),
              { value: "ninguno", label: "Sin doctor asignado" },
            ]}
          />
          <ClearFilters params={["q", "estado", "web", "doctor"]} />
        </div>
      )}

      <section className="overflow-hidden rounded-3xl bg-white">
        {treatments.length > 0 && page.total === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-semibold">Ningún tratamiento coincide</p>
            <p className="mt-1 text-sm text-muted">Prueba con otra búsqueda o quita algún filtro.</p>
          </div>
        ) : treatments.length === 0 ? (
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
                {page.items.map((t) => (
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

      <Pagination
        info={page}
        pathname="/panel/tratamientos"
        params={params}
        noun="tratamientos"
        size={size}
        defaultSize={DEFAULT_SIZE}
      />

      <p className="text-xs text-muted">
        Un tratamiento sin doctor asignado no aparece en la agenda ni en la web. Asígnalo con
        Editar.
      </p>
    </div>
  );
}
