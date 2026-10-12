import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { initials } from "@/lib/labels";
import { brandVars, loadPublicClinic } from "@/lib/public-clinic";

/** Encabezado, pie y colores de marca compartidos por la landing y la reserva de la clínica. */
export default async function ClinicSiteLayout({ children, params }: LayoutProps<"/[slug]">) {
  const { slug } = await params;
  const { clinic } = await loadPublicClinic(slug);
  const logo = clinic.logoUrl?.startsWith("https://") ? clinic.logoUrl : null;
  const base = `/${clinic.slug}`;

  return (
    <div style={brandVars(clinic.primaryColor)} className="flex min-h-screen flex-col overflow-x-clip">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link href={base} className="flex min-w-0 flex-1 items-center gap-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- logo externo configurado por la clínica
              <img src={logo} alt="" className="size-10 rounded-xl object-contain" />
            ) : (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white">
                {initials(clinic.name)}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate font-bold tracking-tight">{clinic.name}</span>
              {clinic.city && <span className="block text-xs text-muted">{clinic.city}</span>}
            </span>
          </Link>
          <ThemeToggle className="size-10 bg-canvas" />
          <Link
            href={`${base}/reservar`}
            className="inline-flex h-10 items-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Reservar<span className="hidden sm:inline">&nbsp;cita</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4">{children}</main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        Reservas con <span className="font-semibold text-ink">dentora</span>
      </footer>
    </div>
  );
}
