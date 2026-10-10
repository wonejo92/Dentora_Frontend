"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { guard } from "@/lib/dal";
import type { Patient } from "@/lib/types";

export type PatientFormState = { ok?: boolean; id?: string; error?: string };

export async function savePatient(
  _prev: PatientFormState,
  formData: FormData,
): Promise<PatientFormState> {
  const id = String(formData.get("id") ?? "");
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const isNew = !id;

  const idNumber = text("idNumber").replace(/[\s-]/g, "");
  if (!idNumber || !text("firstName") || !text("lastName")) {
    return { error: "Completa la identificación, los nombres y los apellidos" };
  }
  const consent = formData.get("dataConsent") === "on";
  if (isNew && !consent) {
    return {
      error: "Confirma que el paciente autorizó el uso de sus datos (LOPDP)",
    };
  }

  // Al editar, un campo vacío se envía como null para poder borrarlo.
  const optional = (key: string) => text(key) || (isNew ? undefined : null);
  const body = {
    idType: text("idType") || "CEDULA",
    idNumber,
    firstName: text("firstName"),
    lastName: text("lastName"),
    phone: optional("phone"),
    email: optional("email"),
    birthDate: optional("birthDate"),
    gender: optional("gender"),
    address: optional("address"),
    notes: optional("notes"),
    dataConsent: consent || undefined,
  };

  let patient: Patient;
  try {
    patient = await guard(
      api<Patient>(isNew ? "/patients" : `/patients/${id}`, {
        method: isNew ? "POST" : "PATCH",
        body,
      }),
    );
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }

  revalidatePath("/panel/pacientes", "layout");
  return { ok: true, id: patient.id };
}
