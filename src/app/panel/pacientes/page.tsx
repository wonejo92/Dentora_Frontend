import type { Metadata } from "next";
import { ComingSoon } from "@/components/panel/coming-soon";

export const metadata: Metadata = { title: "Pacientes" };

export default function Page() {
  return (
    <ComingSoon
      title="Pacientes"
      description="Buscador por nombre o cédula, ficha de cada paciente y su historial de citas."
    />
  );
}
