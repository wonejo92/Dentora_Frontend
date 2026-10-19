"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { dismissOnboarding, markLinkShared } from "@/app/actions/onboarding";
import { START_TOUR_EVENT } from "./panel-tour";

/** Copia el enlace de reservas y marca el paso como hecho. */
export function CopyBookingLink({ url }: { url: string }) {
  const [pending, startTransition] = useTransition();
  const copy = () =>
    startTransition(async () => {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado", { description: "Pégalo en WhatsApp o en tus redes." });
      await markLinkShared();
    });
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <code className="max-w-full truncate rounded-lg bg-surface px-2.5 py-1.5 text-xs text-ink">{url}</code>
      <button
        type="button"
        onClick={copy}
        disabled={pending}
        className="inline-flex h-8 items-center rounded-full bg-brand-500 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
      >
        Copiar enlace
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-8 items-center rounded-full bg-surface px-3.5 text-xs font-semibold text-ink hover:bg-line"
      >
        Ver página
      </a>
    </div>
  );
}

/** Oculta la lista (pide confirmación). Se vuelve a mostrar desde el menú del usuario. */
export function DismissOnboarding() {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  if (confirming) {
    return (
      <span className="flex items-center gap-2 text-xs">
        <span className="text-muted">¿Ocultar la lista?</span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await dismissOnboarding();
              toast("Lista oculta", {
                description: "Puedes volver a mostrarla desde el menú de tu usuario.",
              });
            })
          }
          className="font-semibold text-red-600 hover:underline"
        >
          Ocultar
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="font-semibold text-muted hover:text-ink">
          Cancelar
        </button>
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="h-8 rounded-full px-3 text-xs font-semibold text-muted hover:bg-canvas hover:text-ink"
    >
      Ocultar
    </button>
  );
}

/** Vuelve a abrir el tour del panel. */
export function StartTourButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(START_TOUR_EVENT))}
      className={className ?? "h-8 rounded-full px-3 text-xs font-semibold text-brand-600 hover:bg-brand-50"}
    >
      Ver tour del panel
    </button>
  );
}
