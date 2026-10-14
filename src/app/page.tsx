import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import Link from "next/link";
import { DemoForm } from "@/components/landing/demo-form";
import { GlassTooth } from "@/components/landing/glass-tooth";
import { DashboardMockup, PhoneBookingMockup, ToothGlyph } from "@/components/landing/mockups";
import { PlanCalculator } from "@/components/landing/plan-calculator";
import { Tooth3D } from "@/components/landing/tooth-3d";
import {
  CalendarCheckIcon,
  CashIcon,
  ChartIcon,
  ClipboardIcon,
  ShieldLockIcon,
  WhatsappIcon,
  WorldIcon,
} from "@/components/panel/icons";
import { cn } from "@/lib/cn";
import { whatsappLink } from "@/lib/format";
import { getSessionToken } from "@/lib/session";

/** Serif de los títulos: le da a la landing un tono sobrio y clínico. */
const serif = Newsreader({ subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export const metadata: Metadata = {
  title: { absolute: "Dentora · Software para clínicas dentales en Ecuador" },
  description:
    "Agenda, reservas online, historia clínica, presupuestos y caja para tu clínica dental. Prueba gratis 14 días, sin tarjeta.",
  openGraph: {
    title: "Dentora · Software para clínicas dentales",
    description: "Agenda, reservas online, historia clínica, presupuestos y caja en un solo lugar.",
    locale: "es_EC",
    type: "website",
  },
};

const FEATURES = [
  {
    icon: <CalendarCheckIcon />,
    title: "Agenda sin cruces",
    text: "Horarios por doctor, feriados y vacaciones. Nunca dos pacientes a la misma hora con el mismo doctor.",
  },
  {
    icon: <WorldIcon />,
    title: "Reservas online",
    text: "Tu clínica tiene su propia web, donde los pacientes eligen tratamiento, doctor y horario a cualquier hora.",
  },
  {
    icon: <ClipboardIcon />,
    title: "Historia clínica",
    text: "Antecedentes, alertas de alergias y evoluciones con diagnósticos CIE-10, visibles solo para quien debe verlas.",
  },
  {
    icon: <CashIcon />,
    title: "Presupuestos y caja",
    text: "Presupuestos en PDF, abonos con recibo numerado y lo cobrado cada día por método de pago.",
  },
  {
    icon: <ChartIcon />,
    title: "Reportes",
    text: "Ingresos, inasistencias, pacientes nuevos y tratamientos más agendados, comparados con el mes anterior.",
  },
  {
    icon: <ShieldLockIcon />,
    title: "Datos protegidos",
    text: "Cada clínica ve solo lo suyo, con permisos para dueño, doctores y recepción. Pensado para la LOPDP.",
  },
];

const PLANS = [
  {
    name: "Básico",
    price: 19,
    tagline: "Para el consultorio de un doctor.",
    features: ["1 doctor", "Agenda y reservas online", "Web propia de tu clínica", "Pacientes ilimitados"],
  },
  {
    name: "Pro",
    price: 39,
    tagline: "Para clínicas con varios doctores.",
    highlight: true,
    features: [
      "Hasta 5 doctores",
      "Todo lo del plan Básico",
      "Historia clínica con CIE-10",
      "Presupuestos, pagos y caja",
      "Usuarios de recepción",
    ],
  },
  {
    name: "Clínica",
    price: 69,
    tagline: "Para equipos grandes.",
    features: ["Doctores ilimitados", "Todo lo del plan Pro", "Reportes del negocio", "Soporte prioritario"],
  },
];

const STEPS = [
  { title: "Crea tu cuenta", text: "Registra tu clínica con tu correo. Te enviamos un código para confirmarlo." },
  { title: "Configura tu agenda", text: "Agrega tus tratamientos, tus doctores y los horarios en que atienden." },
  { title: "Comparte tu enlace", text: "Envía la web de reservas a tus pacientes por WhatsApp o redes sociales." },
];

const FAQ = [
  {
    q: "¿Tengo que instalar algo?",
    a: "No. Dentora funciona en el navegador de tu computador, tablet o celular. Entras con tu correo y tu contraseña.",
  },
  {
    q: "¿Cómo funciona la prueba gratis?",
    a: "Tienes 14 días con todas las funciones, sin tarjeta de crédito. Al terminar, te contactamos para activar el plan que prefieras.",
  },
  {
    q: "¿Están seguros los datos de mis pacientes?",
    a: "Cada clínica tiene sus datos aislados, las contraseñas se guardan cifradas y la historia clínica solo la ven el dueño y los doctores.",
  },
  {
    q: "¿Mis pacientes pueden reservar solos?",
    a: "Sí. Reservan en tu web propia, solo en los horarios libres de cada doctor, sin llamar ni escribir.",
  },
  {
    q: "¿Emite facturas electrónicas del SRI?",
    a: "Todavía no. La facturación electrónica, el odontograma y los recordatorios por WhatsApp están en camino.",
  },
];

export default async function LandingPage() {
  const loggedIn = !!(await getSessionToken());
  const whatsapp = whatsappLink(process.env.CONTACT_WHATSAPP ?? null);
  const whatsappBase = whatsapp;
  const whatsappHref = whatsapp
    ? `${whatsapp}?text=${encodeURIComponent("Hola, quiero saber más sobre Dentora para mi clínica.")}`
    : null;
  const email = process.env.CONTACT_EMAIL;
  const title = cn(serif.className, "font-normal tracking-[-0.02em] text-ink");

  return (
    <div className="bg-canvas text-ink">
      {/* ─── Barra superior ─── */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-night-900">
            <ToothGlyph className="size-5 text-white" />
          </span>
          <span className="text-xl font-bold tracking-tight">dentora</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm text-muted md:flex">
          <a href="#funciones" className="hover:text-ink">
            Funciones
          </a>
          <a href="#precios" className="hover:text-ink">
            Precios
          </a>
          <a href="#preguntas" className="hover:text-ink">
            Preguntas
          </a>
        </div>
        <div className="flex items-center gap-1">
          {!loggedIn && (
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-semibold hover:bg-black/5 sm:block"
            >
              Iniciar sesión
            </Link>
          )}
          <Link
            href={loggedIn ? "/panel" : "/registro"}
            className="rounded-full bg-night-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-night-800"
          >
            {loggedIn ? "Ir a mi panel" : "Prueba gratis"}
          </Link>
        </div>
      </nav>

      {/* ─── Portada: el diente de cristal es el elemento central ─── */}
      <header className="relative overflow-hidden">
        {/* "dentora" gigante y tenue de fondo */}
        <p
          aria-hidden
          className={cn(
            serif.className,
            "pointer-events-none absolute inset-x-0 -bottom-[0.18em] text-center text-[24vw] leading-none tracking-[-0.05em] text-brand-500/[0.05] select-none lg:text-[17rem]",
          )}
        >
          dentora
        </p>

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pt-8 pb-20 sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-6 lg:pt-12 lg:pb-32">
          <h1 className={cn(title, "text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[3.4rem] xl:text-[3.9rem]")}>
            Cada sonrisa empieza con una agenda en orden
          </h1>

          <Tooth3D className="landing-rise mx-auto w-64 sm:w-80 lg:w-[23rem] xl:w-[26rem]" />

          <div className="lg:pl-6">
            <p className={cn(serif.className, "text-3xl leading-tight text-ink sm:text-[2.1rem]")}>
              El sistema para tu clínica dental
            </p>
            <p className="mt-4 leading-relaxed text-muted">
              Citas, reservas online, historia clínica, presupuestos y caja en un solo lugar. Menos llamadas y
              cuadernos, más tiempo para tus pacientes.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href={loggedIn ? "/panel" : "/registro"}
                className="rounded-full bg-night-900 px-6 py-3.5 text-sm font-semibold text-white hover:bg-night-800"
              >
                {loggedIn ? "Ir a mi panel" : "Empieza tu prueba de 14 días"}
              </Link>
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-night-900"
                >
                  <WhatsappIcon /> WhatsApp
                </a>
              )}
            </div>
            <p className="mt-3 text-sm text-muted">Sin tarjeta de crédito.</p>
          </div>
        </div>
      </header>

      {/* Hechos clave, separados por líneas finas */}
      <div className="border-y border-line">
        <dl className="mx-auto grid max-w-6xl divide-line px-5 sm:grid-cols-3 sm:divide-x sm:px-8">
          {[
            ["Hecho en Ecuador", "Cédula, RUC, dólares y la hora de tu ciudad."],
            ["Pensado para la LOPDP", "Consentimiento del paciente y datos aislados."],
            ["Diagnósticos CIE-10", "La misma clasificación de los formularios del MSP."],
          ].map(([term, desc]) => (
            <div key={term} className="py-6 sm:px-8 sm:first:pl-0">
              <dt className="font-semibold">{term}</dt>
              <dd className="mt-1 text-sm text-muted">{desc}</dd>
            </div>
          ))}
        </dl>
      </div>

      <main>
        {/* ─── Así se ve el panel ─── */}
        <section className="mx-auto max-w-6xl px-5 pt-24 sm:px-8">
          <div className="grid items-end gap-6 lg:grid-cols-2">
            <h2 className={cn(title, "text-4xl leading-tight sm:text-5xl")}>Todo tu día, de un vistazo</h2>
            <p className="text-lg leading-relaxed text-muted lg:pb-2">
              Al abrir Dentora ves las citas de hoy, la próxima consulta, lo que falta confirmar y cómo va el mes.
            </p>
          </div>
          <div className="relative mt-12">
            <div aria-hidden className="absolute inset-x-8 -bottom-6 top-12 rounded-[2rem] bg-night-900" />
            <DashboardMockup className="relative" />
          </div>
        </section>

        {/* ─── Funciones ─── */}
        <section id="funciones" className="mx-auto max-w-6xl scroll-mt-6 px-5 py-24 sm:px-8">
          <div className="max-w-2xl">
            <h2 className={cn(title, "text-4xl leading-tight sm:text-5xl")}>Todo el consultorio en un solo lugar</h2>
            <p className="mt-4 text-lg text-muted">Pensado con dentistas para el trabajo de cada día.</p>
          </div>
          {/* Al pasar el mouse (o con el teclado) la tarjeta se ensancha y muestra su descripción. */}
          <div className="mt-14 flex flex-col gap-3 lg:h-[23rem] lg:flex-row">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                tabIndex={0}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[1.75rem] bg-night-900 p-6 text-white lg:p-5 xl:p-6 transition-[flex-grow] duration-500 ease-out focus-visible:ring-4 focus-visible:ring-brand-200 focus-visible:outline-none lg:min-w-0 lg:flex-1 lg:hover:flex-[2.4] lg:focus-within:flex-[2.4] lg:focus:flex-[2.4]"
              >
                <GlassTooth className="pointer-events-none absolute -right-10 -bottom-12 w-36 opacity-20 transition-opacity duration-500 group-hover:opacity-35" />
                <span className="relative flex size-11 items-center justify-center rounded-2xl bg-white/10 text-brand-200">
                  {f.icon}
                </span>
                <div className="relative mt-6 lg:mt-0">
                  <h3 className={cn(serif.className, "text-2xl leading-tight lg:text-xl xl:text-2xl")}>{f.title}</h3>
                  <p className="mt-2 max-w-[24rem] text-sm leading-relaxed text-night-200 lg:max-h-0 lg:opacity-0 lg:transition-all lg:duration-500 lg:group-hover:max-h-40 lg:group-hover:opacity-100 lg:group-focus:max-h-40 lg:group-focus:opacity-100">
                    {f.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ─── Web de reservas ─── */}
        <section className="bg-night-900 text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <h2 className={cn(serif.className, "text-4xl leading-tight font-normal tracking-[-0.02em] sm:text-5xl")}>
                Tus pacientes reservan desde el celular, a cualquier hora
              </h2>
              <p className="mt-5 max-w-[32rem] text-lg leading-relaxed text-night-200">
                Cada clínica recibe su propia página, con su logo y sus colores. Los pacientes eligen el tratamiento y
                el horario libre del doctor que prefieren. Tú solo confirmas.
              </p>
              <ul className="mt-8 max-w-[32rem] divide-y divide-white/10 border-y border-white/10 text-sm">
                {[
                  "Solo ofrece horarios realmente disponibles",
                  "Registra al paciente con su consentimiento de datos",
                  "Te avisa en el panel cuando llega una reserva",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-3 py-3.5">
                    <Check className="text-brand-200" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center lg:justify-end">
              <PhoneBookingMockup />
            </div>
          </div>
        </section>

        {/* ─── Cómo empezar (es un proceso: aquí la numeración sí aporta) ─── */}
        <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <h2 className={cn(title, "max-w-2xl text-4xl leading-tight sm:text-5xl")}>Tu clínica en línea hoy mismo</h2>
          <ol className="mt-14 grid gap-10 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="border-t border-ink/80 pt-6">
                <span className={cn(serif.className, "text-5xl text-brand-500")}>{i + 1}</span>
                <h3 className="mt-3 font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ─── Precios ─── */}
        <section id="precios" className="scroll-mt-6 border-t border-line bg-surface py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <h2 className={cn(title, "text-4xl leading-tight sm:text-5xl")}>Planes simples, sin contratos</h2>
              <p className="mt-4 text-lg text-muted">
                Precios mensuales en dólares. Cualquier plan empieza con 14 días gratis.
              </p>
            </div>
            <div className="mt-12">
              <PlanCalculator serifClass={serif.className} />
            </div>
            <p className="mt-16 mb-6 font-semibold">O compara los planes</p>
            <div className="grid items-stretch gap-6 md:grid-cols-3">
              {PLANS.map((p) => (
                <article
                  key={p.name}
                  className={cn(
                    "flex flex-col rounded-[1.75rem] p-8",
                    p.highlight ? "bg-night-900 text-white" : "border border-line",
                  )}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-lg font-semibold">{p.name}</h3>
                    {p.highlight && <span className="text-xs text-brand-200">El más elegido</span>}
                  </div>
                  <p className={cn("mt-1 text-sm", p.highlight ? "text-night-200" : "text-muted")}>{p.tagline}</p>
                  <p className="mt-8 flex items-baseline gap-1.5">
                    <span className={cn(serif.className, "text-6xl tracking-[-0.03em]")}>${p.price}</span>
                    <span className={cn("text-sm", p.highlight ? "text-night-200" : "text-muted")}>al mes</span>
                  </p>
                  <ul
                    className={cn(
                      "mt-8 flex-1 divide-y text-sm",
                      p.highlight ? "divide-white/10 border-y border-white/10" : "divide-line border-y border-line",
                    )}
                  >
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 py-3">
                        <Check className={p.highlight ? "text-brand-200" : "text-brand-500"} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/registro"
                    className={cn(
                      "mt-8 rounded-full py-3 text-center text-sm font-semibold transition-colors",
                      p.highlight
                        ? "bg-white text-night-900 hover:bg-brand-50"
                        : "bg-night-900 text-white hover:bg-night-800",
                    )}
                  >
                    Probar gratis
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Preguntas frecuentes ─── */}
        <section
          id="preguntas"
          className="mx-auto grid max-w-6xl scroll-mt-6 gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[1fr_1.6fr]"
        >
          <h2 className={cn(title, "text-4xl leading-tight sm:text-5xl")}>Preguntas frecuentes</h2>
          <div className="divide-y divide-line border-y border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-medium">
                  {f.q}
                  <span
                    aria-hidden
                    className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line text-brand-500 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-[38rem] leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ─── Cierre: pedir una demo ─── */}
        <section className="bg-night-900 text-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:items-end">
            <div>
              <h2 className={cn(serif.className, "text-4xl leading-tight font-normal tracking-[-0.02em] sm:text-5xl")}>
                Te mostramos Dentora con tu clínica
              </h2>
              <p className="mt-5 max-w-[30rem] text-lg leading-relaxed text-night-200">
                Cuéntanos de tu consultorio y agendamos una demo. O empieza solo: tu prueba de 14 días está a dos
                minutos.
              </p>
              <Link
                href="/registro"
                className="mt-7 inline-block text-sm font-semibold text-brand-200 underline-offset-4 hover:underline"
              >
                Crear mi cuenta ahora
              </Link>
            </div>
            {whatsappBase || email ? (
              <DemoForm whatsappBase={whatsappBase} email={email} />
            ) : (
              <Link
                href="/registro"
                className="justify-self-start rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#073b49] hover:bg-brand-50"
              >
                Empieza tu prueba de 14 días
              </Link>
            )}
          </div>
        </section>
      </main>

      <footer className="overflow-hidden border-t border-white/10 bg-night-900 text-night-200">
        <div className="mx-auto max-w-6xl px-5 pt-12 sm:px-8">
          <div className="flex flex-col gap-6 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p>Software para clínicas dentales, hecho en Ecuador.</p>
            <nav className="flex gap-6">
              <Link href="/login" className="hover:text-white">
                Iniciar sesión
              </Link>
              <Link href="/registro" className="hover:text-white">
                Prueba gratis
              </Link>
              {email && (
                <a href={`mailto:${email}`} className="hover:text-white">
                  Contacto
                </a>
              )}
            </nav>
          </div>
          {/* Logo gigante de cierre */}
          <p
            aria-hidden
            className={cn(
              serif.className,
              "mt-10 -mb-[0.22em] flex items-center gap-[0.12em] text-[22vw] leading-none tracking-[-0.05em] text-white lg:text-[15rem]",
            )}
          >
            <ToothGlyph className="size-[0.6em] shrink-0 text-brand-200" />
            dentora
          </p>
        </div>
      </footer>
    </div>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}
