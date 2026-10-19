"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { changePassword, updateProfile, type ProfileState } from "@/app/actions/profile";
import { SaveBar, SettingsCard } from "@/components/settings/save-bar";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { useFormAction } from "@/components/ui/use-form-action";

export function ProfileForm({ fullName, email, role }: { fullName: string; email: string; role: string }) {
  const { state, pending, onSubmit } = useFormAction<ProfileState>(
    async (prev, formData) => {
      const result = await updateProfile(prev, formData);
      if (result.ok) toast.success("Datos guardados");
      return result;
    },
    {},
  );
  return (
    <form onSubmit={onSubmit}>
      <SettingsCard title="Datos personales" description="Tu nombre aparece en la agenda, las evoluciones y el menú.">
        <FormError message={state.error} />
        <Field label="Nombre completo" name="fullName" defaultValue={fullName} minLength={3} maxLength={100} required />
        <Field
          label="Correo"
          name="email"
          defaultValue={email}
          disabled
          hint="Es tu usuario para entrar. Para cambiarlo, pídeselo al dueño de la clínica."
        />
        <Field label="Rol" name="role" defaultValue={role} disabled />
        <SaveBar pending={pending} />
      </SettingsCard>
    </form>
  );
}

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const { state, pending, onSubmit } = useFormAction<ProfileState>(async (prev, formData) => {
    const result = await changePassword(prev, formData);
    // Al cambiarla bien, se limpian los campos (con error se conservan).
    if (result.ok) {
      formRef.current?.reset();
      toast.success("Contraseña actualizada");
    }
    return result;
  }, {});

  return (
    <form ref={formRef} onSubmit={onSubmit}>
      <SettingsCard
        title="Contraseña"
        description="Al cambiarla se cierran tus sesiones en otros dispositivos; en este sigues conectado."
      >
        <FormError message={state.error} />
        <Field
          label="Contraseña actual"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Contraseña nueva"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            hint="Mínimo 8 caracteres."
            required
          />
          <Field
            label="Repite la contraseña nueva"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
          />
        </div>
        <div className="flex items-center justify-end gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Cambiando…" : "Cambiar contraseña"}
          </Button>
        </div>
      </SettingsCard>
    </form>
  );
}
