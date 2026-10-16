import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ClinicAvatar } from "@/components/admin/clinic-avatar";
import { ClinicSpotlight } from "@/components/admin/clinic-spotlight";
import { SignupsCalendar } from "@/components/admin/signups-calendar";
import {
  AlertTriangleIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  CashIcon,
  ChartIcon,
  ClockIcon,
  DashboardIcon,
  ToothIcon,
  UserIcon,
  WhatsappIcon,
} from "@/components/panel/icons";
import { ClearFilters, FilterSelect } from "@/components/list/filter-select";
import { Pagination } from "@/components/list/pagination";
import { SearchInput } from "@/components/list/search-input";
import { ago, clinicStatus, plans, trialDaysLeft, trialLeftPercent, type PlanKey } from "@/lib/admin";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { guard, requireSuperAdmin } from "@/lib/dal";
import { whatsappLink } from "@/lib/format";
import { hrefWith, matches, pageParam, pageSizeParam, paginate, param } from "@/lib/list";
import type { AdminClinic } from "@/lib/types";

export const metadata: Metadata = { title: "Panel" };

const TZ = "America/Guayaquil";
const DEFAULT_SIZE = 20;

/** "2026-10-15" en la hora de Ecuador. */
const dayKey = (date: string | number) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(date));
const shortDate = new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "short", timeZone: TZ });
const money = (n: number) => `$${n.toLocaleString("es-EC")}`;
const priceOf = (c: AdminClinic) => plans[c.plan as PlanKey]?.price ?? 0;
const sumPrices = (list: AdminClinic[]) => list.reduce((sum, c) => sum + priceOf(c), 0);
const daysText = (days: number) => (days === 1 ? "1 día" : `${days} días`);
const serverNow = () => Date.now();

/** "2026-10" desplazado `delta` meses. */
function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function groupByDay(list: AdminClinic[], date: (c: AdminClinic) => string | null) {
  const map = new Map<string, AdminClinic[]>();
  for (const c of list) {
    const iso = date(c);
    if (!iso) continue;
    const key = dayKey(iso);
    map.set(key, [...(map.get(key) ?? []), c]);
  }
  return map;
}

const SECTIONS = [
  { id: "resumen", label: "Resumen", icon: <DashboardIcon /> },
  { id: "calendario", label: "Calendario", icon: <CalendarIcon /> },
  { id: "embudo", label: "Embudo", icon: <ChartIcon /> },
  { id: "pruebas", label: "Pruebas por vencer", icon: <ClockIcon /> },
  { id: "clinicas", label: "Todas las clínicas", icon: <ToothIcon /> },
];

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const me = await requireSuperAdmin();
  const params = await searchParams;
  const clinics = await guard(api<AdminClinic[]>("/admin/clinics"));
  const now = serverNow();
  const today = dayKey(now);
  const thisMonth = today.slice(0, 7);
  const filterHref = (changes: Record<string, string | null>) =>
    `${hrefWith("/admin", params, { ...changes, pagina: null })}#clinicas`;

  // ─── Indicadores ───
  const active = clinics.filter((c) => c.status === "ACTIVE");
  const trials = clinics.filter((c) => c.status === "TRIAL");
  const pastDue = clinics.filter((c) => c.status === "PAST_DUE");
  const suspended = clinics.filter((c) => c.status === "SUSPENDED");
  const revenue = sumPrices(active);
  const newThisMonth = clinics.filter((c) => dayKey(c.createdAt).startsWith(thisMonth)).length;
  const newLastMonth = clinics.filter((c) => dayKey(c.createdAt).startsWith(shiftMonth(thisMonth, -1))).length;
  const newToday = clinics.filter((c) => dayKey(c.createdAt) === today).length;
  const upcoming = trials
    .map((clinic) => ({ clinic, days: trialDaysLeft(clinic.trialEndsAt, now) ?? 0 }))
    .sort((a, b) => a.days - b.days);
  const endingThisWeek = upcoming.filter((t) => t.days <= 7).length;
  const newest = clinics.toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];

  // ─── Calendario ───
  const mesParam = param(params, "mes");
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(mesParam) ? mesParam : thisMonth;

  // ─── Embudo ───
  const byIncome = param(params, "vista") === "ingreso";
  const conversion = clinics.length ? Math.round((active.length / clinics.length) * 100) : 0;
  const stages = [
    { label: "Registradas", list: clinics, estado: null, className: "bg-canvas text-ink", inset: "" },
    {
      label: "En prueba",
      list: trials,
      estado: "TRIAL",
      className: "bg-brand-200 text-ink",
      inset: "sm:ml-[7%] sm:mr-[11%]",
    },
    {
      label: "Activas",
      list: active,
      estado: "ACTIVE",
      className: "bg-night-900 text-white",
      inset: "sm:ml-[14%] sm:mr-[22%]",
    },
  ];

  // ─── Lista ───
  const q = param(params, "q");
  const estado = param(params, "estado");
  const plan = param(params, "plan");
  const filtered = clinics
    .filter((c) => matches(q, c.name, c.city, c.email, c.slug))
    .filter((c) => !estado || c.status === estado)
    .filter((c) => !plan || c.plan === plan);
  const size = pageSizeParam(params, DEFAULT_SIZE);
  const page = paginate(filtered, pageParam(params), size);

  return (
    <div className="min-h-screen">
      <AdminHeader me={me} />

      {/* Menú flotante: salta a cada sección */}
      <nav
        aria-label="Secciones del panel"
        className="fixed top-1/2 left-5 z-20 hidden -translate-y-1/2 flex-col gap-1.5 rounded-full bg-night-900 p-2 shadow-xl shadow-night-900/25 xl:flex"
      >
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            title={s.label}
            aria-label={s.label}
            className="flex size-11 items-center justify-center rounded-full text-night-200 transition-colors hover:bg-white/10 hover:text-brand-200"
          >
            {s.icon}
          </a>
        ))}
      </nav>

      <main className="mx-auto max-w-7xl space-y-4 px-4 pb-12 sm:px-8 xl:pl-28">
        {/* Título e indicadores */}
        <section id="resumen" className="flex scroll-mt-6 flex-wrap items-center gap-x-10 gap-y-6 py-4">
          <h1 className="mr-auto text-4xl leading-[1.05] font-bold tracking-tight">
            Panel de
            <br />
            Dentora
          </h1>
          <Stat
            icon={<ChartIcon />}
            value={money(revenue)}
            badge={`${active.length} ${active.length === 1 ? "activa" : "activas"}`}
            caption={["Ingreso mensual", "estimado"]}
          />
          <Stat
            icon={<UserIcon />}
            value={`+${newThisMonth}`}
            badge={`+${newToday} hoy`}
            dark
            caption={["Nuevas este mes", `${newLastMonth} el mes pasado`]}
          />
          <Stat
            icon={<CalendarIcon />}
            value={String(trials.length)}
            badge={endingThisWeek ? `${endingThisWeek} por vencer` : undefined}
            caption={["Clínicas", "en prueba"]}
          />
        </section>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-12">
          {/* Calendario de altas y vencimientos */}
          <Card id="calendario" title="Altas del mes" className="xl:col-span-4">
            <SignupsCalendar
              month={month}
              today={today}
              signups={groupByDay(clinics, (c) => c.createdAt)}
              expiries={groupByDay(trials, (c) => c.trialEndsAt)}
              prevHref={hrefWith("/admin", params, { mes: shiftMonth(month, -1) })}
              nextHref={hrefWith("/admin", params, { mes: shiftMonth(month, 1) })}
            />
          </Card>

          {/* Embudo: registradas → en prueba → activas */}
          <Card
            id="embudo"
            title="Embudo de clientes"
            className="xl:col-span-5"
            action={
              <div className="flex rounded-full bg-canvas p-1 text-xs font-semibold">
                {[
                  { label: "Clínicas", value: null },
                  { label: "Ingreso", value: "ingreso" },
                ].map((t) => (
                  <Link
                    key={t.label}
                    href={hrefWith("/admin", params, { vista: t.value })}
                    scroll={false}
                    aria-current={(t.value === "ingreso") === byIncome ? "true" : undefined}
                    className={cn(
                      "rounded-full px-3.5 py-1.5",
                      (t.value === "ingreso") === byIncome ? "bg-night-900 text-white" : "text-muted hover:text-ink",
                    )}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            }
          >
            <p className="mt-4 text-4xl font-bold tracking-tight tabular-nums">
              {byIncome ? money(revenue) : `${conversion}%`}
            </p>
            <p className="text-sm text-muted">
              {byIncome ? "Ingreso mensual de las clínicas activas" : "De las clínicas registradas ya pagan"}
            </p>
            <ul className="mt-5 space-y-2.5">
              {stages.map((s) => (
                <li
                  key={s.label}
                  className={cn("flex items-center justify-between rounded-2xl px-4 py-3.5", s.className, s.inset)}
                >
                  <div>
                    <p className="text-sm opacity-80">{s.label}</p>
                    <p className="text-lg font-bold tabular-nums">
                      {byIncome
                        ? `${money(sumPrices(s.list))} al mes`
                        : `${s.list.length} ${s.list.length === 1 ? "clínica" : "clínicas"}`}
                    </p>
                  </div>
                  <Link
                    href={filterHref({ estado: s.estado })}
                    aria-label={`Ver clínicas: ${s.label}`}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full [&_svg]:size-4",
                      s.estado === "ACTIVE" ? "bg-brand-200 text-ink" : "bg-surface text-ink",
                    )}
                  >
                    <ArrowUpRightIcon />
                  </Link>
                </li>
              ))}
            </ul>
            {byIncome && (
              <p className="mt-3 text-xs text-muted">
                En prueba y registradas: lo que pagarían con el plan que eligieron.
              </p>
            )}
          </Card>

          {/* La clínica más reciente */}
          {newest ? (
            <ClinicSpotlight
              clinic={newest}
              label="Clínica más reciente"
              subtitle={[newest.city, `Plan ${plans[newest.plan as PlanKey]?.label ?? newest.plan}`]
                .filter(Boolean)
                .join(", ")}
              note={`Se registró ${ago(newest.createdAt, now)}`}
              withLink
              className="lg:col-span-2 xl:col-span-3"
            />
          ) : null}

          {/* Pruebas por vencer */}
          <Card
            id="pruebas"
            title="Pruebas por vencer"
            className="lg:col-span-2 xl:col-span-9"
            action={
              <Link
                href={filterHref({ estado: "TRIAL" })}
                aria-label="Ver todas las clínicas en prueba"
                className="flex size-10 items-center justify-center rounded-full border border-line hover:bg-canvas"
              >
                <ArrowUpRightIcon />
              </Link>
            }
          >
            {upcoming.length === 0 ? (
              <p className="mt-6 rounded-2xl bg-canvas px-5 py-10 text-center text-sm text-muted">
                No hay clínicas en prueba ahora.
              </p>
            ) : (
              <ul className="mt-5 flex snap-x gap-3 overflow-x-auto pb-2">
                {upcoming.slice(0, 8).map(({ clinic: c, days }, i) => (
                  <TrialCard key={c.id} clinic={c} days={days} featured={i === 0} />
                ))}
              </ul>
            )}
          </Card>

          {/* Planes y alertas */}
          <Card title="Planes" className="lg:col-span-2 xl:col-span-3">
            <ul className="mt-3 divide-y divide-line">
              {(Object.entries(plans) as [PlanKey, (typeof plans)[PlanKey]][]).map(([key, p]) => {
                const paying = active.filter((c) => c.plan === key).length;
                const total = clinics.filter((c) => c.plan === key).length;
                return (
                  <InfoRow
                    key={key}
                    icon={<CashIcon />}
                    label={`${p.label} · $${p.price}/mes`}
                    value={`${paying} ${paying === 1 ? "paga" : "pagan"} de ${total}`}
                    href={filterHref({ plan: key, estado: null })}
                  />
                );
              })}
              <InfoRow
                icon={<AlertTriangleIcon />}
                label="Pago atrasado"
                value={`${pastDue.length} ${pastDue.length === 1 ? "clínica" : "clínicas"}`}
                href={filterHref({ estado: "PAST_DUE", plan: null })}
                alert={pastDue.length > 0}
              />
              <InfoRow
                icon={<AlertTriangleIcon />}
                label="Suspendidas"
                value={`${suspended.length} ${suspended.length === 1 ? "clínica" : "clínicas"}`}
                href={filterHref({ estado: "SUSPENDED", plan: null })}
                alert={suspended.length > 0}
              />
            </ul>
          </Card>
        </div>

        {/* Todas las clínicas */}
        <section id="clinicas" className="scroll-mt-6 rounded-[28px] bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">Todas las clínicas</h2>
            <p className="text-sm text-muted">
              {clinics.length} {clinics.length === 1 ? "registrada" : "registradas"}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <SearchInput placeholder="Clínica, ciudad o correo" />
            <FilterSelect
              param="estado"
              label="Estado"
              options={Object.entries(clinicStatus).map(([value, { label }]) => ({ value, label }))}
            />
            <FilterSelect
              param="plan"
              label="Plan"
              options={Object.entries(plans).map(([value, { label }]) => ({ value, label }))}
            />
            <ClearFilters params={["q", "estado", "plan"]} />
          </div>

          {/* Toda la fila abre la ficha */}
          <div className="-mx-5 mt-4 overflow-x-auto sm:-mx-6">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium sm:px-6">Clínica</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Prueba</th>
                  <th className="px-4 py-3 font-medium">Uso</th>
                  <th className="px-4 py-3 font-medium">Última actividad</th>
                  <th className="px-5 py-3 font-medium sm:px-6">Alta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {page.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted">
                      Ninguna clínica coincide con la búsqueda.
                    </td>
                  </tr>
                )}
                {page.items.map((c) => (
                  <ClinicRow key={c.id} clinic={c} now={now} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <Pagination
          info={page}
          pathname="/admin"
          params={params}
          noun="clínicas"
          size={size}
          defaultSize={DEFAULT_SIZE}
        />
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
      <span className="flex size-14 items-center justify-center rounded-full bg-surface text-ink">{icon}</span>
      <div>
        <p className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight tabular-nums">{value}</span>
          {badge && (
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                dark ? "bg-night-900 text-brand-200" : "bg-brand-200 text-ink",
              )}
            >
              {badge}
            </span>
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

function Card({
  id,
  title,
  action,
  className,
  children,
}: {
  id?: string;
  title: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("scroll-mt-6 rounded-[28px] bg-surface p-5 sm:p-6", className)}>
      <div className="flex min-h-10 items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Una prueba en el carrusel. La primera (la más urgente) va destacada. */
function TrialCard({ clinic: c, days, featured }: { clinic: AdminClinic; days: number; featured: boolean }) {
  const whatsapp = whatsappLink(c.whatsapp ?? c.phone);
  const left = days > 0 ? daysText(days) : days === 0 ? "Hoy" : "Vencida";
  return (
    <li
      className={cn(
        "relative flex min-h-56 shrink-0 snap-start flex-col rounded-3xl p-5 transition-colors",
        featured ? "w-72 bg-brand-200 text-ink" : "w-44 bg-canvas hover:bg-line/60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs opacity-70">
          {c.trialEndsAt ? `${days < 0 ? "Venció" : "Vence"} el ${shortDate.format(new Date(c.trialEndsAt))}` : ""}
        </p>
        {featured && whatsapp && (
          <a
            href={`${whatsapp}?text=${encodeURIComponent(`Hola, te escribo de Dentora sobre la prueba de ${c.name}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Escribir a ${c.name} por WhatsApp`}
            className="relative z-10 -mt-1 -mr-1 flex size-9 items-center justify-center rounded-full bg-white/50 hover:bg-white/80 [&_svg]:size-4"
          >
            <WhatsappIcon />
          </a>
        )}
      </div>
      <Link
        href={`/admin/clinicas/${c.id}`}
        className={cn("mt-1 font-bold leading-snug after:absolute after:inset-0", featured ? "text-xl" : "text-base")}
      >
        {c.name}
      </Link>
      <div className="mt-auto flex items-end justify-between gap-2 pt-6">
        <div>
          <p
            className={cn(
              "font-bold tracking-tight tabular-nums",
              featured ? "text-5xl" : "text-2xl",
              days < 0 && "text-red-600",
            )}
          >
            {left}
          </p>
          <p className="text-xs opacity-70">
            {c._count.patients} {c._count.patients === 1 ? "paciente" : "pacientes"}
          </p>
        </div>
        <ClinicAvatar clinic={c} className="size-8 rounded-full text-[11px] ring-2 ring-surface" />
      </div>
    </li>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
  alert,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href: string;
  alert?: boolean;
}) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full [&_svg]:size-[18px]",
          alert ? "bg-red-50 text-red-600" : "bg-canvas text-muted",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{label}</p>
        <p className={cn("font-semibold", alert && "text-red-600")}>{value}</p>
      </div>
      <Link
        href={href}
        aria-label={`Ver clínicas: ${label}`}
        className="flex size-8 items-center justify-center rounded-full border border-line text-muted hover:bg-canvas hover:text-ink [&_svg]:size-4"
      >
        <ArrowUpRightIcon />
      </Link>
    </li>
  );
}

function ClinicRow({ clinic: c, now }: { clinic: AdminClinic; now: number }) {
  const status = clinicStatus[c.status];
  const days = c.status === "TRIAL" ? trialDaysLeft(c.trialEndsAt, now) : null;
  const idle = !c.lastActivityAt || now - Date.parse(c.lastActivityAt) > 14 * 864e5;
  return (
    <tr className="relative transition-colors hover:bg-canvas/70">
      <td className="px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <ClinicAvatar clinic={c} />
          <div className="min-w-0">
            {/* El enlace se extiende a toda la fila */}
            <Link
              href={`/admin/clinicas/${c.id}`}
              className="font-semibold after:absolute after:inset-0 hover:text-brand-600"
            >
              {c.name}
            </Link>
            <p className="truncate text-xs text-muted">{[c.city, c.email].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", status.className)}>{status.label}</span>
          <span className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-muted">
            {plans[c.plan as PlanKey]?.label ?? c.plan}
          </span>
        </div>
      </td>
      <td className="px-4 py-4">
        {days === null ? (
          <span className="text-muted">—</span>
        ) : (
          <div className="w-32">
            <p
              className={cn(
                "text-xs font-medium",
                days < 0 ? "text-red-600" : days <= 3 ? "text-amber-700" : "text-muted",
              )}
            >
              {days > 0 ? `Quedan ${daysText(days)}` : days === 0 ? "Vence hoy" : "Vencida"}
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas">
              <div
                className={cn("h-full rounded-full", days <= 3 ? "bg-amber-500" : "bg-brand-500")}
                style={{ width: `${trialLeftPercent(c.createdAt, c.trialEndsAt, now)}%` }}
              />
            </div>
          </div>
        )}
      </td>
      <td className="px-4 py-4 text-muted tabular-nums">
        <span className="font-semibold text-ink">{c._count.patients}</span> pacientes ·{" "}
        <span className="font-semibold text-ink">{c._count.appointments}</span> citas
      </td>
      <td className="px-4 py-4">
        <span className={cn("flex items-center gap-2", idle ? "text-muted" : "text-ink")}>
          <span aria-hidden className={cn("size-2 rounded-full", idle ? "bg-line" : "bg-green-500")} />
          {c.lastActivityAt ? ago(c.lastActivityAt, now) : "Sin actividad"}
        </span>
      </td>
      <td className="px-5 py-4 text-muted sm:px-6">{shortDate.format(new Date(c.createdAt))}</td>
    </tr>
  );
}
