import type { Metadata } from "next";
import { headers } from "next/headers";
import { BookingLink } from "@/components/settings/booking-link";
import { ClinicForm } from "@/components/settings/clinic-form";
import { api } from "@/lib/api";
import { guard, requireClinicUser } from "@/lib/dal";
import type { Clinic } from "@/lib/types";

export const metadata: Metadata = { title: "Ajustes" };

export default async function ClinicSettingsPage() {
  const me = await requireClinicUser();
  if (me.role !== "OWNER") return null;
  const clinic = await guard(api<Clinic>("/clinic"));
  // El dominio sale de la petición, así el enlace es correcto en local y en producción.
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  return (
    <div className="space-y-4">
      <BookingLink siteUrl={`${origin}/${clinic.slug}`} />
      <ClinicForm clinic={clinic} siteHost={h.get("host") ?? "dentora.ec"} />
    </div>
  );
}
