import type { Metadata } from "next";
import { ComingSoon } from "@/components/panel/coming-soon";

export const metadata: Metadata = { title: "Ajustes" };

export default function Page() {
  return (
    <ComingSoon
      title="Ajustes"
      description="Datos de la clínica, logo, colores, reglas de la agenda y personal."
    />
  );
}
