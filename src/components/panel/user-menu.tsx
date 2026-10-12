import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { initials, roleLabels } from "@/lib/labels";
import { cn } from "@/lib/cn";
import type { Me } from "@/lib/types";
import { LogoutIcon } from "./icons";

/**
 * `logout="mobile"`: en escritorio el menú lateral ya tiene "Cerrar sesión",
 * así que el botón solo se muestra cuando ese menú está oculto.
 */
export function UserMenu({
  me,
  logout: showLogout = "always",
  profileHref,
}: {
  me: Me;
  logout?: "always" | "mobile";
  /** Si se indica, el nombre y la inicial llevan a "Mi perfil". */
  profileHref?: string;
}) {
  const identity = (
    <>
      <span className="flex size-8 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
        {initials(me.fullName)}
      </span>
      <div className="hidden min-w-0 pr-1 leading-tight sm:block">
        <p className="truncate text-sm font-semibold">{me.fullName}</p>
        <p className="text-xs text-muted">{roleLabels[me.role]}</p>
      </div>
    </>
  );

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full bg-surface p-1.5",
        showLogout === "mobile" && "lg:pr-4",
      )}
    >
      {profileHref ? (
        <Link
          href={profileHref}
          title="Mi perfil"
          className="-m-0.5 flex min-w-0 items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-canvas"
        >
          {identity}
        </Link>
      ) : (
        identity
      )}
      <form action={logout} className={cn(showLogout === "mobile" && "lg:hidden")}>
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
