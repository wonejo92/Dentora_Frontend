"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { guard } from "@/lib/dal";
import type { Diagnosis, Vitals } from "@/lib/types";
import type { ActionResult } from "./appointments";

async function mutate(patientId: string, call: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await guard(call());
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    throw e;
  }
  // Las alertas aparecen también en la agenda y el resumen.
  revalidatePath("/panel", "layout");
  revalidatePath(`/panel/pacientes/${patientId}`);
  return { ok: true };
}

export async function saveMedicalHistory(
  patientId: string,
  input: {
    allergies: string[];
    conditions: string[];
    answers: Record<string, string>;
  },
) {
  // Solo se guardan las respuestas con contenido.
  const answers = Object.fromEntries(
    Object.entries(input.answers)
      .map(([k, v]) => [k, v.trim()])
      .filter(([, v]) => v),
  );
  return mutate(patientId, () =>
    api(`/patients/${patientId}/medical-history`, {
      method: "PUT",
      body: { ...input, answers },
    }),
  );
}

export type NoteInput = {
  appointmentId?: string;
  reason: string;
  findings: string;
  diagnoses: Diagnosis[];
  procedure: string;
  indications: string;
  prescription: string;
  vitals: Vitals;
};

export async function saveClinicalNote(patientId: string, noteId: string | null, input: NoteInput) {
  // Al editar, un texto vacío se envía como null para poder borrarlo.
  const text = (value: string) => value.trim() || (noteId ? null : undefined);
  const body = {
    // Al editar, null quita la cita asociada.
    appointmentId: input.appointmentId || (noteId ? null : undefined),
    reason: text(input.reason),
    findings: text(input.findings),
    diagnoses: input.diagnoses.map((d) => ({
      ...d,
      comment: d.comment?.trim() || undefined,
    })),
    procedure: text(input.procedure),
    indications: text(input.indications),
    prescription: text(input.prescription),
    vitals: input.vitals,
  };
  const hasContent = [body.reason, body.findings, body.procedure].some(Boolean) || body.diagnoses.length > 0;
  if (!hasContent)
    return {
      ok: false,
      error: "Escribe al menos el motivo, el diagnóstico o el procedimiento",
    } as const;

  return mutate(patientId, () =>
    noteId
      ? api(`/clinical-notes/${noteId}`, { method: "PATCH", body })
      : api(`/patients/${patientId}/clinical-notes`, { method: "POST", body }),
  );
}

export async function addAddendum(patientId: string, noteId: string, text: string) {
  if (!text.trim()) return { ok: false, error: "Escribe la aclaración" } as const;
  return mutate(patientId, () =>
    api(`/clinical-notes/${noteId}/addenda`, {
      method: "POST",
      body: { text: text.trim() },
    }),
  );
}
