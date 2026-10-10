"use client";

import { useState } from "react";
import { saveUser, type SettingsState } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Field, Select, Switch } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Modal } from "@/components/ui/modal";
import { useFormAction } from "@/components/ui/use-form-action";
import type { Role, StaffUser } from "@/lib/types";

const ROLES: { value: Exclude<Role, "SUPER_ADMIN">; label: string; description: string }[] = [
  { value: "RECEPTIONIST", label: "Recepción", description: "Agenda, pacientes y feriados." },
  { value: "DOCTOR", label: "Doctor", description: "Agenda y pacientes." },
  { value: "ASSISTANT", label: "Asistente", description: "Agenda y pacientes." },
  { value: "OWNER", label: "Dueño", description: "Acceso total, incluidos los ajustes." },
];

export function UserDialog({
  user,
  isSelf,
  triggerClassName,
  children,
}: {
  user?: StaffUser;
  /** El usuario que está editando su propia cuenta: no puede cambiarse el rol ni desactivarse. */
  isSelf?: boolean;
  triggerClassName: string;
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
        title={user ? "Editar usuario" : "Nuevo usuario"}
        description={user ? user.email : "La persona entrará con este correo y contraseña."}
      >
        <UserForm user={user} isSelf={isSelf} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function UserForm({ user: u, isSelf, onDone }: { user?: StaffUser; isSelf?: boolean; onDone: () => void }) {
  const { state, pending, onSubmit } = useFormAction<SettingsState>(async (prev, formData) => {
    const result = await saveUser(prev, formData);
    if (result.ok) onDone();
    return result;
  }, {});

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError message={state.error} />
      {u && <input type="hidden" name="id" value={u.id} />}

      <Field label="Nombre completo" name="fullName" defaultValue={u?.fullName} placeholder="Carla Jiménez" minLength={3} required autoFocus={!u} />
      {!u && (
        <Field label="Correo" name="email" type="email" placeholder="carla@clinica.ec" autoComplete="off" required />
      )}
      <Field
        label={u ? "Nueva contraseña" : "Contraseña"}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required={!u}
        hint={u ? "Déjala vacía para no cambiarla." : "Mínimo 8 caracteres. Compártela de forma segura."}
      />

      {isSelf ? (
        <p className="rounded-xl bg-canvas px-4 py-3 text-xs text-muted">
          No puedes cambiar tu propio rol ni desactivar tu cuenta.
        </p>
      ) : (
        <>
          <Select label="Rol" name="role" defaultValue={u?.role ?? "RECEPTIONIST"}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label} — {r.description}
              </option>
            ))}
          </Select>
          {u && (
            <>
              <input type="hidden" name="isActiveField" value="1" />
              <Switch
                name="isActive"
                label="Puede iniciar sesión"
                description="Desactívalo si la persona ya no trabaja en la clínica. Su historial se conserva."
                defaultChecked={u.isActive}
              />
            </>
          )}
        </>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : u ? "Guardar cambios" : "Crear usuario"}
        </Button>
      </div>
    </form>
  );
}
