import { cn } from "@/lib/cn";
import { initials } from "@/lib/labels";

/** Iniciales de la clínica sobre su color de marca ("Clínica Dental Sonrisa" → "S"). */
export function ClinicAvatar({
  clinic,
  className,
}: {
  clinic: { name: string; primaryColor: string };
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center font-bold text-white",
        // cn no resuelve choques de clases: el tamaño por defecto solo va si no se pasa otro.
        className ?? "size-10 rounded-xl text-sm",
      )}
      style={{ backgroundColor: clinic.primaryColor }}
    >
      {initials(clinic.name.replace(/^(cl[ií]nica|centro)\s+(dental\s+|odontol[oó]gic[oa]\s+)?/i, "")) ||
        clinic.name[0]}
    </span>
  );
}
