"use client";

import { saveClinic, type SettingsState } from "@/app/actions/settings";
import { Field, TextArea } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { useFormAction } from "@/components/ui/use-form-action";
import { DOCTOR_COLORS } from "@/lib/schedule";
import type { Clinic } from "@/lib/types";
import { SaveBar, SettingsCard } from "./save-bar";

/** 593991234567 → 0991234567 para mostrarlo como lo escribe la gente en Ecuador. */
const localWhatsapp = (value: string | null) =>
  value && /^5939\d{8}$/.test(value) ? `0${value.slice(3)}` : (value ?? "");

export function ClinicForm({ clinic: c }: { clinic: Clinic }) {
  const { state, pending, onSubmit } = useFormAction<SettingsState>(saveClinic, {});
  const colors = DOCTOR_COLORS.includes(c.primaryColor.toUpperCase()) ? DOCTOR_COLORS : [c.primaryColor, ...DOCTOR_COLORS];

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError message={state.error} />

      <SettingsCard title="Datos generales" description="Así aparece tu clínica en el panel y en su web de reservas.">
        <Field label="Nombre de la clínica" name="name" defaultValue={c.name} minLength={3} maxLength={80} required />
        <Field
          label="RUC"
          name="ruc"
          defaultValue={c.ruc ?? ""}
          inputMode="numeric"
          placeholder="1790012345001"
          hint="Opcional. Se valida con las reglas del SRI."
        />
        <TextArea
          label="Descripción"
          name="description"
          defaultValue={c.description ?? ""}
          maxLength={1000}
          placeholder="Odontología general y estética en el norte de Quito…"
          hint="Se muestra en la web de reservas."
        />
      </SettingsCard>

      <SettingsCard title="Contacto" description="Los pacientes verán estos datos en tu web de reservas.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Teléfono" name="phone" type="tel" defaultValue={c.phone ?? ""} placeholder="022345678" />
          <Field
            label="WhatsApp"
            name="whatsapp"
            type="tel"
            defaultValue={localWhatsapp(c.whatsapp)}
            placeholder="0991234567"
            hint="Celular para que los pacientes te escriban."
          />
        </div>
        <Field label="Correo" name="email" type="email" defaultValue={c.email ?? ""} placeholder="contacto@clinica.ec" />
        <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Field label="Dirección" name="address" defaultValue={c.address ?? ""} placeholder="Av. Amazonas N24-03 y Colón" />
          <Field label="Ciudad" name="city" defaultValue={c.city ?? ""} placeholder="Quito" />
        </div>
      </SettingsCard>

      <SettingsCard title="Marca" description="El color y el logo personalizan la web de reservas de tu clínica.">
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Color principal</legend>
          <div className="flex flex-wrap items-center gap-2">
            {colors.map((color) => (
              <label key={color} className="cursor-pointer" title={color}>
                <input
                  type="radio"
                  name="primaryColor"
                  value={color}
                  defaultChecked={color.toUpperCase() === c.primaryColor.toUpperCase()}
                  className="peer sr-only"
                />
                <span
                  className="block size-9 rounded-full ring-offset-2 transition peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500"
                  style={{ backgroundColor: color }}
                />
              </label>
            ))}
          </div>
        </fieldset>
        <Field
          label="URL del logo"
          name="logoUrl"
          type="url"
          defaultValue={c.logoUrl?.startsWith("http") ? c.logoUrl : ""}
          placeholder="https://…/logo.png"
          hint="Pronto podrás subir la imagen directamente."
        />
      </SettingsCard>

      <SaveBar pending={pending} saved={!!state.ok} />
    </form>
  );
}
