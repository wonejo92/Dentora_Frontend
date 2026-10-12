import Link from "next/link";
import { money } from "@/lib/billing";
import { cn } from "@/lib/cn";

/** "Debe $51,50": enlaza a la cuenta del paciente. No se muestra si no debe nada. */
export function BalanceBadge({
  patientId,
  balance,
  size = "sm",
}: {
  patientId: string;
  balance?: string;
  size?: "sm" | "md";
}) {
  if (!balance || Number(balance) <= 0) return null;
  return (
    <Link
      href={`/panel/pacientes/${patientId}?tab=cuenta`}
      title="Ver la cuenta del paciente"
      className={cn(
        "inline-flex shrink-0 items-center rounded-full bg-amber-100 font-semibold text-amber-800 tabular-nums transition-colors hover:bg-amber-200",
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
      )}
    >
      Debe {money(balance)}
    </Link>
  );
}
