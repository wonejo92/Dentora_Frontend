"use client";

import { toast } from "sonner";
import { saveAgendaRules, type SettingsState } from "@/app/actions/settings";
import { Select, Switch } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { useFormAction } from "@/components/ui/use-form-action";
import type { Clinic } from "@/lib/types";
import { SaveBar, SettingsCard } from "./save-bar";

const STEPS = [10, 15, 20, 30, 60];
const NOTICE = [
  { value: 0, label: "Sin anticipación" },
  { value: 30, label: "30 minutos" },
  { value: 60, label: "1 hora" },
  { value: 120, label: "2 horas" },
  { value: 240, label: "4 horas" },
  { value: 720, label: "12 horas" },
  { value: 1440, label: "1 día" },
  { value: 2880, label: "2 días" },
];
const AHEAD = [
  { value: 7, label: "1 semana" },
  { value: 14, label: "2 semanas" },
  { value: 30, label: "1 mes" },
  { value: 60, label: "2 meses" },
  { value: 90, label: "3 meses" },
  { value: 180, label: "6 meses" },
  { value: 365, label: "1 año" },
];

/** Asegura que el valor guardado aparezca aunque no esté entre las opciones. */
function withCurrent(options: { value: number; label: string }[], current: number, label: (n: number) => string) {
  return options.some((o) => o.value === current)
    ? options
    : [...options, { value: current, label: label(current) }].sort((a, b) => a.value - b.value);
}

export function AgendaForm({ clinic: c }: { clinic: Clinic }) {
  const { state, pending, onSubmit } = useFormAction<SettingsState>(
    async (prev, formData) => {
      const result = await saveAgendaRules(prev, formData);
      if (result.ok) toast.success("Reglas de la agenda guardadas");
      return result;
    },
    {},
  );
  const steps = STEPS.includes(c.slotStepMin) ? STEPS : [...STEPS, c.slotStepMin].sort((a, b) => a - b);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError message={state.error} />

      <SettingsCard
        title="Horarios que se ofrecen"
        description="Cada cuántos minutos aparece una hora para elegir, tanto en el panel como en la web."
      >
        <Select
          label="Intervalo entre horarios"
          name="slotStepMin"
          defaultValue={c.slotStepMin}
          hint="Con 15 minutos se ofrece 09:00, 09:15, 09:30… Con 30: 09:00, 09:30, 10:00…"
        >
          {steps.map((n) => (
            <option key={n} value={n}>
              Cada {n} minutos
            </option>
          ))}
        </Select>
      </SettingsCard>

      <SettingsCard
        title="Reservas online"
        description="Reglas para los pacientes que reservan desde la web. La recepción puede agendar sin estas restricciones."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Anticipación mínima"
            name="minBookingNoticeMin"
            defaultValue={c.minBookingNoticeMin}
            hint="Evita reservas de último minuto que la clínica no alcanza a ver."
          >
            {withCurrent(NOTICE, c.minBookingNoticeMin, (n) => `${n} minutos`).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            label="Reservar hasta"
            name="maxBookingDaysAhead"
            defaultValue={c.maxBookingDaysAhead}
            hint="Qué tan lejos en el futuro pueden reservar los pacientes."
          >
            {withCurrent(AHEAD, c.maxBookingDaysAhead, (n) => `${n} días`).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <Switch
          name="autoConfirmOnline"
          label="Confirmar automáticamente las reservas online"
          description="Si está apagado, llegan como Pendientes y la recepción las confirma desde la agenda."
          defaultChecked={c.autoConfirmOnline}
        />
        <Switch
          name="emailReminders"
          label="Recordar las citas por correo"
          description="El paciente recibe un correo el día anterior con la hora, el doctor y la dirección. Solo para citas confirmadas de pacientes con correo."
          defaultChecked={c.emailReminders}
        />
      </SettingsCard>

      <SaveBar pending={pending} />
    </form>
  );
}
