import type { Metadata } from "next";
import { ComingSoon } from "@/components/panel/coming-soon";

export const metadata: Metadata = { title: "Tratamientos" };

export default function Page() {
  return (
    <ComingSoon
      title="Tratamientos"
      description="Catálogo con duración y precio, y qué tratamientos se pueden reservar online."
    />
  );
}
