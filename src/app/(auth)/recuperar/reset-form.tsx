"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { requestPasswordReset, resetPassword } from "@/app/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { VerifyAnimation } from "@/components/ui/verify-animation";
import { cn } from "@/lib/cn";

const RESEND_SECONDS = 60;
const MIN_LOADING_MS = 1200;
const SUCCESS_MS = 1800;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Recuperar contraseña en dos pasos: el correo y luego el código con la
 * contraseña nueva. Al terminar inicia sesión y muestra la animación de éxito.
 */
export function ResetForm() {
  const router = useRouter();
  const [step, setStep] = useState<"correo" | "codigo">("correo");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string>();
  const [cooldown, setCooldown] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = () =>
    startTransition(async () => {
      setError(undefined);
      const result = await requestPasswordReset(email);
      if (!result.ok) return setError(result.error);
      setStep("codigo");
      setCode("");
      setCooldown(RESEND_SECONDS);
      setTimeout(() => codeRef.current?.focus(), 0);
    });

  const change = async () => {
    if (password !== confirm) return setError("Las contraseñas no coinciden");
    setError(undefined);
    setVerifying(true);
    const [result] = await Promise.all([resetPassword({ email, code, newPassword: password }), wait(MIN_LOADING_MS)]);
    if (!result.ok) {
      setVerifying(false);
      return setError(result.error);
    }
    setDone(true);
    await wait(SUCCESS_MS);
    router.replace(result.home);
  };

  if (verifying || done) {
    return (
      <div role="status" aria-live="polite" className="flex flex-col items-center py-10 text-center">
        <VerifyAnimation status={done ? "success" : "loading"} />
        <p className="mt-6 text-lg font-bold">{done ? "¡Contraseña actualizada!" : "Verificando tu código…"}</p>
        <p className="mt-1 text-sm text-muted">{done ? "Entrando a tu cuenta." : email.trim()}</p>
      </div>
    );
  }

  if (step === "codigo") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          change();
        }}
        className="space-y-5"
      >
        {error && <Alert>{error}</Alert>}
        <div className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
          Si <span className="font-semibold">{email.trim()}</span> tiene una cuenta en Dentora, te llegará un código de
          6 dígitos. Revisa también la carpeta de spam.
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="code" className="text-sm font-medium">
            Código
          </label>
          <input
            ref={codeRef}
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            className={cn(
              "h-14 rounded-xl border border-line bg-surface text-center text-2xl font-bold tracking-[0.5em] tabular-nums",
              "placeholder:text-muted/40 focus:border-brand-500 focus:ring-4 focus:ring-brand-50 focus:outline-none",
            )}
          />
        </div>
        <Field
          label="Contraseña nueva"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          hint="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <Field
          label="Repite la contraseña nueva"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={8}
          required
        />

        <Button type="submit" disabled={code.length !== 6 || password.length < 8} className="w-full">
          Cambiar contraseña
        </Button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setStep("correo");
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
      <Field
        label="Correo de tu cuenta"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="nombre@clinica.ec"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enviando código…" : "Enviar código"}
      </Button>
    </form>
  );
}
