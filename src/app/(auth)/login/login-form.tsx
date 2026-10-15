"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type AuthFormState } from "@/app/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

export function LoginForm({ desde }: { desde?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(login, {});

  return (
    <form action={action} className="space-y-5">
      {state.error && <Alert>{state.error}</Alert>}
      <input type="hidden" name="desde" value={desde ?? ""} />
      <Field
        label="Correo"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="nombre@clinica.ec"
        defaultValue={state.values?.email}
        required
      />
      <div className="space-y-1.5">
        <Field
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <div className="text-right">
          <Link href="/recuperar" className="text-sm font-semibold text-brand-500 hover:text-brand-600">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Ingresando…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}
