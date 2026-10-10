import { logout } from "@/app/actions/auth";
import { initials, roleLabels } from "@/lib/labels";
import type { Me } from "@/lib/types";
import { LogoutIcon } from "./icons";

export function UserMenu({ me }: { me: Me }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white py-1.5 pr-1.5 pl-1.5 sm:pl-1.5">
      <span className="flex size-8 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
        {initials(me.fullName)}
      </span>
      <div className="hidden min-w-0 pr-1 leading-tight sm:block">
        <p className="truncate text-sm font-semibold">{me.fullName}</p>
        <p className="text-xs text-muted">{roleLabels[me.role]}</p>
      </div>
      <form action={logout}>
        <button
          type="submit"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <LogoutIcon />
        </button>
      </form>
    </div>
  );
}
