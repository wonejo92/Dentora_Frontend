"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { registerClinic, requestRegisterCode, type RegisterInput } from "@/app/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { VerifyAnimation } from "@/components/ui/verify-animation";
import { cn } from "@/lib/cn";

const RESEND_SECONDS = 60;
/** Tiempo mínimo del anillo de carga, para que se alcance a ver aunque la respuesta sea rápida. */
const MIN_LOADING_MS = 1200;
/** Tiempo que se ve el sello de éxito antes de pasar al panel. */
const SUCCESS_MS = 2000;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const EMPTY: RegisterInput = { clinicName: "", city: "", phone: "", ownerName: "", email: "", password: "" };

/**
 * Registro en dos pasos: datos de la clínica y luego el código de 6 dígitos
 * que llega al correo. Los datos se conservan en el estado, así que volver
 * atrás o equivocarse en el código no obliga a llenar todo de nuevo.
 */
export function RegisterForm() {
  const router = useRouter();
  // Estados propios de la verificación: "Reenviar código" no debe mostrar la animación.
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [data, setData] = useState<RegisterInput>(EMPTY);
  const [step, setStep] = useState<"datos" | "codigo">("datos");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [cooldown, setCooldown] = useState(0);
  const [pending, startTransition] = useTransition();
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const set = (key: keyof RegisterInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData((d) => ({ ...d, [key]: e.target.value }));

  const sendCode = () =>
    startTransition(async () => {
      setError(undefined);
      const result = await requestRegisterCode(data);
      if (!result.ok) return setError(result.error);
      setStep("codigo");
      setCode("");
      setCooldown(RESEND_SECONDS);
      setTimeout(() => codeRef.current?.focus(), 0);
    });

  // Sin startTransition: una transición retiene los cambios de pantalla hasta que
  // termina, y el anillo de carga no llegaría a verse.
  const create = async () => {
    setError(undefined);
    setVerifying(true);
    const [result] = await Promise.all([registerClinic({ ...data, code }), wait(MIN_LOADING_MS)]);
    if (!result.ok) {
      setVerifying(false);
      return setError(result.error);
    }
    setVerified(true);
    await wait(SUCCESS_MS);
    router.replace("/panel?bienvenida=1");
  };

  // Mientras se verifica (y tras verificar), la animación reemplaza al formulario.
  if (step === "codigo" && (verifying || verified)) {
    return (
      <div role="status" aria-live="polite" className="flex flex-col items-center py-10 text-center">
        <VerifyAnimation status={verified ? "success" : "loading"} />
        <p className="mt-6 text-lg font-bold">{verified ? "¡Correo verificado!" : "Verificando tu código…"}</p>
        <p className="mt-1 text-sm text-muted">{verified ? "Estamos preparando tu clínica." : data.email.trim()}</p>
      </div>
    );
  }

  if (step === "codigo") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
        className="space-y-5"
      >
        {error && <Alert>{error}</Alert>}
        <div className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
          Enviamos un código de 6 dígitos a <span className="font-semibold">{data.email.trim()}</span>. Revisa también
          la carpeta de spam.
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="code" className="text-sm font-medium">
            Código de verificación
          </label>
          <input
            ref={codeRef}
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            aria-describedby="code-hint"
            className={cn(
              "h-14 rounded-xl border border-line bg-surface text-center text-2xl font-bold tracking-[0.5em] tabular-nums",
              "placeholder:text-muted/40 focus:border-brand-500 focus:ring-4 focus:ring-brand-50 focus:outline-none",
            )}
          />
          <p id="code-hint" className="text-xs text-muted">
            Vence en 10 minutos.
          </p>
        </div>

        <Button type="submit" disabled={code.length !== 6} className="w-full">
          Verificar y crear clínica
        </Button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setStep("datos");
              setError(undefined);
            }}
            className="font-semibold text-muted hover:text-ink"
          >
            ← Cambiar correo
          </button>
          <button
            type="button"
            onClick={sendCode}
            disabled={pending || cooldown > 0}
            className="font-semibold text-brand-500 hover:text-brand-600 disabled:font-medium disabled:text-muted"
          >
            {cooldown > 0 ? `Reenviar en ${cooldown} s` : "Reenviar código"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        sendCode();
      }}
      className="space-y-5"
    >
      {error && <Alert>{error}</Alert>}

      <fieldset className="space-y-4">
        <legend className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">Tu clínica</legend>
        <Field
          label="Nombre de la clínica"
          name="clinicName"
          placeholder="Clínica Dental Sonrisa"
          value={data.clinicName}
          onChange={set("clinicName")}
          minLength={3}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ciudad" name="city" placeholder="Quito" value={data.city} onChange={set("city")} />
          <Field
            label="Teléfono"
            name="phone"
            type="tel"
            placeholder="0991234567"
            value={data.phone}
            onChange={set("phone")}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">Tu cuenta</legend>
        <Field
          label="Tu nombre"
          name="ownerName"
          autoComplete="name"
          placeholder="Dra. Andrea Pérez"
          value={data.ownerName}
          onChange={set("ownerName")}
          minLength={3}
          required
        />
        <Field
          label="Correo"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nombre@clinica.ec"
          hint="Te enviaremos un código para confirmarlo."
          value={data.email}
          onChange={set("email")}
          required
        />
        <Field
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="Mínimo 8 caracteres"
          value={data.password}
          onChange={set("password")}
          minLength={8}
          required
        />
      </fieldset>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enviando código…" : "Continuar"}
      </Button>
      <p className="text-center text-xs text-muted">14 días de prueba. No pedimos tarjeta de crédito.</p>
    </form>
  );
}
