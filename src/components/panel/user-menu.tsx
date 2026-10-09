import { logout } from "@/app/actions/auth";
import { initials, roleLabels } from "@/lib/labels";
import type { Me } from "@/lib/types";
import { LogoutIcon } from "./icons";

export function UserMenu({ me }: { me: Me }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
        {initials(me.fullName)}
      </span>
      <div className="hidden min-w-0 sm:block">
        <p className="truncate text-sm font-semibold">{me.fullName}</p>
        <p className="text-xs text-muted">{roleLabels[me.role]}</p>
      </div>
      <form action={logout}>
        <button
          type="submit"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="rounded-lg p-2 text-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <LogoutIcon />
        </button>
      </form>
    </div>
  );
}
