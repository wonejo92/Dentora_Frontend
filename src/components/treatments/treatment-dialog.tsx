"use client";

import { useState } from "react";
import { saveTreatment, type FormState } from "@/app/actions/treatments";
import { FormError } from "@/components/ui/form-error";
import { Button } from "@/components/ui/button";
import { Field, Select, Switch, TextArea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useFormAction } from "@/components/ui/use-form-action";
import { formatDuration } from "@/lib/format";
import type { DoctorOption, Treatment } from "@/lib/types";

const DURATIONS = [10, 15, 20, 30, 40, 45, 60, 75, 90, 120, 150, 180, 240];

export function TreatmentDialog({
  treatment,
  doctors,
  triggerClassName,
  children,
}: {
  treatment?: Treatment;
  doctors: DoctorOption[];
  triggerClassName: string;
  /** Contenido del botón que abre la ventana. */
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {children}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={treatment ? "Editar tratamiento" : "Nuevo tratamiento"}
        description="La duración define cuánto espacio ocupa en la agenda."
      >
        <TreatmentForm treatment={treatment} doctors={doctors} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function TreatmentForm({
  treatment: t,
  doctors,
  onDone,
}: {
  treatment?: Treatment;
  doctors: DoctorOption[];
  onDone: () => void;
}) {
  const assigned = new Set(t?.doctors.map((d) => d.id));
  // Los inactivos solo se muestran si ya estaban asignados.
  const options = doctors.filter((d) => d.isActive || assigned.has(d.id));
  const { state, pending, onSubmit } = useFormAction<FormState>(async (prev, formData) => {
    const result = await saveTreatment(prev, formData);
    if (result.ok) onDone();
    return result;
  }, {});

  const durations =
    t && !DURATIONS.includes(t.durationMin)
      ? [...DURATIONS, t.durationMin].sort((a, b) => a - b)
      : DURATIONS;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError message={state.error} />
      {t && <input type="hidden" name="id" value={t.id} />}

      <Field
        label="Nombre"
        name="name"
        placeholder="Limpieza dental"
        defaultValue={t?.name}
        maxLength={80}
        required
        autoFocus
      />
      <TextArea
        label="Descripción"
        name="description"
        placeholder="Profilaxis y eliminación de sarro"
        hint="Opcional. Los pacientes la ven en la web de la clínica."
        defaultValue={t?.description ?? ""}
        maxLength={500}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Duración" name="durationMin" defaultValue={t?.durationMin ?? 30}>
          {durations.map((d) => (
            <option key={d} value={d}>
              {formatDuration(d)}
            </option>
          ))}
        </Select>
        <Field
          label="Precio (USD)"
          name="price"
          inputMode="decimal"
          placeholder="35.00"
          hint="Opcional"
          defaultValue={t?.price ?? ""}
          pattern="\d+([.,]\d{1,2})?"
          title="Ejemplo: 35 o 35.50"
        />
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">Doctores que lo realizan</legend>
        {options.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-3 text-xs text-muted">
            Aún no hay doctores. Créalos en la sección Doctores y vuelve aquí para asignarlos.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {options.map((d) => (
              <label key={d.id} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="doctorIds"
                  value={d.id}
                  defaultChecked={t ? assigned.has(d.id) : options.length === 1}
                  className="peer sr-only"
                />
                <span className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm text-muted transition-colors peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-700 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-50 hover:border-brand-200">
                  <span className="size-2 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.fullName}
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <Switch
        name="isPublic"
        label="Reservable online"
        description="Aparece en la web de la clínica para que los pacientes lo reserven."
        defaultChecked={t?.isPublic ?? true}
      />
      {t && (
        <Switch
          name="isActive"
          label="Activo"
          description="Si lo desactivas, ya no se podrá agendar. Las citas existentes se mantienen."
          defaultChecked={t.isActive}
        />
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : t ? "Guardar cambios" : "Crear tratamiento"}
        </Button>
      </div>
    </form>
  );
}
