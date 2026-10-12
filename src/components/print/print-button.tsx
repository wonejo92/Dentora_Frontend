"use client";

/** Abre el diálogo de impresión del navegador (ahí también se elige "Guardar como PDF"). */
export function PrintButton({ label = "Imprimir / Guardar PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl bg-[#0E7490] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0b5f76] print:hidden"
    >
      {label}
    </button>
  );
}
