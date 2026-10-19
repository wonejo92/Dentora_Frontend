import type { Me, PlanFeature } from "./types";

/** Qué es cada módulo y el plan más barato que lo incluye (igual que la landing). */
export const featureInfo: Record<PlanFeature, { title: string; plan: string; text: string }> = {
  clinical: {
    title: "Historia clínica",
    plan: "Pro",
    text: "Antecedentes, alergias y evoluciones de cada paciente con diagnósticos CIE-10.",
  },
  billing: {
    title: "Presupuestos, pagos y caja",
    plan: "Pro",
    text: "Presupuestos por tratamiento, abonos con recibo, saldo de cada paciente y la caja del día.",
  },
  reports: {
    title: "Reportes del negocio",
    plan: "Clínica",
    text: "Ingresos, inasistencias, pacientes nuevos y tratamientos más agendados, frente al mes anterior.",
  },
};

/** Si el plan de la clínica incluye el módulo. Sin datos de límites, no se bloquea nada. */
export const hasFeature = (me: Me, feature: PlanFeature) => me.planLimits?.features[feature] ?? true;
