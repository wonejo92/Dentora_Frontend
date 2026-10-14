"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";

type Plan = { name: string; price: number; reason: string };

/** Mismas reglas que las tarjetas de precios: doctores y módulos definen el plan. */
function recommend(doctors: number, clinical: boolean, reports: boolean): Plan {
  if (doctors > 5 || reports) {
    return {
      name: "Clínica",
      price: 69,
      reason: reports ? "Incluye los reportes del negocio." : "Más de 5 doctores necesita el plan Clínica.",
    };
  }
  if (doctors > 1 || clinical) {
    return {
      name: "Pro",
      price: 39,
      reason: clinical ? "Incluye historia clínica, presupuestos y caja." : "Hasta 5 doctores con el plan Pro.",
    };
  }
  return { name: "Básico", price: 19, reason: "Agenda y reservas online para un doctor." };
}

/** Calculadora: el visitante indica cómo es su clínica y ve el plan que le corresponde. */
export function PlanCalculator({ serifClass }: { serifClass: string }) {
  const [doctors, setDoctors] = useState(1);
  const [clinical, setClinical] = useState(false);
  const [reports, setReports] = useState(false);
  const plan = recommend(doctors, clinical, reports);

  return (
    <div className="grid overflow-hidden rounded-[2rem] border border-line bg-canvas md:grid-cols-[1.3fr_1fr]">
      <div className="space-y-7 p-7 sm:p-9">
        <div>
          <p id="calc-doctors" className="font-semibold">
            ¿Cuántos doctores atienden en tu clínica?
          </p>
          <div className="mt-3 flex items-center gap-4" role="group" aria-labelledby="calc-doctors">
            <StepButton
              label="Un doctor menos"
              onClick={() => setDoctors((d) => Math.max(1, d - 1))}
              disabled={doctors === 1}
            >
              −
            </StepButton>
            <output aria-live="polite" className={cn(serifClass, "w-14 text-center text-5xl tabular-nums")}>
              {doctors}
            </output>
            <StepButton
              label="Un doctor más"
              onClick={() => setDoctors((d) => Math.min(30, d + 1))}
              disabled={doctors === 30}
            >
              +
            </StepButton>
          </div>
        </div>

        <fieldset>
          <legend className="font-semibold">¿Qué más necesitas?</legend>
          <div className="mt-3 space-y-2.5">
            <Toggle
              checked={clinical}
              onChange={setClinical}
              title="Historia clínica, presupuestos y caja"
              text="Evoluciones con CIE-10, presupuestos en PDF y cobros con recibo."
            />
            <Toggle
              checked={reports}
              onChange={setReports}
              title="Reportes del negocio"
              text="Ingresos, inasistencias y tratamientos, comparados mes a mes."
            />
          </div>
        </fieldset>
      </div>

      <div className="flex flex-col justify-between gap-8 bg-night-900 p-7 text-white sm:p-9">
        <div aria-live="polite">
          <p className="text-sm text-night-200">Tu plan recomendado</p>
          <p className={cn(serifClass, "mt-1 text-5xl")}>{plan.name}</p>
          <p className="mt-4 flex items-baseline gap-1.5">
            <span className={cn(serifClass, "text-6xl tracking-[-0.03em]")}>${plan.price}</span>
            <span className="text-sm text-night-200">al mes</span>
          </p>
          <p className="mt-3 text-sm text-night-200">{plan.reason}</p>
        </div>
        <Link
          href="/registro"
          className="rounded-full bg-white py-3 text-center text-sm font-semibold text-[#073b49] hover:bg-brand-50"
        >
          Probar {plan.name} gratis 14 días
        </Link>
      </div>
    </div>
  );
}

function StepButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-full border border-line bg-surface text-xl text-brand-600 transition-colors hover:border-brand-200 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  title,
  text,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  text: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-colors",
        checked ? "border-brand-500 bg-surface" : "border-line hover:border-brand-200",
      )}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-brand-500 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-50 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
      />
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-sm text-muted">{text}</span>
      </span>
    </label>
  );
}
