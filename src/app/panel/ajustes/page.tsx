import type { Metadata } from "next";
import { ClinicForm } from "@/components/settings/clinic-form";
import { api } from "@/lib/api";
import { guard, requireClinicUser } from "@/lib/dal";
import type { Clinic } from "@/lib/types";

export const metadata: Metadata = { title: "Ajustes" };

export default async function ClinicSettingsPage() {
  const me = await requireClinicUser();
  if (me.role !== "OWNER") return null;
  const clinic = await guard(api<Clinic>("/clinic"));
  return <ClinicForm clinic={clinic} />;
}
