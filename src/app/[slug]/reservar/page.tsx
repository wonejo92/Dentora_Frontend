import type { Metadata } from "next";
import { BookingFlow } from "@/components/public/booking-flow";
import { loadPublicClinic } from "@/lib/public-clinic";

export async function generateMetadata({ params }: PageProps<"/[slug]/reservar">): Promise<Metadata> {
  const { clinic } = await loadPublicClinic((await params).slug);
  return {
    title: { absolute: `Reserva tu cita · ${clinic.name}` },
    description: `Elige el tratamiento, el día y la hora. Reserva en ${clinic.name} en menos de un minuto.`,
  };
}

export default async function BookingPage({ params, searchParams }: PageProps<"/[slug]/reservar">) {
  const data = await loadPublicClinic((await params).slug);
  const { tratamiento } = await searchParams;
  return <BookingFlow data={data} initialTreatmentId={typeof tratamiento === "string" ? tratamiento : undefined} />;
}
