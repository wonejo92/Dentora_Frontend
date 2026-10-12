import type { BudgetDetail } from "@/lib/types";
import { PrintButton } from "./print-button";

type Clinic = BudgetDetail["clinic"];

/**
 * Hoja A4 para imprimir. Usa colores fijos (no los del tema) para que se vea
 * igual en papel aunque el panel esté en modo oscuro. Con margen de página 0
 * el navegador no agrega fecha, título ni URL; el margen va dentro de la hoja.
 */
export function PrintSheet({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 py-8 text-gray-900 print:min-h-0 print:bg-white print:py-0">
      <style>{`@page { size: A4; margin: 0; } body { background: white; }`}</style>
      <div className="mx-auto mb-4 flex max-w-[210mm] justify-end px-4 print:hidden">
        <PrintButton />
      </div>
      <article className="mx-auto max-w-[210mm] bg-white p-10 shadow-sm print:max-w-none print:p-[16mm] print:shadow-none">
        {children}
      </article>
    </div>
  );
}

/** Cabecera con logo y datos de la clínica, y el tipo y número del documento. */
export function PrintHeader({
  clinic: c,
  title,
  number,
  note,
}: {
  clinic: Clinic;
  title: string;
  number: number;
  note?: string;
}) {
  return (
    <header className="flex items-start justify-between gap-6 border-b-2 pb-5" style={{ borderColor: c.primaryColor }}>
      <div className="flex items-center gap-4">
        {c.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.logoUrl} alt="" className="h-14 w-14 rounded-lg object-contain" />
        )}
        <div>
          <h1 className="text-xl font-bold">{c.name}</h1>
          <p className="text-xs text-gray-600">
            {[c.ruc && `RUC ${c.ruc}`, c.address, c.city].filter(Boolean).join(" · ")}
          </p>
          <p className="text-xs text-gray-600">{[c.phone, c.email].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">{title}</p>
        <p className="text-2xl font-bold tabular-nums" style={{ color: c.primaryColor }}>
          #{String(number).padStart(title === "Recibo" ? 6 : 0, "0")}
        </p>
        {note && <p className="text-xs text-gray-500">{note}</p>}
      </div>
    </header>
  );
}
