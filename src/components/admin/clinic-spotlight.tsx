import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowUpRightIcon,
  ClipboardIcon,
  MailIcon,
  PhoneIcon,
  WhatsappIcon,
  WorldIcon,
} from "@/components/panel/icons";
import { cn } from "@/lib/cn";
import { whatsappLink } from "@/lib/format";
import { ClinicAvatar } from "./clinic-avatar";

interface SpotlightClinic {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  primaryColor: string;
}

const button = "flex size-11 items-center justify-center rounded-2xl bg-white text-night-900 hover:bg-brand-50";

/**
 * Tarjeta grande sobre el color de marca de la clínica, con accesos directos
 * para contactarla. En el panel lleva a la ficha; en la ficha, muestra el teléfono.
 */
export function ClinicSpotlight({
  clinic: c,
  label,
  subtitle,
  note,
  email = c.email,
  withLink,
  className,
}: {
  clinic: SpotlightClinic;
  label: string;
  subtitle: string;
  note?: ReactNode;
  /** Correo al que escribir (por defecto, el de la clínica). */
  email?: string | null;
  /** Muestra los accesos a la ficha (en el panel). */
  withLink?: boolean;
  className?: string;
}) {
  const whatsapp = whatsappLink(c.whatsapp ?? c.phone);
  return (
    <section
      className={cn("relative flex min-h-80 flex-col overflow-hidden rounded-[28px] p-5 text-white", className)}
      style={{ backgroundColor: c.primaryColor }}
    >
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/15 to-black/60" />
      <div className="relative flex items-center justify-between">
        <span className="rounded-full bg-black/25 px-3 py-1.5 text-xs font-semibold backdrop-blur">{label}</span>
        {withLink && (
          <Link
            href={`/admin/clinicas/${c.id}`}
            aria-label={`Ver ficha de ${c.name}`}
            className="flex size-10 items-center justify-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25"
          >
            <ArrowUpRightIcon />
          </Link>
        )}
      </div>
      <div className="relative my-auto py-6 text-center">
        <ClinicAvatar
          clinic={{ ...c, primaryColor: "rgb(255 255 255 / 0.18)" }}
          className="mx-auto size-20 rounded-full text-2xl ring-4 ring-white/25"
        />
        <h2 className="mt-4 text-xl font-bold">{c.name}</h2>
        <p className="mt-0.5 text-sm text-white/80">{subtitle}</p>
        {note && <p className="text-xs text-white/70">{note}</p>}
      </div>
      <div className="relative flex justify-center gap-2">
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Escribir por WhatsApp"
            title="WhatsApp"
            className={button}
          >
            <WhatsappIcon />
          </a>
        )}
        {email && (
          <a href={`mailto:${email}`} aria-label="Enviar correo" title="Correo" className={button}>
            <MailIcon />
          </a>
        )}
        {!withLink && c.phone && (
          <a href={`tel:${c.phone}`} aria-label="Llamar" title="Llamar" className={button}>
            <PhoneIcon />
          </a>
        )}
        <a
          href={`/${c.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ver su página"
          title="Ver su página"
          className={button}
        >
          <WorldIcon />
        </a>
        {withLink && (
          <Link
            href={`/admin/clinicas/${c.id}`}
            aria-label="Ver ficha"
            title="Ver ficha"
            className="flex size-11 items-center justify-center rounded-2xl bg-night-900 text-brand-200 hover:bg-night-800"
          >
            <ClipboardIcon />
          </Link>
        )}
      </div>
    </section>
  );
}
