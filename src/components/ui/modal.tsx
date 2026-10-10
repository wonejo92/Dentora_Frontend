"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

const sizes = {
  md: "max-w-lg",
  lg: "max-w-3xl",
};

/**
 * Ventana modal basada en <dialog>: cierra con Esc, atrapa el foco
 * y bloquea el fondo sin librerías extra.
 * El encabezado y el `footer` quedan fijos; solo el contenido hace scroll.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: keyof typeof sizes;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="modal-title"
      className={cn(
        "m-auto w-[calc(100%-2rem)] overflow-hidden rounded-3xl bg-surface p-0 text-left font-normal text-ink backdrop:bg-night-900/50",
        sizes[size],
      )}
    >
      {open && (
        <div className="flex max-h-[88vh] flex-col">
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 sm:px-7 sm:pt-7">
            <div>
              <h2 id="modal-title" className="text-lg font-bold tracking-tight">
                {title}
              </h2>
              {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-canvas hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 sm:px-7 sm:pb-7">{children}</div>
          {footer && (
            <div className="flex justify-end gap-2 border-t border-line px-6 py-4 sm:px-7">{footer}</div>
          )}
        </div>
      )}
    </dialog>
  );
}
