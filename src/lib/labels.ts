import type { Gender, IdType, Role } from "./types";

export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super-admin",
  OWNER: "Dueño",
  DOCTOR: "Doctor",
  RECEPTIONIST: "Recepción",
  ASSISTANT: "Asistente",
};

export const initials = (name: string) =>
  name
    .replace(/^(dra?|lcd[oa]?)\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export const idTypeLabels: Record<IdType, string> = {
  CEDULA: "Cédula",
  RUC: "RUC",
  PASAPORTE: "Pasaporte",
};

export const genderLabels: Record<Gender, string> = {
  FEMALE: "Femenino",
  MALE: "Masculino",
  OTHER: "Otro",
};
