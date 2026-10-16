import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ClinicActions } from "@/components/admin/clinic-actions";
import { ClinicSpotlight } from "@/components/admin/clinic-spotlight";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  UsersIcon,
  WhatsappIcon,
  WorldIcon,
} from "@/components/panel/icons";
import { ago, clinicStatus, plans, trialDaysLeft, trialLeftPercent } from "@/lib/admin";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { guard, requireSuperAdmin } from "@/lib/dal";
import type { AdminClinicDetail } from "@/lib/types";

export const metadata: Metadata = { title: "Clínica" };

const date = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) =>
  new Intl.DateTimeFormat("es-EC", { timeZone: "America/Guayaquil", ...opts }).format(new Date(iso));
const dayMonth = (iso: string) => date(iso, { day: "numeric", month: "long" });

const serverNow = () => Date.now();

async function loadClinic(id: string) {
  try {
    return await guard(api<AdminClinicDetail>(`/admin/clinics/${id}`));
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) notFound();
    throw e;
  }
}

export default async function AdminClinicPage({ params }: PageProps<"/admin/clinicas/[id]">) {
  const me = await requireSuperAdmin();
  const { id } = await params;
  const c = await loadClinic(id);
  const status = clinicStatus[c.status];
  const plan = plans[c.plan];
  const owner = c.owners[0];
  const now = serverNow();
  const trialDays = c.status === "TRIAL" ? trialDaysLeft(c.trialEndsAt, now) : null;

  // Fila del medio de la tarjeta "Plan": depende del estado.
  const middle =
    c.status === "TRIAL"
      ? {
          label: "Prueba gratis hasta",
          value: c.trialEndsAt ? date(c.trialEndsAt) : "—",
          className: "bg-brand-200 text-ink",
        }
      : c.status === "ACTIVE"
        ? { label: "Estado", value: "Activa y pagando", className: "bg-brand-200 text-ink" }
        : c.status === "PAST_DUE"
          ? { label: "Estado", value: "Pago atrasado", className: "bg-amber-100 text-amber-900" }
          : { label: "Estado", value: "Suspendida", className: "bg-red-100 text-red-800" };

  return (
    <div className="min-h-screen">
      <AdminHeader me={me} />

      <main className="mx-auto max-w-7xl space-y-4 px-4 pb-12 sm:px-8">
        {/* Título e indicadores */}
        <section className="flex flex-wrap items-center gap-x-10 gap-y-6 py-4">
          <div className="mr-auto flex min-w-0 items-center gap-5">
            <Link
              href="/admin"
              aria-label="Volver al panel"
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface shadow-sm hover:bg-brand-50"
            >
              <ArrowLeftIcon />
            </Link>
            <div className="min-w-0">
              <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">{c.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", status.className)}>
                  {status.label}
                </span>
                <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-muted">
                  Plan {plan.label}
                </span>
              </div>
            </div>
          </div>
          <Stat
            icon={<UsersIcon />}
            value={c._count.patients.toLocaleString("es-EC")}
            caption={["Pacientes", "registrados"]}
          />
          <Stat
            icon={<CalendarIcon />}
            value={c._count.appointments.toLocaleString("es-EC")}
            badge={`+${c.appointmentsThisMonth} este mes`}
            caption={["Citas", "en total"]}
          />
          <Stat
            icon={<ClockIcon />}
            value={c.lastActivityAt ? ago(c.lastActivityAt, now) : "Sin actividad"}
            dark={!!c.lastActivityAt}
            caption={["Última actividad", c.lastActivityAt ? dayMonth(c.lastActivityAt) : "todavía"]}
          />
        </section>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-12">
          {/* Uso */}
          <Card title="Uso" className="xl:col-span-5">
            <div className="mt-5 grid flex-1 auto-rows-fr grid-cols-2 gap-2.5 sm:grid-cols-3">
              <Tile label="Pacientes" value={c._count.patients} className="bg-night-900 text-white" />
              <Tile label="Citas este mes" value={c.appointmentsThisMonth} className="bg-brand-200 text-ink" />
              <Tile label="Citas en total" value={c._count.appointments} />
              <Tile label="Doctores" value={c._count.doctors} />
              <Tile label="Tratamientos" value={c._count.treatments} />
              <Tile label="Usuarios" value={c._count.users} />
            </div>
          </Card>

          {/* Plan y prueba */}
          <Card title="Plan" className="xl:col-span-4">
            {trialDays !== null ? (
              <>
                <p className={cn("mt-4 text-4xl font-bold tracking-tight", trialDays < 0 && "text-red-600")}>
                  {trialDays > 0
                    ? `${trialDays} ${trialDays === 1 ? "día" : "días"}`
                    : trialDays === 0
                      ? "Vence hoy"
                      : "Vencida"}
                </p>
                <p className="text-sm text-muted">
                  {trialDays >= 0 ? "Le quedan de prueba gratis" : `La prueba terminó el ${dayMonth(c.trialEndsAt!)}`}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
                  <div
                    className={cn("h-full rounded-full", trialDays <= 3 ? "bg-amber-500" : "bg-brand-500")}
                    style={{ width: `${trialLeftPercent(c.createdAt, c.trialEndsAt, now)}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="mt-4 text-4xl font-bold tracking-tight tabular-nums">${plan.price}</p>
                <p className="text-sm text-muted">Al mes con el plan {plan.label}</p>
              </>
            )}
            <ul className="mt-5 space-y-2.5">
              <Step label="Plan" value={`${plan.label} · $${plan.price}/mes`} className="bg-canvas text-ink" />
              <Step
                label={middle.label}
                value={middle.value}
                className={cn(middle.className, "sm:ml-[7%] sm:mr-[9%]")}
              />
              <Step
                label="Cliente desde"
                value={date(c.createdAt)}
                className="bg-night-900 text-white sm:ml-[14%] sm:mr-[18%]"
              />
            </ul>
          </Card>

          <ClinicSpotlight
            clinic={c}
            label={status.label}
            subtitle={[c.city, `/${c.slug}`].filter(Boolean).join(", ")}
            note={owner ? `Dueño: ${owner.fullName}` : undefined}
            email={owner?.email ?? c.email}
            className="lg:col-span-2 xl:col-span-3"
          />

          {/* Datos */}
          <Card title="Datos" className="lg:col-span-2 xl:col-span-7">
            <ul className="mt-3 grid gap-x-8 sm:grid-cols-2">
              <InfoRow
                icon={<UserIcon />}
                label="Dueño"
                value={owner ? `${owner.fullName}${owner.isActive ? "" : " (inactivo)"}` : null}
              />
              <InfoRow icon={<MailIcon />} label="Correo del dueño" value={owner?.email ?? null} />
              <InfoRow icon={<MailIcon />} label="Correo de la clínica" value={c.email} />
              <InfoRow icon={<PhoneIcon />} label="Teléfono" value={c.phone} />
              <InfoRow icon={<WhatsappIcon />} label="WhatsApp" value={c.whatsapp} />
              <InfoRow
                icon={<MapPinIcon />}
                label="Dirección"
                value={[c.address, c.city].filter(Boolean).join(", ") || null}
              />
              <InfoRow icon={<WorldIcon />} label="Página de reservas" value={`/${c.slug}`} />
              <InfoRow icon={<ClockIcon />} label="Zona horaria" value={c.timezone} />
            </ul>
          </Card>

          <div className="lg:col-span-2 xl:col-span-5">
            <ClinicActions key={`${c.status}-${c.plan}-${c.trialEndsAt}`} clinic={c} now={now} />
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({
  icon,
  value,
  badge,
  dark,
  caption,
}: {
  icon: ReactNode;
  value: string;
  badge?: string;
  dark?: boolean;
  caption: [string, string];
}) {
  return (
    <div className="flex items-center gap-4">
      <span
        className={cn(
          "flex size-14 items-center justify-center rounded-full",
          dark ? "bg-night-900 text-brand-200" : "bg-surface text-ink",
        )}
      >
        {icon}
      </span>
      <div>
        <p className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight tabular-nums">{value}</span>
          {badge && (
            <span className="rounded-full bg-brand-200 px-2.5 py-0.5 text-xs font-semibold text-ink">{badge}</span>
          )}
        </p>
        <p className="text-xs leading-tight text-muted">
          {caption[0]}
          <br />
          {caption[1]}
        </p>
      </div>
    </div>
  );
}

function Card({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={cn("flex flex-col rounded-[28px] bg-surface p-5 sm:p-6", className)}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Tile({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className={cn("flex min-h-28 flex-col justify-between rounded-2xl p-4", className ?? "bg-canvas text-ink")}>
      <p className="text-xs opacity-75">{label}</p>
      <p className="text-3xl font-bold tracking-tight tabular-nums">{value.toLocaleString("es-EC")}</p>
    </div>
  );
}

function Step({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <li className={cn("rounded-2xl px-4 py-3.5", className)}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="font-bold">{value}</p>
    </li>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string | null }) {
  return (
    <li className="flex items-center gap-3 border-b border-line py-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-canvas text-muted [&_svg]:size-[18px]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className={cn("break-words", value ? "font-semibold" : "text-muted")}>{value ?? "—"}</p>
      </div>
    </li>
  );
}
