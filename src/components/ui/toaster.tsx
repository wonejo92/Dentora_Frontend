"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Avisos flotantes (Sonner) con los colores de Dentora. Se usan con
 * `toast.success("Cambios guardados")` desde cualquier componente de cliente.
 * Los errores de un formulario siguen junto al campo; el toast confirma acciones.
 */
export function Toaster() {
  return (
    <Sonner
      position="top-right"
      // Debajo de la barra superior del panel, para no tapar la campana ni el menú del usuario.
      offset={{ top: 84, right: 24 }}
      duration={3500}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink shadow-lg shadow-black/10 sm:w-[356px]",
          title: "font-semibold",
          description: "text-xs text-muted",
          icon: "shrink-0",
          success: "[&_[data-icon]]:text-green-700",
          error: "[&_[data-icon]]:text-red-600",
        },
      }}
    />
  );
}
