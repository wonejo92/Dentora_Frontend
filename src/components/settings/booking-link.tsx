"use client";

import { useState } from "react";

/** Enlaces públicos de la clínica, con botones para copiarlos y abrirlos. */
export function BookingLink({ siteUrl }: { siteUrl: string }) {
  const bookingUrl = `${siteUrl}/reservar`;
  return (
    <section className="space-y-4 rounded-3xl bg-night-900 p-6 text-white">
      <div>
        <p className="font-semibold">Tu web de reservas</p>
        <p className="mt-0.5 text-sm text-night-200">
          Compártela en WhatsApp, Instagram o Google Maps para que tus pacientes reserven solos.
        </p>
      </div>
      <LinkRow label="Web de la clínica" hint="Presentación, servicios, equipo y contacto." url={siteUrl} />
      <LinkRow label="Enlace directo para reservar" hint="Ideal para WhatsApp: abre directo la reserva." url={bookingUrl} />
    </section>
  );
}

function LinkRow({ label, hint, url }: { label: string; hint: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-night-800/60 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-night-300">{hint}</p>
        <p className="mt-1 truncate font-mono text-sm text-night-200">{url}</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={copy}
          className="h-9 rounded-xl bg-white px-3.5 text-sm font-semibold text-night-900 transition-colors hover:bg-night-200"
        >
          {copied ? "✓ Copiado" : "Copiar"}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center rounded-xl border border-night-700 px-3.5 text-sm font-semibold transition-colors hover:bg-night-800"
        >
          Abrir
        </a>
      </div>
    </div>
  );
}
