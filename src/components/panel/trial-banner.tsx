import type { ClinicMe } from "@/lib/dal";
import { calendarDaysUntil } from "@/lib/time";

export function TrialBanner({ clinic }: { clinic: ClinicMe["clinic"] }) {
  if (clinic.status !== "TRIAL" || !clinic.trialEndsAt) return null;
  const daysLeft = calendarDaysUntil(clinic.trialEndsAt, clinic.timezone);

  return (
    <div className="border-b border-brand-100 bg-brand-50 px-4 py-2 text-center text-xs text-brand-700 sm:px-8">
      {daysLeft > 1 && `Te quedan ${daysLeft} días de prueba gratis.`}
      {daysLeft === 1 && "Mañana termina tu prueba gratis."}
      {daysLeft === 0 && "Hoy es el último día de tu prueba gratis."}
      {daysLeft < 0 && "Tu prueba gratis terminó."}{" "}
      <span className="font-semibold">Escríbenos para activar tu plan.</span>
    </div>
  );
}
