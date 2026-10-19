import type { Metadata } from "next";
import { DoctorDialog } from "@/components/doctors/doctor-dialog";
import { ClearFilters, FilterSelect } from "@/components/list/filter-select";
import { ClockIcon, UserIcon } from "@/components/panel/icons";
import { Pagination } from "@/components/list/pagination";
import { SearchInput } from "@/components/list/search-input";
import { ScheduleDialog } from "@/components/doctors/schedule-dialog";
import { buttonClass } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { plans } from "@/lib/admin";
import { guard, requireClinicUser } from "@/lib/dal";
import { initials } from "@/lib/labels";
import { matches, pageParam, pageSizeParam, paginate, param } from "@/lib/list";
import { summarizeSchedule } from "@/lib/schedule";
import type { Doctor, StaffUser, Treatment } from "@/lib/types";

export const metadata: Metadata = { title: "Doctores" };

/** Múltiplos de 4 para llenar filas completas de tarjetas. */
const SIZES = [8, 16, 32];
const DEFAULT_SIZE = 8;

export default async function DoctorsPage({ searchParams }: PageProps<"/panel/doctores">) {
  const me = await requireClinicUser();
  const canEdit = me.role === "OWNER";
  const params = await searchParams;
  const [doctors, treatments, users] = await Promise.all([
    guard(api<Doctor[]>("/doctors")),
    guard(api<Treatment[]>("/treatments")),
    canEdit ? guard(api<StaffUser[]>("/users")) : Promise.resolve([]),
  ]);
  const activeCount = doctors.filter((d) => d.isActive).length;
  // Máximo de doctores activos del plan (null = sin límite).
  const maxDoctors = me.planLimits?.maxDoctors ?? null;
  const atLimit = canEdit && maxDoctors !== null && activeCount >= maxDoctors;

  const q = param(params, "q");
  const estado = param(params, "estado");
  const tratamiento = param(params, "tratamiento");
  const filtered = doctors
    .filter((d) => matches(q, d.fullName, d.specialty))
    .filter((d) => !estado || (estado === "activos" ? d.isActive : !d.isActive))
    .filter((d) => !tratamiento || d.treatments.some((t) => t.id === tratamiento))
    .sort((a, b) => Number(b.isActive) - Number(a.isActive));
  const size = pageSizeParam(params, DEFAULT_SIZE, SIZES);
  const page = paginate(filtered, pageParam(params), size);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Doctores</h1>
          <p className="text-sm text-muted">
            {activeCount} {activeCount === 1 ? "activo" : "activos"}
            {doctors.length > activeCount && ` · ${doctors.length - activeCount} inactivos`}
          </p>
        </div>
        {canEdit && (
          <DoctorDialog treatments={treatments} users={users} triggerClassName={buttonClass("primary")}>
            + Nuevo doctor
          </DoctorDialog>
        )}
      </div>

      {atLimit && (
        <p className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
          Tu plan {plans[me.clinic.plan].label} permite{" "}
          {maxDoctors === 1 ? "1 doctor activo" : `hasta ${maxDoctors} doctores activos`}. Para agregar otro, pásate al
          plan {me.clinic.plan === "BASIC" ? "Pro" : "Clínica"} o desactiva uno de los actuales.
        </p>
      )}

      {doctors.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput placeholder="Buscar por nombre o especialidad" />
          <FilterSelect
            param="estado"
            label="Estado"
            options={[
              { value: "activos", label: "Activos" },
              { value: "inactivos", label: "Inactivos" },
            ]}
          />
          <FilterSelect
            param="tratamiento"
            label="Realiza"
            options={treatments.map((t) => ({ value: t.id, label: t.name }))}
          />
          <ClearFilters params={["q", "estado", "tratamiento"]} />
        </div>
      )}

      {doctors.length > 0 && page.total === 0 ? (
        <section className="rounded-3xl bg-surface px-6 py-16 text-center">
          <p className="font-semibold">Ningún doctor coincide</p>
          <p className="mt-1 text-sm text-muted">Prueba con otra búsqueda o quita algún filtro.</p>
        </section>
      ) : doctors.length === 0 ? (
        <section className="rounded-3xl bg-surface px-6 py-16 text-center">
          <p className="font-semibold">Agrega a los doctores de tu clínica</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Con su horario y los tratamientos que realiza, la agenda calcula sola los horarios
            disponibles.
          </p>
        </section>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {page.items.map((d) => {
            const schedule = summarizeSchedule(d.schedules);
            return (
              <article
                key={d.id}
                className={cn("flex flex-col rounded-3xl bg-surface p-5", !d.isActive && "opacity-70")}
              >
                <div className="flex items-start gap-4">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: d.color }}
                  >
                    {initials(d.fullName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold">
                      {d.fullName}
                      {!d.isActive && (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Inactivo
                        </span>
                      )}
                    </h2>
                    <p className="text-sm text-muted">{d.specialty ?? "Odontología"}</p>
                    {d.user && <p className="mt-0.5 truncate text-xs text-muted">Inicia sesión como {d.user.email}</p>}
                  </div>
                </div>

                <dl className="mt-4 flex-1 space-y-4 text-sm">
                  <div>
                    <dt className="mb-1.5 text-xs font-medium text-muted">Horario</dt>
                    <dd>
                      {schedule.length === 0 ? (
                        <span className="text-amber-700">Sin horario: no aparece en la agenda</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {schedule.map((line) => (
                            <li key={line} className="tabular-nums">
                              {line}
                            </li>
                          ))}
                        </ul>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="mb-1.5 text-xs font-medium text-muted">Tratamientos</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {d.treatments.length === 0 ? (
                        <span className="text-amber-700">Sin tratamientos asignados</span>
                      ) : (
                        d.treatments.map((t) => (
                          <span key={t.id} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-brand-700">
                            {t.name}
                          </span>
                        ))
                      )}
                    </dd>
                  </div>
                </dl>

                {canEdit && (
                  <div className="mt-5 grid grid-cols-2 gap-2 border-t border-line pt-4">
                    <ScheduleDialog doctor={d} triggerClassName={buttonClass("secondary", "h-9 px-3")}>
                      <ClockIcon />
                      Horario
                    </ScheduleDialog>
                    <DoctorDialog
                      doctor={d}
                      treatments={treatments}
                      users={users}
                      triggerClassName={buttonClass("secondary", "h-9 px-3")}
                    >
                      <UserIcon />
                      Perfil
                    </DoctorDialog>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <Pagination
        info={page}
        pathname="/panel/doctores"
        params={params}
        noun="doctores"
        size={size}
        defaultSize={DEFAULT_SIZE}
        sizes={SIZES}
      />
    </div>
  );
}
