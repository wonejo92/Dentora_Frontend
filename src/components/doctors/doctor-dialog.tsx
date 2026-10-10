"use client";

import { useActionState, useState } from "react";
import { saveDoctor, type FormState } from "@/app/actions/doctors";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Select, Switch, TextArea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { formatDuration } from "@/lib/format";
import { roleLabels } from "@/lib/labels";
import { DOCTOR_COLORS } from "@/lib/schedule";
import type { Doctor, StaffUser, Treatment } from "@/lib/types";

type Props = {
  doctor?: Doctor;
  treatments: Treatment[];
  users: StaffUser[];
  triggerClassName: string;
  children: React.ReactNode;
};

export function DoctorDialog({ doctor, triggerClassName, children, ...data }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {children}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={doctor ? "Editar doctor" : "Nuevo doctor"}
        description="Su perfil aparece en la agenda y en la web de la clínica."
      >
        <DoctorForm doctor={doctor} {...data} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function DoctorForm({
  doctor: d,
  treatments,
  users,
  onDone,
}: Omit<Props, "triggerClassName" | "children"> & { onDone: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await saveDoctor(prev, formData);
    if (result.ok) onDone();
    return result;
  }, {});

  const assigned = new Set(d?.treatments.map((t) => t.id));
  const treatmentOptions = treatments.filter((t) => t.isActive || assigned.has(t.id));
  const colors = d && !DOCTOR_COLORS.includes(d.color.toUpperCase()) ? [d.color, ...DOCTOR_COLORS] : DOCTOR_COLORS;
  // Solo usuarios que no están vinculados a otro doctor.
  const userOptions = users.filter((u) => u.isActive && (!u.doctor || u.doctor.id === d?.id));

  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert>{state.error}</Alert>}
      {d && <input type="hidden" name="id" value={d.id} />}

      <Field
        label="Nombre"
        name="fullName"
        placeholder="Dra. Andrea Pérez"
        defaultValue={d?.fullName}
        minLength={3}
        maxLength={80}
        required
        autoFocus
      />
      <Field
        label="Especialidad"
        name="specialty"
        placeholder="Ortodoncia"
        defaultValue={d?.specialty ?? ""}
        hint="Opcional"
      />
      <TextArea
        label="Presentación"
        name="bio"
        placeholder="Especialista en ortodoncia con 10 años de experiencia…"
        hint="Opcional. Se muestra en la web de la clínica."
        defaultValue={d?.bio ?? ""}
        maxLength={1000}
      />

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">Color en la agenda</legend>
        <div className="flex flex-wrap gap-2">
          {colors.map((color, i) => (
            <label key={color} className="cursor-pointer" title={color}>
              <input
                type="radio"
                name="color"
                value={color}
                defaultChecked={d ? d.color.toUpperCase() === color.toUpperCase() : i === 0}
                className="peer sr-only"
              />
              <span
                className="block size-8 rounded-full ring-offset-2 transition peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500"
                style={{ backgroundColor: color }}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">Tratamientos que realiza</legend>
        {treatmentOptions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-3 text-xs text-muted">
            Aún no hay tratamientos. Créalos en la sección Tratamientos.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {treatmentOptions.map((t) => (
              <label key={t.id} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="treatmentIds"
                  value={t.id}
                  defaultChecked={assigned.has(t.id)}
                  className="peer sr-only"
                />
                <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-muted transition-colors peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-700 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-50 hover:border-brand-200">
                  {t.name}
                  <span className="text-xs opacity-70">{formatDuration(t.durationMin)}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <Select
        label="Usuario para iniciar sesión"
        name="userId"
        defaultValue={d?.userId ?? ""}
        hint="Opcional. Vincúlalo si el doctor entra al sistema para ver sus citas."
      >
        <option value="">Sin usuario</option>
        {userOptions.map((u) => (
          <option key={u.id} value={u.id}>
            {u.fullName} · {roleLabels[u.role]} ({u.email})
          </option>
        ))}
      </Select>

      {d && (
        <Switch
          name="isActive"
          label="Activo"
          description="Si lo desactivas, deja de aparecer en la agenda y en la web. Sus citas se mantienen."
          defaultChecked={d.isActive}
        />
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : d ? "Guardar cambios" : "Crear doctor"}
        </Button>
      </div>
    </form>
  );
}
