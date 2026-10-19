"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { logout } from "@/app/actions/auth";
import { restoreOnboarding } from "@/app/actions/onboarding";
import { cn } from "@/lib/cn";
import { SIDEBAR_COOKIE } from "@/lib/constants";
import { ThemeSwitch } from "@/components/theme/theme-toggle";
import { START_TOUR_EVENT } from "./panel-tour";
import {
  BoltIcon,
  CalendarCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LogoutIcon,
  SettingsIcon,
  ToothIcon,
} from "./icons";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Plan que hace falta para usarlo ("Pro"): el módulo no está en el plan actual. */
  badge?: string;
};
export type NavGroup = { title: string; items: NavItem[] };

/** La opción activa es la ruta más larga que coincide (Personal gana a Ajustes en /panel/ajustes/personal). */
function activeHref(pathname: string, hrefs: string[]) {
  return hrefs
    .filter((href) => pathname === href || (href !== "/panel" && pathname.startsWith(`${href}/`)))
    .sort((a, b) => b.length - a.length)[0];
}

export function Sidebar({
  groups,
  clinicName,
  user,
  initialCollapsed,
}: {
  groups: NavGroup[];
  clinicName: string;
  user: {
    fullName: string;
    email: string;
    role: string;
    initials: string;
    canManage: boolean;
    /** La lista de primeros pasos está oculta y le quedan pasos. */
    canRestoreOnboarding: boolean;
  };
  initialCollapsed: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const current = activeHref(pathname, groups.flatMap((g) => g.items.map((i) => i.href)));
  const isActive = (href: string) => href === current;

  const toggle = () => setCollapsed((c) => !c);

  // Cookie (no localStorage) para que el servidor pinte el ancho correcto sin parpadeo.
  useEffect(() => {
    document.cookie = `${SIDEBAR_COOKIE}=${collapsed ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`;
  }, [collapsed]);

  // Atajo ⌘B (Mac) / Ctrl+B (Windows), como en VS Code o Notion.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey || e.key.toLowerCase() !== "b") return;
      // Dentro de un campo de texto, ⌘B puede significar "negrita": no lo interceptamos.
      const target = e.target as HTMLElement;
      if (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      e.preventDefault();
      setCollapsed((c) => !c);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const shortcut = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘B" : "Ctrl+B";

  return (
    <>
      {/* Escritorio: tarjeta flotante */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 p-3 transition-[width] duration-200 lg:block",
          collapsed ? "w-[100px]" : "w-[268px]",
        )}
      >
        <div className={cn("relative flex h-full flex-col rounded-3xl bg-night-900 py-5 shadow-xl shadow-night-900/20", collapsed ? "px-2" : "px-3")}>
          <Brand collapsed={collapsed} clinicName={clinicName} />

          {/* Botón flotante sobre el borde derecho, a la altura del logo. */}
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            aria-keyshortcuts="Meta+B Control+B"
            title={`${collapsed ? "Expandir" : "Contraer"} menú (${shortcut})`}
            suppressHydrationWarning
            className="absolute top-8 -right-3.5 z-10 flex size-7 items-center justify-center rounded-full border border-line bg-surface text-brand-600 shadow-md shadow-black/10 transition-colors hover:border-brand-200 hover:bg-brand-50 focus-visible:ring-4 focus-visible:ring-brand-50 focus-visible:outline-none"
          >
            <span className="scale-75">{collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}</span>
          </button>

          <nav aria-label="Menú principal" data-tour="nav" className="mt-5 flex-1 overflow-x-hidden overflow-y-auto">
            {groups.map((group, i) => (
              <div key={group.title}>
                {collapsed ? (
                  i > 0 && <hr className="mx-auto my-3 w-8 border-night-700" />
                ) : (
                  <p
                    className={cn(
                      "mb-1.5 px-3 text-[11px] font-medium tracking-wider text-night-300 uppercase",
                      i > 0 && "mt-6",
                    )}
                  >
                    {group.title}
                  </p>
                )}
                <ul className={cn("space-y-1", collapsed && "flex flex-col items-center")}>
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <NavLink item={item} active={isActive(item.href)} collapsed={collapsed} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-3">
            <UserCard user={user} collapsed={collapsed} />
          </div>
        </div>
      </aside>

      {/* Celular y tablet: barra superior con scroll horizontal */}
      <div className="bg-night-900 lg:hidden">
        <div className="px-4 pt-4">
          <Brand collapsed={false} clinicName={clinicName} />
        </div>
        <nav aria-label="Menú principal" className="flex gap-1 overflow-x-auto px-4 py-3">
          {groups.flatMap((g) => g.items).map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm transition-colors",
                  active ? "bg-white font-semibold text-night-900" : "text-night-200 hover:bg-white/5 hover:text-white",
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

function Brand({ collapsed, clinicName }: { collapsed: boolean; clinicName: string }) {
  return (
    <Link href="/panel" className={cn("flex items-center gap-3", collapsed ? "justify-center" : "px-2")}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl",
          collapsed ? "size-11 bg-night-800 text-white" : "size-10 bg-brand-500 text-white",
        )}
      >
        <ToothIcon />
      </span>
      {!collapsed && (
        <span className="min-w-0 leading-tight">
          <span className="block text-xl font-bold tracking-tight text-white">dentora</span>
          <span className="block truncate text-xs text-night-300">{clinicName}</span>
        </span>
      )}
    </Link>
  );
}

function NavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      title={collapsed ? item.label + (item.badge ? ` (plan ${item.badge})` : "") : undefined}
      className={cn(
        "flex items-center transition-all",
        collapsed ? "size-11 justify-center rounded-full" : "gap-3 rounded-full px-4 py-2.5 text-sm",
        active
          ? "bg-white font-semibold text-night-900 shadow-lg shadow-black/25"
          : "text-night-200 hover:bg-white/5 hover:text-white",
      )}
    >
      {item.icon}
      {!collapsed && item.label}
      {!collapsed && item.badge && (
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-brand-200">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function UserCard({
  user,
  collapsed,
}: {
  user: {
    fullName: string;
    email: string;
    role: string;
    initials: string;
    canManage: boolean;
    /** La lista de primeros pasos está oculta y le quedan pasos. */
    canRestoreOnboarding: boolean;
  };
  collapsed: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const avatar = (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
      {user.initials}
    </span>
  );

  return (
    <div ref={ref} data-tour="user" className="relative">
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute bottom-full z-20 mb-2 overflow-hidden rounded-2xl border border-line bg-surface shadow-xl shadow-black/10",
            collapsed ? "left-0 w-64" : "inset-x-0",
          )}
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold">{user.fullName}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <div className="border-b border-line px-3 py-3">
            <p className="mb-2 px-1 text-xs text-muted">Tema</p>
            <ThemeSwitch />
          </div>
          {user.canManage && (
          <Link
            href="/panel/ajustes"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-canvas"
          >
            <SettingsIcon />
            Ajustes
          </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new Event(START_TOUR_EVENT));
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-canvas"
          >
            <BoltIcon />
            Ver tour del panel
          </button>
          {user.canRestoreOnboarding && (
            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                setOpen(false);
                const { pending } = await restoreOnboarding();
                if (!pending) return toast.success("Ya completaste todos los primeros pasos");
                router.push("/panel");
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-canvas"
            >
              <CalendarCheckIcon />
              Mostrar primeros pasos
            </button>
          )}
          <form action={logout} className="border-t border-line">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <LogoutIcon />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={collapsed ? `Menú de ${user.fullName}` : undefined}
        title={collapsed ? user.fullName : undefined}
        className={cn(
          "flex w-full items-center gap-3 text-left transition-colors",
          collapsed ? "justify-center" : "rounded-2xl bg-night-800 p-2.5 hover:bg-night-700",
        )}
      >
        {avatar}
        {!collapsed && (
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold text-white">{user.fullName}</span>
            <span className="block text-xs text-night-300">{user.role}</span>
          </span>
        )}
      </button>
    </div>
  );
}
