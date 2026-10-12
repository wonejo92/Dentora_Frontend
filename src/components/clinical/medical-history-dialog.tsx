"use client";

import { useState, useTransition } from "react";
import { saveMedicalHistory } from "@/app/actions/clinical";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Modal } from "@/components/ui/modal";
import { ANAMNESIS, COMMON_ALLERGIES, CONDITIONS, type Question } from "@/lib/clinical";
import { cn } from "@/lib/cn";
import type { MedicalHistory } from "@/lib/types";

export function MedicalHistoryDialog({
  patientId,
  history,
  triggerClassName,
  children,
}: {
  patientId: string;
  history: MedicalHistory | null;
  triggerClassName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {children}
      </button>
      {open && <HistoryForm patientId={patientId} history={history} onClose={() => setOpen(false)} />}
    </>
  );
}

function HistoryForm({
  patientId,
  history,
  onClose,
}: {
  patientId: string;
  history: MedicalHistory | null;
  onClose: () => void;
}) {
  const [allergies, setAllergies] = useState<string[]>(history?.allergies ?? []);
  const [conditions, setConditions] = useState<string[]>(history?.conditions ?? []);
  const [answers, setAnswers] = useState<Record<string, string>>(history?.answers ?? {});
  const [newAllergy, setNewAllergy] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const toggle = (list: string[], item: string) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
  const setAnswer = (key: string, value: string) => setAnswers((a) => ({ ...a, [key]: value }));

  const addAllergy = () => {
    const name = newAllergy.trim();
    if (name && !allergies.some((a) => a.toLowerCase() === name.toLowerCase())) {
      setAllergies([...allergies, name]);
    }
    setNewAllergy("");
  };

  const save = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await saveMedicalHistory(patientId, {
        allergies,
        conditions,
        answers,
      });
      if (result.ok) onClose();
      else setError(result.error);
    });
  };

  const customAllergies = allergies.filter((a) => !COMMON_ALLERGIES.includes(a));

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Antecedentes del paciente"
      description="Las alergias y condiciones aparecen como alerta en la agenda y la ficha."
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={save} disabled={pending}>
            {pending ? "Guardando…" : "Guardar antecedentes"}
          </Button>
        </>
      }
    >
      <div className="space-y-7">
        <FormError message={error} />

        <Section title="Alergias" tone="danger">
          <div className="flex flex-wrap gap-2">
            {[...COMMON_ALLERGIES, ...customAllergies].map((a) => (
              <ToggleChip
                key={a}
                label={a}
                active={allergies.includes(a)}
                onClick={() => setAllergies(toggle(allergies, a))}
                tone="danger"
              />
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addAllergy();
                }
              }}
              maxLength={100}
              placeholder="Otra alergia"
              aria-label="Otra alergia"
              className={cn(controlClass(), "h-10 min-w-0 flex-1")}
            />
            <Button type="button" variant="secondary" onClick={addAllergy} disabled={!newAllergy.trim()}>
              Agregar
            </Button>
          </div>
        </Section>

        <Section title="Enfermedades y condiciones" tone="danger">
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {Object.entries(CONDITIONS).map(([key, label]) => (
              <label
                key={key}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                  conditions.includes(key)
                    ? "border-red-300 bg-red-50 font-medium text-red-800"
                    : "border-line hover:border-brand-200",
                )}
              >
                <input
                  type="checkbox"
                  checked={conditions.includes(key)}
                  onChange={() => setConditions(toggle(conditions, key))}
                  className="size-4 accent-red-600"
                />
                {label}
              </label>
            ))}
          </div>
        </Section>

        {ANAMNESIS.map((section) => (
          <Section key={section.title} title={section.title}>
            <div className="divide-y divide-line rounded-2xl border border-line">
              {section.questions.map((q) => (
                <QuestionRow
                  key={q.key}
                  question={q}
                  value={answers[q.key] ?? ""}
                  onChange={(v) => setAnswer(q.key, v)}
                />
              ))}
            </div>
          </Section>
        ))}
      </div>
    </Modal>
  );
}

function Section({ title, tone, children }: { title: string; tone?: "danger"; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {tone === "danger" && <span className="size-1.5 rounded-full bg-red-600" aria-hidden />}
        {title}
      </h3>
      {children}
    </section>
  );
}

function ToggleChip({
  label,
  active,
  onClick,
  tone,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: "danger";
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? tone === "danger"
            ? "border-red-300 bg-red-50 font-medium text-red-800"
            : "border-brand-500 bg-brand-50 font-medium text-brand-700"
          : "border-line text-ink/80 hover:border-brand-200",
      )}
    >
      {label}
    </button>
  );
}

/** Pregunta con opciones (se desmarca al tocarla otra vez) o de texto libre. */
function QuestionRow({
  question: q,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `q-${q.key}`;
  return (
    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      {q.options ? (
        <>
          <span id={id} className="text-sm">
            {q.label}
          </span>
          <div role="radiogroup" aria-labelledby={id} className="flex shrink-0 flex-wrap gap-1.5">
            {q.options.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={value === o.value}
                onClick={() => onChange(value === o.value ? "" : o.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  value === o.value
                    ? "border-night-900 bg-night-900 text-white"
                    : "border-line text-muted hover:border-brand-200 hover:text-ink",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <label htmlFor={id} className="shrink-0 text-sm sm:w-56">
            {q.label}
          </label>
          <input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={500}
            placeholder={q.placeholder}
            className={cn(controlClass(), "h-10 w-full")}
          />
        </>
      )}
    </div>
  );
}
