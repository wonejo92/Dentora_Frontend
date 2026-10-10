"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { savePatient, type PatientFormState } from "@/app/actions/patients";
import { FormError } from "@/components/ui/form-error";
import { Button } from "@/components/ui/button";
import { Field, Select, TextArea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useFormAction } from "@/components/ui/use-form-action";
import { genderLabels, idTypeLabels } from "@/lib/labels";
import type { Patient } from "@/lib/types";

export function PatientDialog({
  patient,
  triggerClassName,
  children,
}: {
  patient?: Patient;
  triggerClassName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title={patient ? "Editar paciente" : "Nuevo paciente"}
        description="Solo la identificación, los nombres y los apellidos son obligatorios."
      >
        <PatientForm patient={patient} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function PatientForm({
  patient: p,
  onDone,
}: {
  patient?: Patient;
  onDone: () => void;
}) {
  const router = useRouter();
  const { state, pending, onSubmit } = useFormAction<PatientFormState>(
    async (prev, formData) => {
      const result = await savePatient(prev, formData);
      if (result.ok) {
        onDone();
        // Al crear, lleva directo a la ficha del paciente nuevo.
        if (!p && result.id) router.push(`/panel/pacientes/${result.id}`);
      }
      return result;
    },
    {},
  );

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormError message={state.error} />
      {p && <input type="hidden" name="id" value={p.id} />}

      <fieldset className="space-y-3">
        <legend className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
          Identificación
        </legend>
        <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
          <Select
            label="Tipo"
            name="idType"
            defaultValue={p?.idType ?? "CEDULA"}
          >
            {Object.entries(idTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Field
            label="Número"
            name="idNumber"
            placeholder="1710034065"
            defaultValue={p?.idNumber}
            inputMode="numeric"
            maxLength={20}
            hint="La cédula y el RUC se validan con el dígito verificador."
            required
            autoFocus={!p}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Nombres"
            name="firstName"
            placeholder="Juan Andrés"
            defaultValue={p?.firstName}
            maxLength={60}
            required
          />
          <Field
            label="Apellidos"
            name="lastName"
            placeholder="Muñoz Peña"
            defaultValue={p?.lastName}
            maxLength={60}
            required
          />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
          Contacto
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Celular"
            name="phone"
            type="tel"
            placeholder="0991234567"
            defaultValue={p?.phone ?? ""}
            hint="Para recordatorios por WhatsApp"
          />
          <Field
            label="Correo"
            name="email"
            type="email"
            placeholder="paciente@correo.com"
            defaultValue={p?.email ?? ""}
          />
        </div>
        <Field
          label="Dirección"
          name="address"
          placeholder="Av. Amazonas N24-03, Quito"
          defaultValue={p?.address ?? ""}
        />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
          Datos personales
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Fecha de nacimiento"
            name="birthDate"
            type="date"
            defaultValue={p?.birthDate?.slice(0, 10) ?? ""}
          />
          <Select label="Sexo" name="gender" defaultValue={p?.gender ?? ""}>
            <option value="">Sin especificar</option>
            {Object.entries(genderLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <TextArea
          label="Notas"
          name="notes"
          placeholder="Alergias, condiciones médicas, preferencias…"
          defaultValue={p?.notes ?? ""}
          maxLength={2000}
        />
      </fieldset>

      {!p?.dataConsentAt && (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-canvas/60 px-4 py-3">
          <input
            type="checkbox"
            name="dataConsent"
            className="mt-0.5 size-4 accent-brand-500"
            required={!p}
          />
          <span className="text-sm">
            <span className="font-medium">
              El paciente autorizó el tratamiento de sus datos personales
            </span>
            <span className="block text-xs text-muted">
              Requerido por la Ley Orgánica de Protección de Datos Personales
              (LOPDP). Se guarda la fecha de la autorización.
            </span>
          </span>
        </label>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : p ? "Guardar cambios" : "Crear paciente"}
        </Button>
      </div>
    </form>
  );
}
