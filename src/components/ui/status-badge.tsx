import { cn } from "@/lib/cn";
import type { AppointmentStatus } from "@/lib/types";

const styles: Record<AppointmentStatus, { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Confirmada", className: "bg-green-100 text-green-800" },
  COMPLETED: { label: "Atendida", className: "bg-brand-50 text-brand-700" },
  CANCELLED: { label: "Cancelada", className: "bg-slate-100 text-slate-600" },
  NO_SHOW: { label: "No asistió", className: "bg-red-100 text-red-700" },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { label, className } = styles[status];
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", className)}>
      {label}
    </span>
  );
}
