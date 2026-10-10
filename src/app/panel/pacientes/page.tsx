import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "@/components/panel/icons";
import { buttonClass } from "@/components/ui/button";
import { api } from "@/lib/api";
import { guard, requireClinicUser } from "@/lib/dal";
import { initials } from "@/lib/labels";
import type { Paginated, Patient } from "@/lib/types";

export const metadata: Metadata = { title: "Pacientes" };

const PAGE_SIZE = 20;

export default async function PatientsPage({ searchParams }: PageProps<"/panel/pacientes">) {
  await requireClinicUser();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const page = Math.max(1, Number(params.pagina) || 1);

  const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (q) query.set("q", q);
  const { items, total } = await guard(api<Paginated<Patient>>(`/patients?${query}`));
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageHref = (p: number) => {
    const next = new URLSearchParams({ pagina: String(p) });
    if (q) next.set("q", q);
    return `/panel/pacientes?${next}`;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-sm text-muted">
            {q
              ? `${total} ${total === 1 ? "resultado" : "resultados"} para "${q}"`
              : `${total} ${total === 1 ? "paciente registrado" : "pacientes registrados"}`}
          </p>
        </div>
        <form role="search" className="w-full sm:w-80">
          <label className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-muted focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-50">
            <SearchIcon />
            <span className="sr-only">Buscar paciente</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Nombre, cédula o teléfono"
              className="w-full bg-transparent text-sm text-ink placeholder:text-muted/70 focus:outline-none"
            />
          </label>
        </form>
      </div>

      <section className="overflow-hidden rounded-3xl bg-white">
        {items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-semibold">{q ? "Sin resultados" : "Aún no hay pacientes"}</p>
            <p className="mt-1 text-sm text-muted">
              {q
                ? "Prueba con otro nombre, la cédula o el teléfono. No hace falta escribir tildes."
                : "Los pacientes se crean al agendar una cita o cuando reservan online."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  <th className="px-6 py-3 font-medium">Paciente</th>
                  <th className="px-4 py-3 font-medium">Identificación</th>
                  <th className="px-4 py-3 font-medium">Teléfono</th>
                  <th className="px-4 py-3 font-medium">Correo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((p) => (
                  <tr key={p.id} className="hover:bg-canvas/60">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
                          {initials(`${p.firstName.split(" ")[0]} ${p.lastName}`)}
                        </span>
                        <span className="font-semibold">
                          {p.firstName} {p.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className="mr-1.5 text-xs text-muted">{p.idType === "CEDULA" ? "CI" : p.idType}</span>
                      {p.idNumber}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{p.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{p.email ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {pages > 1 && (
        <nav aria-label="Páginas" className="flex items-center justify-between text-sm text-muted">
          <span>
            Página {page} de {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className={buttonClass("secondary")}>
                Anterior
              </Link>
            )}
            {page < pages && (
              <Link href={pageHref(page + 1)} className={buttonClass("secondary")}>
                Siguiente
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
