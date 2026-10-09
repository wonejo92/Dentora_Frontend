import type { Metadata } from "next";
import { ComingSoon } from "@/components/panel/coming-soon";

export const metadata: Metadata = { title: "Doctores" };

export default function Page() {
  return (
    <ComingSoon
      title="Doctores"
      description="Perfil de cada doctor, los tratamientos que realiza y su horario semanal."
    />
  );
}
