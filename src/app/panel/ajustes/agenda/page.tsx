import type { Metadata } from "next";
import { AgendaForm } from "@/components/settings/agenda-form";
import { api } from "@/lib/api";
import { guard, requireClinicUser } from "@/lib/dal";
import type { Clinic } from "@/lib/types";

export const metadata: Metadata = { title: "Ajustes de la agenda" };

export default async function AgendaSettingsPage() {
  const me = await requireClinicUser();
  if (me.role !== "OWNER") return null;
  const clinic = await guard(api<Clinic>("/clinic"));
  return <AgendaForm clinic={clinic} />;
}
