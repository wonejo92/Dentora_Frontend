import { cookies } from "next/headers";
import Link from "next/link";
import {
  BellIcon,
  CalendarIcon,
  CashIcon,
  CalendarOffIcon,
  ChartIcon,
  DashboardIcon,
  SearchIcon,
  SettingsIcon,
  StethoscopeIcon,
  ToothIcon,
  UserCogIcon,
  UsersIcon,
} from "@/components/panel/icons";
import { NewAppointmentDialog } from "@/components/appointments/new-appointment-dialog";
import { Sidebar, type NavGroup } from "@/components/panel/sidebar";
import { TrialBanner } from "@/components/panel/trial-banner";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { UserMenu } from "@/components/panel/user-menu";
import { api } from "@/lib/api";
import { SIDEBAR_COOKIE } from "@/lib/constants";
import { guard, requireClinicUser } from "@/lib/dal";
import { initials, roleLabels } from "@/lib/labels";
import { formatLongDate, localDate } from "@/lib/time";
import type { Appointment, Role } from "@/lib/types";

/** Menú según el rol: Reportes, Personal y Ajustes son solo para el dueño. */
function navFor(role: Role): NavGroup[] {
  const isOwner = role === "OWNER";
  return [
    {
      title: "General",
      items: [
        { href: "/panel", label: "Resumen", icon: <DashboardIcon /> },
        { href: "/panel/agenda", label: "Agenda", icon: <CalendarIcon /> },
        { href: "/panel/feriados", label: "Feriados", icon: <CalendarOffIcon /> },
      ],
    },
    {
      title: "Clínica",
      items: [
        { href: "/panel/pacientes", label: "Pacientes", icon: <UsersIcon /> },
        { href: "/panel/doctores", label: "Doctores", icon: <StethoscopeIcon /> },
        { href: "/panel/tratamientos", label: "Tratamientos", icon: <ToothIcon /> },
        ...(role !== "ASSISTANT" ? [{ href: "/panel/caja", label: "Caja", icon: <CashIcon /> }] : []),
      ],
    },
    // Reportes: datos del negocio, solo el dueño.
    ...(isOwner
      ? [{ title: "Análisis", items: [{ href: "/panel/reportes", label: "Reportes", icon: <ChartIcon /> }] }]
      : []),
    ...(isOwner
      ? [
          {
            title: "Configuración",
            items: [
              { href: "/panel/ajustes/personal", label: "Personal", icon: <UserCogIcon /> },
              { href: "/panel/ajustes", label: "Ajustes", icon: <SettingsIcon /> },
            ],
          },
        ]
      : []),
  ];
}

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
  const [pending, cookieStore] = await Promise.all([countPending(), cookies()]);
  const collapsed = cookieStore.get(SIDEBAR_COOKIE)?.value === "collapsed";
  const today = formatLongDate(localDate(new Date(), me.clinic.timezone));

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar
        groups={navFor(me.role)}
        clinicName={me.clinic.name}
        initialCollapsed={collapsed}
        user={{
          fullName: me.fullName,
          email: me.email,
          role: roleLabels[me.role],
          initials: initials(me.fullName),
          canManage: me.role === "OWNER",
        }}
      />

      <div className="min-w-0 flex-1">
        {me.role === "OWNER" && <TrialBanner clinic={me.clinic} />}
        <header className="flex items-center justify-between gap-2 px-4 pt-4 sm:gap-3 sm:px-8 sm:pt-6">
          <form action="/panel/pacientes" role="search" className="hidden w-full max-w-xs md:block">
            <label className="flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-muted transition-colors focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-50">
              <SearchIcon />
              <span className="sr-only">Buscar paciente</span>
              <input
                name="q"
                placeholder="Buscar paciente"
                className="w-full bg-transparent text-sm text-ink placeholder:text-muted/70 focus:outline-none"
              />
            </label>
          </form>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <NewAppointmentDialog
              timeZone={me.clinic.timezone}
              triggerLabel="Nueva cita"
              triggerClassName="flex size-11 items-center justify-center rounded-full bg-brand-500 text-white shadow-md shadow-brand-500/30 transition-colors hover:bg-brand-600"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M12 5v14M5 12h14" />
              </svg>
            </NewAppointmentDialog>
            <UserMenu me={me} logout="mobile" profileHref="/panel/perfil" />
            <div className="hidden items-center gap-2 rounded-full bg-surface px-4 py-2.5 text-sm xl:flex">
              <CalendarIcon />
              {today}
            </div>
            <ThemeToggle />
            <Link
              href="/panel/agenda"
              aria-label={`${pending} reservas por confirmar`}
              title="Reservas por confirmar"
              className="relative flex size-11 items-center justify-center rounded-full bg-surface text-ink transition-colors hover:bg-brand-50"
            >
              <BellIcon />
              {pending > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-brand-500 px-1.5 text-center text-[11px] leading-5 font-semibold text-white">
                  {pending}
                </span>
              )}
            </Link>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
