"use client";

import { useActionState } from "react";
import { registerClinic, type AuthFormState } from "@/app/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

export function RegisterForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(registerClinic, {});
  const v = state.values ?? {};

  return (
    <form action={action} className="space-y-5">
      {state.error && <Alert>{state.error}</Alert>}

      <fieldset className="space-y-4">
        <legend className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
          Tu clínica
        </legend>
        <Field
          label="Nombre de la clínica"
          name="clinicName"
          placeholder="Clínica Dental Sonrisa"
          defaultValue={v.clinicName}
          minLength={3}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ciudad" name="city" placeholder="Quito" defaultValue={v.city} />
          <Field
            label="Teléfono"
            name="phone"
            type="tel"
            placeholder="0991234567"
            defaultValue={v.phone}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
          Tu cuenta
        </legend>
        <Field
          label="Tu nombre"
          name="ownerName"
          autoComplete="name"
          placeholder="Dra. Andrea Pérez"
          defaultValue={v.ownerName}
          minLength={3}
          required
        />
        <Field
          label="Correo"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nombre@clinica.ec"
          defaultValue={v.email}
          required
        />
        <Field
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="Mínimo 8 caracteres"
          minLength={8}
          required
        />
      </fieldset>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creando tu clínica…" : "Crear clínica gratis"}
      </Button>
      <p className="text-center text-xs text-muted">
        14 días de prueba. No pedimos tarjeta de crédito.
      </p>
    </form>
  );
}
