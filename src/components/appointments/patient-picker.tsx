"use client";

import { useEffect, useState } from "react";
import { savePatient, type PatientFormState } from "@/app/actions/patients";
import { searchPatients } from "@/app/actions/appointments";
import { SearchIcon } from "@/components/panel/icons";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { useFormAction } from "@/components/ui/use-form-action";
import { idTypeLabels, initials } from "@/lib/labels";
import type { Patient } from "@/lib/types";

const MIN_CHARS = 2;

/** Busca un paciente (sin tildes, en cualquier orden) o lo crea sin salir de la ventana. */
export function PatientPicker({ onSelect }: { onSelect: (patient: Patient) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ q: string; items: Patient[] } | null>(null);
  const [creating, setCreating] = useState(false);
  // Por privacidad, la lista solo aparece al buscar (mínimo 2 caracteres).
  const searching = q.trim().length >= MIN_CHARS;
  const loading = searching && results?.q !== q;

  useEffect(() => {
    if (q.trim().length < MIN_CHARS) return;
    let active = true;
    const timer = setTimeout(() => {
      searchPatients(q).then((items) => active && setResults({ q, items }));
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [q]);

  if (creating) {
    return <QuickPatientForm initialName={q} onCancel={() => setCreating(false)} onCreated={onSelect} />;
  }

  return (
    <div className="space-y-2">
      <label className="flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-muted focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-50">
        <SearchIcon />
        <span className="sr-only">Buscar paciente</span>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nombre, cédula o teléfono"
          className="w-full bg-transparent text-sm text-ink placeholder:text-muted/70 focus:outline-none"
        />
        {loading && <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-brand-100 border-t-brand-500" />}
      </label>

      <ul className="max-h-60 divide-y divide-line overflow-y-auto rounded-xl border border-line">
        {!searching && (
          <li className="px-3 py-3 text-sm text-muted">Escribe el nombre, la cédula o el teléfono del paciente.</li>
        )}
        {searching && results?.q === q && results.items.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onSelect(p)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-brand-50"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
                {initials(`${p.firstName.split(" ")[0]} ${p.lastName}`)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {p.firstName} {p.lastName}
                </span>
                <span className="block text-xs text-muted tabular-nums">
                  {idTypeLabels[p.idType]} {p.idNumber}
                  {p.phone && ` · ${p.phone}`}
                </span>
              </span>
            </button>
          </li>
        ))}
        {searching && !loading && results?.items.length === 0 && (
          <li className="px-3 py-4 text-center text-sm text-muted">Ningún paciente coincide con &quot;{q}&quot;</li>
        )}
        <li>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
          >
            + Registrar paciente nuevo
          </button>
        </li>
      </ul>
    </div>
  );
}

function QuickPatientForm({
  initialName,
  onCancel,
  onCreated,
}: {
  initialName: string;
  onCancel: () => void;
  onCreated: (patient: Patient) => void;
}) {
  const { state, pending, onSubmit } = useFormAction<PatientFormState>(async (prev, formData) => {
    const result = await savePatient(prev, formData);
    if (result.ok && result.patient) onCreated(result.patient);
    return result;
  }, {});
  // Si lo que se buscó parece un nombre, se aprovecha para prellenar el formulario.
  const looksLikeName = initialName && !/\d/.test(initialName);
  const [first = "", ...rest] = looksLikeName ? initialName.trim().split(/\s+/) : [];

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
      <p className="text-sm font-semibold">Paciente nuevo</p>
      <FormError message={state.error} />
      <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
        <Select label="Tipo" name="idType" defaultValue="CEDULA">
          {Object.entries(idTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Field label="Número" name="idNumber" inputMode="numeric" placeholder="1710034065" required autoFocus />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombres" name="firstName" defaultValue={first} required />
        <Field label="Apellidos" name="lastName" defaultValue={rest.join(" ")} required />
      </div>
      <Field label="Celular" name="phone" type="tel" placeholder="0991234567" hint="Opcional. Para recordatorios." />
      <label className="flex cursor-pointer items-start gap-2.5 text-xs">
        <input type="checkbox" name="dataConsent" required className="mt-0.5 size-4 accent-brand-500" />
        <span>El paciente autorizó el tratamiento de sus datos personales (LOPDP).</span>
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="h-9">
          Volver a buscar
        </Button>
        <Button type="submit" disabled={pending} className="h-9">
          {pending ? "Guardando…" : "Registrar y continuar"}
        </Button>
      </div>
    </form>
  );
}
