import type { Metadata } from "next";
import Link from "next/link";
import { formatDuration, formatPrice } from "@/lib/format";
import { initials } from "@/lib/labels";
import { loadPublicClinic } from "@/lib/public-clinic";

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { clinic } = await loadPublicClinic((await params).slug);
  return {
    title: { absolute: `${clinic.name}${clinic.city ? ` · Odontología en ${clinic.city}` : ""}` },
    description: clinic.description ?? `Reserva tu cita en ${clinic.name} en menos de un minuto.`,
  };
}

const HOW_IT_WORKS = [
  { title: "Elige el tratamiento", text: "Limpieza, valoración, ortodoncia y más." },
  { title: "Escoge día y hora", text: "Solo ves los horarios realmente libres." },
  { title: "Confirma tus datos", text: "Recibe la confirmación al instante." },
];

/** Landing de la clínica: presentación, servicios, equipo y contacto. */
export default async function ClinicLandingPage({ params }: PageProps<"/[slug]">) {
  const { clinic, doctors, treatments } = await loadPublicClinic((await params).slug);
  const base = `/${clinic.slug}`;
  const services = treatments.filter((t) => t.doctorIds.length > 0);
  const location = [clinic.address, clinic.city].filter(Boolean).join(", ");
  const mapsUrl = location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clinic.name}, ${location}`)}`
    : null;
  const whatsapp = clinic.whatsapp ? `https://wa.me/${clinic.whatsapp}` : null;

  return (
    <>
      <section className="grid items-center gap-8 py-10 sm:py-16 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div>
          <p className="mb-3 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Reserva online · Sin llamadas
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{clinic.name}</h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            {clinic.description ?? "Cuidamos tu sonrisa con atención cercana y profesional. Reserva tu cita en menos de un minuto."}
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Link
              href={`${base}/reservar`}
              className="inline-flex h-12 items-center rounded-xl bg-brand-500 px-6 font-semibold text-white shadow-lg shadow-black/10 transition-colors hover:bg-brand-600"
            >
              Reservar mi cita
            </Link>
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center rounded-xl border border-line bg-surface px-6 font-semibold transition-colors hover:bg-canvas"
              >
                Escribir por WhatsApp
              </a>
            )}
          </div>
        </div>

        <ol className="space-y-3 rounded-3xl bg-surface p-6">
          <li className="mb-1 text-sm font-semibold text-muted">Reserva en 3 pasos</li>
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                {i + 1}
              </span>
              <span>
                <span className="block font-semibold">{step.title}</span>
                <span className="block text-sm text-muted">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {services.length > 0 && (
        <section className="pb-14">
          <SectionTitle title="Servicios" subtitle="Precios de referencia. El costo final se confirma en la consulta." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((t) => (
              <article key={t.id} className="flex flex-col rounded-3xl bg-surface p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{t.name}</h3>
                  {t.price !== null && (
                    <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-sm font-semibold text-brand-700">
                      {formatPrice(t.price)}
                    </span>
                  )}
                </div>
                {t.description && <p className="mt-2 text-sm text-muted">{t.description}</p>}
                <div className="mt-auto flex items-center justify-between pt-5 text-sm">
                  <span className="text-muted">{formatDuration(t.durationMin)}</span>
                  <Link href={`${base}/reservar?tratamiento=${t.id}`} className="font-semibold text-brand-600 hover:underline">
                    Reservar →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {doctors.length > 0 && (
        <section className="pb-14">
          <SectionTitle title="Nuestro equipo" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((d) => (
              <article key={d.id} className="rounded-3xl bg-surface p-6">
                <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-lg font-bold text-brand-700">
                  {initials(d.fullName)}
                </span>
                <h3 className="mt-4 font-semibold">{d.fullName}</h3>
                <p className="text-sm text-brand-600">{d.specialty ?? "Odontología"}</p>
                {d.bio && <p className="mt-2 text-sm text-muted">{d.bio}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mb-14 flex flex-col items-start gap-4 rounded-3xl bg-brand-500 p-8 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">¿Listo para tu cita?</h2>
          <p className="mt-1 text-white/85">Elige el día y la hora que mejor te quede. Toma menos de un minuto.</p>
        </div>
        <Link
          href={`${base}/reservar`}
          className="inline-flex h-12 shrink-0 items-center rounded-xl bg-white px-6 font-semibold text-ink transition-opacity hover:opacity-90"
        >
          Reservar ahora
        </Link>
      </section>

      {(location || clinic.phone || clinic.email || whatsapp) && (
        <section className="pb-14">
          <SectionTitle title="Contacto" />
          <div className="grid gap-5 rounded-3xl bg-surface p-6 sm:grid-cols-2">
            {location && (
              <Info label="Dirección">
                {location}
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm font-semibold text-brand-600 hover:underline">
                    Ver en Google Maps
                  </a>
                )}
              </Info>
            )}
            {clinic.phone && (
              <Info label="Teléfono">
                <a href={`tel:${clinic.phone}`} className="hover:underline">
                  {clinic.phone}
                </a>
              </Info>
            )}
            {whatsapp && (
              <Info label="WhatsApp">
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  Escríbenos
                </a>
              </Info>
            )}
            {clinic.email && (
              <Info label="Correo">
                <a href={`mailto:${clinic.email}`} className="break-all hover:underline">
                  {clinic.email}
                </a>
              </Info>
            )}
          </div>
        </section>
      )}
    </>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <div className="mt-0.5 font-medium">{children}</div>
    </div>
  );
}
