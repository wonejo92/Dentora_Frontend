import Link from "next/link";
import {
  BellIcon,
  CalendarIcon,
  ChartIcon,
  DashboardIcon,
  SearchIcon,
  SettingsIcon,
  StethoscopeIcon,
  ToothIcon,
  UsersIcon,
} from "@/components/panel/icons";
import { SidebarNav, type NavItem } from "@/components/panel/sidebar-nav";
import { TrialBanner } from "@/components/panel/trial-banner";
import { UserMenu } from "@/components/panel/user-menu";
import { api } from "@/lib/api";
import { guard, requireClinicUser } from "@/lib/dal";
import { formatLongDate, localDate } from "@/lib/time";
import type { Appointment } from "@/lib/types";

const nav: NavItem[] = [
  { href: "/panel", label: "Resumen", icon: <DashboardIcon /> },
  { href: "/panel/agenda", label: "Agenda", icon: <CalendarIcon /> },
  { href: "/panel/pacientes", label: "Pacientes", icon: <UsersIcon /> },
  { href: "/panel/doctores", label: "Doctores", icon: <StethoscopeIcon /> },
  { href: "/panel/tratamientos", label: "Tratamientos", icon: <ToothIcon /> },
  { href: "/panel/reportes", label: "Reportes", icon: <ChartIcon /> },
  { href: "/panel/ajustes", label: "Ajustes", icon: <SettingsIcon /> },
];

/** Reservas pendientes de confirmar en los próximos 60 días (para la campana). */
async function countPending() {
  const from = new Date();
  const to = new Date(from.getTime() + 60 * 24 * 60 * 60 * 1000);
  const pending = await guard(
    api<Appointment[]>(
      `/appointments?status=PENDING&from=${from.toISOString()}&to=${to.toISOString()}`,
    ),
  );
  return pending.length;
}

export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const me = await requireClinicUser();
  const pending = await countPending();
  const today = formatLongDate(localDate(new Date(), me.clinic.timezone));

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="bg-night-900 p-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:p-5">
        <div className="mb-4 flex items-center gap-3 lg:mb-6 lg:px-1">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
            <ToothIcon />
          </span>
          <div className="min-w-0">
            <p className="leading-tight font-bold text-white">Dentora</p>
            <p className="truncate text-xs text-night-300">{me.clinic.name}</p>
          </div>
        </div>

        <form action="/panel/pacientes" role="search" className="mb-4 hidden lg:block">
          <label className="flex items-center gap-2 rounded-xl border border-night-700 px-3 py-2 text-night-300 focus-within:border-night-300">
            <SearchIcon />
            <span className="sr-only">Buscar paciente</span>
            <input
              name="q"
              placeholder="Buscar paciente"
              className="w-full bg-transparent text-sm text-white placeholder:text-night-300 focus:outline-none"
            />
          </label>
        </form>

        <SidebarNav items={nav} />
      </aside>

      <div className="min-w-0">
        {me.role === "OWNER" && <TrialBanner clinic={me.clinic} />}
        <header className="flex items-center justify-end gap-2 px-4 pt-4 sm:gap-3 sm:px-8 sm:pt-6">
          <UserMenu me={me} />
          <div className="hidden items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm md:flex">
            <CalendarIcon />
            {today}
          </div>
          <Link
            href="/panel/agenda"
            aria-label={`${pending} reservas por confirmar`}
            title="Reservas por confirmar"
            className="relative flex size-11 items-center justify-center rounded-full bg-white text-ink transition-colors hover:bg-brand-50"
          >
            <BellIcon />
            {pending > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-brand-500 px-1.5 text-center text-[11px] leading-5 font-semibold text-white">
                {pending}
              </span>
            )}
          </Link>
        </header>
        <main className="px-4 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
