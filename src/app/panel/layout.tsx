import { Logo } from "@/components/ui/logo";
import {
  CalendarIcon,
  SettingsIcon,
  StethoscopeIcon,
  ToothIcon,
  UsersIcon,
} from "@/components/panel/icons";
import { SidebarNav, type NavItem } from "@/components/panel/sidebar-nav";
import { TrialBanner } from "@/components/panel/trial-banner";
import { UserMenu } from "@/components/panel/user-menu";
import { requireClinicUser } from "@/lib/dal";

const nav: NavItem[] = [
  { href: "/panel", label: "Agenda", icon: <CalendarIcon /> },
  { href: "/panel/pacientes", label: "Pacientes", icon: <UsersIcon /> },
  { href: "/panel/doctores", label: "Doctores", icon: <StethoscopeIcon /> },
  { href: "/panel/tratamientos", label: "Tratamientos", icon: <ToothIcon /> },
  { href: "/panel/ajustes", label: "Ajustes", icon: <SettingsIcon /> },
];

export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const me = await requireClinicUser();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-b border-line bg-white p-4 lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0 lg:p-5">
        <div className="mb-4 flex items-center justify-between lg:mb-8 lg:px-3">
          <Logo />
        </div>
        <SidebarNav items={nav} />
      </aside>

      <div className="min-w-0">
        {me.role === "OWNER" && <TrialBanner clinic={me.clinic} />}
        <header className="flex items-center justify-between gap-4 border-b border-line bg-white px-4 py-3 sm:px-8">
          <p className="truncate text-sm font-semibold">{me.clinic.name}</p>
          <UserMenu me={me} />
        </header>
        <main className="px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
