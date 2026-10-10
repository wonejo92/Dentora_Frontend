import type { Metadata } from "next";
import { ComingSoon } from "@/components/panel/coming-soon";

export const metadata: Metadata = { title: "Reportes" };

export default function Page() {
  return (
    <ComingSoon
      title="Reportes"
      description="Citas por doctor y tratamiento, inasistencias, cancelaciones y pacientes nuevos."
    />
  );
}
