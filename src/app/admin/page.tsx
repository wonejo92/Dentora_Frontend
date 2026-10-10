import type { Metadata } from "next";
import { ClearFilters, FilterSelect } from "@/components/list/filter-select";
import { Pagination } from "@/components/list/pagination";
import { SearchInput } from "@/components/list/search-input";
import { UserMenu } from "@/components/panel/user-menu";
import { Logo } from "@/components/ui/logo";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { guard, requireSuperAdmin } from "@/lib/dal";
import { matches, pageParam, pageSizeParam, paginate, param } from "@/lib/list";
import type { AdminClinic, ClinicStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Clínicas" };

const statusStyles: Record<ClinicStatus, { label: string; className: string }> = {
  TRIAL: { label: "Prueba", className: "bg-brand-50 text-brand-700" },
  ACTIVE: { label: "Activa", className: "bg-green-100 text-green-800" },
  PAST_DUE: { label: "Pago atrasado", className: "bg-amber-100 text-amber-800" },
  SUSPENDED: { label: "Suspendida", className: "bg-red-100 text-red-700" },
};

const dateFormat = new Intl.DateTimeFormat("es-EC", {
  day: "numeric",
  month: "short",
  timeZone: "America/Guayaquil",
});

const DEFAULT_SIZE = 20;

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const me = await requireSuperAdmin();
  const params = await searchParams;
  const clinics = await guard(api<AdminClinic[]>("/admin/clinics"));

  const q = param(params, "q");
  const estado = param(params, "estado");
  const plan = param(params, "plan");
  const filtered = clinics
    .filter((c) => matches(q, c.name, c.city, c.email, c.slug))
    .filter((c) => !estado || c.status === estado)
    .filter((c) => !plan || c.plan === plan);
  const size = pageSizeParam(params, DEFAULT_SIZE);
  const page = paginate(filtered, pageParam(params), size);

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-line bg-white px-4 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">
            admin
          </span>
        </div>
        <UserMenu me={me} />
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <h1 className="text-2xl font-bold tracking-tight">Clínicas</h1>
        <p className="mt-1 mb-6 text-sm text-muted">{clinics.length} registradas</p>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SearchInput placeholder="Clínica, ciudad o correo" />
          <FilterSelect
            param="estado"
            label="Estado"
            options={Object.entries(statusStyles).map(([value, { label }]) => ({ value, label }))}
          />
          <FilterSelect
            param="plan"
            label="Plan"
            options={[
              { value: "BASIC", label: "Básico" },
              { value: "PRO", label: "Pro" },
              { value: "CLINIC", label: "Clínica" },
            ]}
          />
          <ClearFilters params={["q", "estado", "plan"]} />
        </div>

        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Clínica</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Prueba hasta</th>
                <th className="px-4 py-3 text-right font-medium">Pacientes</th>
                <th className="px-4 py-3 text-right font-medium">Citas</th>
                <th className="px-4 py-3 text-right font-medium">Usuarios</th>
                <th className="px-4 py-3 font-medium">Alta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {page.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted">
                    Ninguna clínica coincide con la búsqueda.
                  </td>
                </tr>
              )}
              {page.items.map((c) => {
                const status = statusStyles[c.status];
                return (
                  <tr key={c.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-xs text-muted">
                        {[c.city, c.email].filter(Boolean).join(" · ")}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn("rounded-full px-2.5 py-1 text-xs font-medium", status.className)}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {c.trialEndsAt ? dateFormat.format(new Date(c.trialEndsAt)) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{c._count.patients}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{c._count.appointments}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{c._count.users}</td>
                    <td className="px-4 py-3 text-muted">
                      {dateFormat.format(new Date(c.createdAt))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <Pagination
            info={page}
            pathname="/admin"
            params={params}
            noun="clínicas"
            size={size}
            defaultSize={DEFAULT_SIZE}
          />
        </div>
      </main>
    </div>
  );
}
