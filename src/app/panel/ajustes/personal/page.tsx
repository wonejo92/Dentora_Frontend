import type { Metadata } from "next";
import Link from "next/link";
import { UserDialog } from "@/components/settings/user-dialog";
import { buttonClass } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { guard, requireClinicUser } from "@/lib/dal";
import { initials, roleLabels } from "@/lib/labels";
import type { StaffUser } from "@/lib/types";

export const metadata: Metadata = { title: "Personal" };

export default async function StaffPage() {
  const me = await requireClinicUser();
  if (me.role !== "OWNER") return null;
  const users = await guard(api<StaffUser[]>("/users"));
  const sorted = [...users].sort((a, b) => Number(b.isActive) - Number(a.isActive));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {users.filter((u) => u.isActive).length} con acceso · Cada persona entra con su propio correo.
        </p>
        <UserDialog triggerClassName={buttonClass("primary")}>+ Nuevo usuario</UserDialog>
      </div>

      <section className="overflow-hidden rounded-3xl bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="px-6 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Perfil de doctor</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="w-px px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sorted.map((u) => {
                const isSelf = u.id === me.id;
                return (
                  <tr key={u.id} className={cn(!u.isActive && "bg-canvas/50")}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
                          {initials(u.fullName)}
                        </span>
                        <div className="min-w-0">
                          <p className={cn("truncate font-semibold", !u.isActive && "text-muted")}>
                            {u.fullName}
                            {isSelf && <span className="ml-2 text-xs font-normal text-muted">(tú)</span>}
                          </p>
                          <p className="truncate text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                        {roleLabels[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {u.doctor ? (
                        <span className="text-ink">Vinculado</span>
                      ) : u.role === "DOCTOR" ? (
                        <Link href="/panel/doctores" className="text-amber-700 hover:underline">
                          Sin vincular
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">Activo</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Sin acceso</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <UserDialog user={u} isSelf={isSelf} triggerClassName={buttonClass("ghost", "h-9 px-3")}>
                        Editar
                      </UserDialog>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-muted">
        Para que un doctor vea su agenda al iniciar sesión, créale un usuario con rol Doctor y vincúlalo
        desde Doctores → Perfil.
      </p>
    </div>
  );
}
