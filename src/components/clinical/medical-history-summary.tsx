import { buttonClass } from "@/components/ui/button";
import { ANAMNESIS, answerLabel, conditionLabel } from "@/lib/clinical";
import type { MedicalHistory } from "@/lib/types";
import { MedicalHistoryDialog } from "./medical-history-dialog";

/** Tarjeta de antecedentes: alertas arriba y solo las respuestas contestadas. */
export function MedicalHistorySummary({
  patientId,
  history,
  timeZone,
}: {
  patientId: string;
  history: MedicalHistory | null;
  timeZone: string;
}) {
  const answered = ANAMNESIS.map((s) => ({
    ...s,
    questions: s.questions.map((q) => ({ q, value: answerLabel(q, history?.answers[q.key]) })).filter((x) => x.value),
  })).filter((s) => s.questions.length > 0);

  return (
    <section className="rounded-3xl bg-surface p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold">Antecedentes</h2>
        <MedicalHistoryDialog
          patientId={patientId}
          history={history}
          triggerClassName={buttonClass(history ? "secondary" : "primary", "h-9 px-3.5")}
        >
          {history ? "Editar" : "Completar"}
        </MedicalHistoryDialog>
      </div>

      {!history ? (
        <p className="text-sm text-muted">Registra alergias, enfermedades y hábitos antes del primer tratamiento.</p>
      ) : (
        <div className="space-y-5 text-sm">
          <div>
            <p className="text-xs text-muted">Alergias</p>
            {history.allergies.length ? (
              <p className="mt-1 font-semibold text-red-700">{history.allergies.join(", ")}</p>
            ) : (
              <p className="mt-1">Ninguna conocida</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted">Enfermedades y condiciones</p>
            {history.conditions.length ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {history.conditions.map((c) => (
                  <span key={c} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                    {conditionLabel(c)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1">Ninguna</p>
            )}
          </div>

          {answered.map((s) => (
            <div key={s.title}>
              <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">{s.title}</p>
              <dl className="divide-y divide-line">
                {s.questions.map(({ q, value }) => (
                  <div key={q.key} className="flex justify-between gap-4 py-1.5">
                    <dt className="text-muted">{q.label}</dt>
                    <dd className="text-right font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}

          <p className="border-t border-line pt-3 text-xs text-muted">
            Actualizado el{" "}
            {new Intl.DateTimeFormat("es-EC", {
              timeZone,
              day: "numeric",
              month: "short",
              year: "numeric",
            }).format(new Date(history.updatedAt))}
            {history.updatedBy && ` por ${history.updatedBy.fullName}`}
          </p>
        </div>
      )}
    </section>
  );
}
