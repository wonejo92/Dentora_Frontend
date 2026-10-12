"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { bookPublic, getNextAvailable, getPublicAvailability } from "@/app/actions/public";
import { SlotPicker, type SlotSelection } from "@/components/appointments/slot-picker";
import { Button } from "@/components/ui/button";
import { Field, Select, TextArea } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { cn } from "@/lib/cn";
import { formatDuration, formatPrice } from "@/lib/format";
import { idTypeLabels, initials } from "@/lib/labels";
import { formatTime, localDate } from "@/lib/time";
import type { NextAvailable, PublicBooking, PublicClinic } from "@/lib/types";
import {
  BoltIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  ReceiptOffIcon,
  ShieldLockIcon,
  ToothIcon,
  UserIcon,
  UsersIcon,
  WhatsappIcon,
} from "@/components/panel/icons";
import { TreatmentIcon } from "./treatment-icon";

const STEPS = ["Tratamiento", "Doctor", "Fecha y hora", "Tus datos"];
const ANY = "any";

type Clinic = PublicClinic["clinic"];

/**
 * Reserva online: franja con los pasos, el paso actual a la izquierda y un resumen
 * fijo a la derecha (en celular, una barra inferior). Pensada primero para celular.
 */
export function BookingFlow({ data, initialTreatmentId }: { data: PublicClinic; initialTreatmentId?: string }) {
  const { clinic } = data;
  const tz = clinic.timezone;
  const treatments = data.treatments.filter((t) => t.doctorIds.length > 0);
  // Si viene desde "Reservar" en un servicio de la landing, arranca con ese tratamiento elegido.
  const preset = treatments.find((t) => t.id === initialTreatmentId);
  const presetSingleDoctor = preset?.doctorIds.length === 1;

  const [step, setStep] = useState(preset ? (presetSingleDoctor ? 2 : 1) : 0);
  const [treatmentId, setTreatmentId] = useState(preset?.id ?? "");
  const [doctorChoice, setDoctorChoice] = useState(presetSingleDoctor ? preset.doctorIds[0] : "");
  const [slot, setSlot] = useState<SlotSelection | null>(null);
  const [error, setError] = useState<string>();
  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [pending, startTransition] = useTransition();

  const treatment = treatments.find((t) => t.id === treatmentId);
  const singleDoctor = treatment?.doctorIds.length === 1;
  const treatmentDoctors = data.doctors.filter((d) => treatment?.doctorIds.includes(d.id));
  const pickerDoctors = (doctorChoice && doctorChoice !== ANY
    ? treatmentDoctors.filter((d) => d.id === doctorChoice)
    : treatmentDoctors
  ).map((d) => ({ id: d.id, fullName: d.fullName, color: clinic.primaryColor }));
  const chosenDoctor = data.doctors.find((d) => d.id === (slot?.doctorId ?? (doctorChoice !== ANY ? doctorChoice : "")));

  const fetchSlots = useCallback(
    (tId: string, date: string, dId?: string) => getPublicAvailability(clinic.slug, tId, date, dId),
    [clinic.slug],
  );

  const chooseTreatment = (id: string) => {
    const t = treatments.find((x) => x.id === id)!;
    setTreatmentId(id);
    setSlot(null);
    // Con un solo doctor no tiene sentido preguntar: se salta el paso.
    if (t.doctorIds.length === 1) {
      setDoctorChoice(t.doctorIds[0]);
      setStep(2);
    } else {
      setDoctorChoice("");
      setStep(1);
    }
  };

  const goTo = (target: number) => {
    if (target === 1 && singleDoctor) target = 0;
    setError(undefined);
    setStep(target);
  };

  const submit = (formData: FormData) => {
    if (!treatment || !slot) return;
    const text = (k: string) => String(formData.get(k) ?? "").trim();
    setError(undefined);
    startTransition(async () => {
      const result = await bookPublic(clinic.slug, {
        treatmentId: treatment.id,
        doctorId: slot.doctorId,
        startsAt: slot.startsAt,
        notes: text("notes") || undefined,
        patient: {
          idType: text("idType"),
          idNumber: text("idNumber").replace(/[\s-]/g, ""),
          firstName: text("firstName"),
          lastName: text("lastName"),
          phone: text("phone"),
          email: text("email") || undefined,
        },
      });
      if (result.ok) {
        setBooking(result.booking);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setError(result.error);
      // Si alguien tomó el horario mientras llenaba sus datos, vuelve a elegir hora.
      if (/horario/i.test(result.error)) {
        setSlot(null);
        setAttempt((n) => n + 1);
        setStep(2);
      }
    });
  };

  const restart = () => {
    setBooking(null);
    setTreatmentId("");
    setDoctorChoice("");
    setSlot(null);
    setError(undefined);
    setStep(0);
  };

  const when = slot
    ? `${new Intl.DateTimeFormat("es-EC", { timeZone: tz, weekday: "short", day: "numeric", month: "short" })
        .format(new Date(slot.startsAt))
        .replace(".", "")} · ${formatTime(slot.startsAt, tz)}`
    : null;

  return (
    <div className="pb-28 lg:pb-14">
      {/* Franja de color a todo el ancho, con el título y los pasos. */}
      <div className="relative right-1/2 left-1/2 -mx-[50vw] w-screen bg-brand-500 px-4 pt-6 pb-16 text-white">
        <div className="mx-auto max-w-5xl">
          <Link href={`/${clinic.slug}`} className="text-sm text-white/80 hover:text-white">
            ← {clinic.name}
          </Link>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{booking ? "¡Listo!" : "Reserva tu cita"}</h1>
          <p className="text-white/85">Elige, agenda y listo. Toma menos de un minuto.</p>
          {!booking && <Stepper step={step} onGo={goTo} skipDoctor={singleDoctor} />}
        </div>
      </div>

      <div className="relative -mt-10">
        {booking ? (
          <Confirmation booking={booking} clinic={clinic} onRestart={restart} />
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <div className="rounded-3xl bg-surface p-5 shadow-xl shadow-black/5 sm:p-7">
              <FormError message={error} />

              {step === 0 && (
                <section>
                  <StepTitle title="¿Qué necesitas?" subtitle="Elige el tratamiento. Los precios son referenciales." />
                  {treatments.length === 0 ? (
                    <p className="text-sm text-muted">Por ahora la reserva online no está disponible. Comunícate con la clínica.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {treatments.map((t) => {
                        const selected = t.id === treatmentId;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => chooseTreatment(t.id)}
                            aria-pressed={selected}
                            className={cn(
                              "relative flex flex-col rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
                              selected ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500" : "border-line hover:border-brand-200",
                            )}
                          >
                            {selected ? (
                              <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-brand-500 text-xs text-white">✓</span>
                            ) : (
                              t.popular && (
                                <span className="absolute top-3 right-3 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                  Más reservado
                                </span>
                              )
                            )}
                            <span className={cn("flex size-10 items-center justify-center rounded-xl text-brand-600", selected ? "bg-surface" : "bg-brand-50")}>
                              <TreatmentIcon name={t.name} />
                            </span>
                            <span className="mt-3 font-semibold">{t.name}</span>
                            {t.description && <span className="mt-0.5 line-clamp-2 text-sm text-muted">{t.description}</span>}
                            <span className="mt-auto flex items-center justify-between pt-3 text-sm">
                              <span className="flex items-center gap-1 text-muted">
                                <span className="scale-75">
                                  <ClockIcon />
                                </span>
                                {formatDuration(t.durationMin)}
                              </span>
                              {t.price !== null && (
                                <span className={cn("font-bold", Number(t.price) === 0 ? "text-green-700" : "text-brand-600")}>
                                  {formatPrice(t.price)}
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              {step === 1 && treatment && (
                <section>
                  <StepTitle title="¿Con quién quieres atenderte?" subtitle={`Doctores que realizan ${treatment.name.toLowerCase()}.`} />
                  <DoctorStep
                    slug={clinic.slug}
                    treatmentId={treatment.id}
                    doctors={treatmentDoctors}
                    timeZone={tz}
                    selected={doctorChoice}
                    onSelect={(id) => {
                      setDoctorChoice(id);
                      setSlot(null);
                      setStep(2);
                    }}
                  />
                </section>
              )}

              {step === 2 && treatment && (
                <section>
                  <StepTitle title="Elige el día y la hora" subtitle={`${treatment.name} · ${formatDuration(treatment.durationMin)}`} />
                  <SlotPicker
                    key={`${treatment.id}-${doctorChoice}-${attempt}`}
                    treatmentId={treatment.id}
                    doctors={pickerDoctors}
                    timeZone={tz}
                    today={localDate(new Date(), tz)}
                    initialDoctorId={doctorChoice !== ANY ? doctorChoice : ""}
                    selected={slot}
                    onSelect={setSlot}
                    fetchSlots={fetchSlots}
                  />
                  <div className="mt-6 hidden justify-end lg:flex">
                    <Button type="button" onClick={() => setStep(3)} disabled={!slot}>
                      Continuar →
                    </Button>
                  </div>
                </section>
              )}

              {step === 3 && treatment && slot && (
                <section>
                  <StepTitle title="Tus datos" subtitle="Los usamos solo para gestionar tu cita." />
                  {/* onSubmit (no action): si la reserva falla, los datos escritos se conservan. */}
                  <form
                    id="booking-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      submit(new FormData(e.currentTarget));
                    }}
                    className="space-y-4"
                  >
                    <div className="grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
                      <Select label="Documento" name="idType" defaultValue="CEDULA">
                        {Object.entries(idTypeLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                      <Field label="Número" name="idNumber" inputMode="numeric" autoComplete="off" placeholder="1710034065" required />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Nombres" name="firstName" autoComplete="given-name" required maxLength={60} />
                      <Field label="Apellidos" name="lastName" autoComplete="family-name" required maxLength={60} />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        label="Celular"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="0991234567"
                        minLength={7}
                        hint="Te contactaremos aquí si hay cambios."
                        required
                      />
                      <Field label="Correo" name="email" type="email" autoComplete="email" placeholder="tu@correo.com" hint="Opcional" />
                    </div>
                    <TextArea label="¿Algo que debamos saber?" name="notes" maxLength={500} placeholder="Opcional: dolor, sensibilidad, alergias…" />

                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line px-4 py-3 text-sm">
                      <input type="checkbox" required className="mt-0.5 size-4 accent-brand-500" />
                      <span>
                        Autorizo a <strong>{clinic.name}</strong> a tratar mis datos personales y de salud para gestionar mi atención.
                        <details className="mt-1 text-xs text-muted">
                          <summary className="cursor-pointer font-medium text-brand-600">Ver más</summary>
                          <p className="mt-1">
                            Conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador, tus datos se usan solo
                            para agendar y atender tus citas. Puedes pedir a la clínica acceder, corregir o eliminar tus datos
                            en cualquier momento.
                          </p>
                        </details>
                      </span>
                    </label>

                    <Button type="submit" disabled={pending} className="hidden h-12 w-full text-base lg:flex">
                      {pending ? "Reservando…" : "Confirmar reserva"}
                    </Button>
                  </form>
                </section>
              )}
            </div>

            <aside className="hidden space-y-3 lg:sticky lg:top-24 lg:block">
              <Summary
                treatmentName={treatment?.name}
                price={treatment?.price ?? null}
                doctorName={chosenDoctor?.fullName ?? (doctorChoice === ANY ? "Cualquier doctor" : undefined)}
                when={when}
                address={[clinic.address, clinic.city].filter(Boolean).join(", ")}
              />
              <TrustBadges />
              {clinic.whatsapp && <WhatsappHelp whatsapp={clinic.whatsapp} />}
            </aside>
          </div>
        )}
      </div>

      {/* Celular: el resumen y el botón de avanzar quedan fijos abajo. */}
      {!booking && treatment && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{treatment.name}</p>
              <p className="truncate text-xs text-muted">
                {when ?? "Elige día y hora"}
                {treatment.price !== null && ` · ${formatPrice(treatment.price)}`}
              </p>
            </div>
            {step === 2 && (
              <Button type="button" onClick={() => setStep(3)} disabled={!slot} className="shrink-0">
                Continuar
              </Button>
            )}
            {step === 3 && (
              <Button type="submit" form="booking-form" disabled={pending} className="shrink-0">
                {pending ? "Reservando…" : "Confirmar"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stepper({ step, onGo, skipDoctor }: { step: number; onGo: (step: number) => void; skipDoctor: boolean }) {
  return (
    <ol className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2" aria-label="Pasos de la reserva">
      {STEPS.map((label, i) => {
        const done = i < step && !(i === 1 && skipDoctor);
        const current = i === step;
        return (
          <li key={label} className="flex items-center gap-2" aria-current={current ? "step" : undefined}>
            {i > 0 && <span className="hidden h-0.5 w-6 rounded-full bg-white/40 sm:block" />}
            <button
              type="button"
              onClick={() => onGo(i)}
              disabled={i >= step}
              className={cn(
                "flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm transition-colors",
                current ? "bg-white font-semibold text-night-900" : done ? "text-white hover:bg-white/10" : "text-white/70",
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-bold",
                  current ? "bg-brand-500 text-white" : done ? "bg-white text-night-900" : "border-[1.5px] border-white/60",
                )}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={cn(!current && "hidden sm:inline")}>{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
    </div>
  );
}

function DoctorStep({
  slug,
  treatmentId,
  doctors,
  timeZone,
  selected,
  onSelect,
}: {
  slug: string;
  treatmentId: string;
  doctors: PublicClinic["doctors"];
  timeZone: string;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [next, setNext] = useState<{ treatmentId: string; items: NextAvailable[] } | null>(null);
  const loading = next?.treatmentId !== treatmentId;

  useEffect(() => {
    let active = true;
    getNextAvailable(slug, treatmentId).then((items) => active && setNext({ treatmentId, items }));
    return () => {
      active = false;
    };
  }, [slug, treatmentId]);

  const today = localDate(new Date(), timeZone);
  const label = (iso?: string) => {
    if (!iso) return "Sin horarios en los próximos días";
    const day = localDate(new Date(iso), timeZone);
    const dayText =
      day === today
        ? "hoy"
        : new Intl.DateTimeFormat("es-EC", { timeZone, weekday: "long", day: "numeric" }).format(new Date(iso));
    return `Próximo horario: ${dayText} ${formatTime(iso, timeZone)}`;
  };
  const earliest = next?.items.map((n) => n.startsAt).sort()[0];

  const card = (id: string, name: string, detail: string, avatar: React.ReactNode, nextAt: string | undefined) => (
    <button
      key={id}
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={selected === id}
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
        selected === id ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500" : "border-line hover:border-brand-200",
      )}
    >
      {avatar}
      <span className="min-w-0">
        <span className="block font-semibold">{name}</span>
        <span className="block text-sm text-muted">{detail}</span>
        {loading ? (
          <span className="mt-1 block h-3.5 w-40 animate-pulse rounded bg-canvas" />
        ) : (
          <span className={cn("mt-1 block text-xs font-medium first-letter:uppercase", nextAt ? "text-green-700" : "text-muted")}>
            {label(nextAt)}
          </span>
        )}
      </span>
    </button>
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {card(
        ANY,
        "Cualquier doctor",
        "El primer horario disponible",
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
          <UsersIcon />
        </span>,
        earliest,
      )}
      {doctors.map((d) =>
        card(
          d.id,
          d.fullName,
          d.specialty ?? "Odontología",
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
            {initials(d.fullName)}
          </span>,
          next?.items.find((n) => n.doctorId === d.id)?.startsAt,
        ),
      )}
    </div>
  );
}

function Summary({
  treatmentName,
  price,
  doctorName,
  when,
  address,
}: {
  treatmentName?: string;
  price: string | null;
  doctorName?: string;
  when: string | null;
  address: string;
}) {
  const row = (icon: React.ReactNode, label: string, value?: string | null) => (
    <div className="flex items-center gap-3 border-b border-line py-3 last:border-0">
      <span className={cn("flex size-6 shrink-0 items-center justify-center", value ? "text-brand-600" : "text-muted")}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-muted">{label}</span>
        <span className={cn("block truncate text-sm", value ? "font-semibold" : "text-muted")}>{value ?? "Por elegir"}</span>
      </span>
    </div>
  );

  return (
    <div className="rounded-3xl bg-surface p-5 shadow-xl shadow-black/5">
      <p className="mb-1 font-bold">Resumen de tu cita</p>
      {row(<ToothIcon />, "Tratamiento", treatmentName)}
      {row(<UserIcon />, "Doctor", doctorName)}
      {row(<CalendarIcon />, "Fecha y hora", when)}
      {address && row(<MapPinIcon />, "Dirección", address)}
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-sm text-muted">Total referencial</span>
        <span className="text-xl font-bold">{price === null ? "—" : formatPrice(price)}</span>
      </div>
    </div>
  );
}

function TrustBadges() {
  const items = [
    { icon: <BoltIcon />, text: "Confirmación al instante", tone: "bg-green-100 text-green-700" },
    { icon: <ReceiptOffIcon />, text: "Sin costo por reservar", tone: "bg-brand-50 text-brand-600" },
    { icon: <ShieldLockIcon />, text: "Tus datos protegidos (LOPDP)", tone: "bg-slate-100 text-slate-600" },
  ];
  return (
    <ul className="space-y-2.5 rounded-3xl bg-surface p-5 text-sm">
      {items.map((i) => (
        <li key={i.text} className="flex items-center gap-3">
          <span className={cn("flex size-8 items-center justify-center rounded-full [&_svg]:size-4", i.tone)} aria-hidden>
            {i.icon}
          </span>
          {i.text}
        </li>
      ))}
    </ul>
  );
}

function WhatsappHelp({ whatsapp }: { whatsapp: string }) {
  return (
    <a
      href={`https://wa.me/${whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-3xl bg-surface p-5 transition-colors hover:bg-canvas"
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-green-100 text-green-700" aria-hidden>
        <WhatsappIcon />
      </span>
      <span>
        <span className="block text-sm font-semibold">¿Tienes dudas?</span>
        <span className="block text-xs text-muted">Escríbenos por WhatsApp</span>
      </span>
    </a>
  );
}

/** "20261014T150000Z" para el enlace de Google Calendar. */
const gcalDate = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function Confirmation({ booking: b, clinic, onRestart }: { booking: PublicBooking; clinic: Clinic; onRestart: () => void }) {
  const tz = clinic.timezone;
  const when = `${new Intl.DateTimeFormat("es-EC", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(new Date(b.startsAt))} a las ${formatTime(b.startsAt, tz)}`;
  const confirmed = b.status === "CONFIRMED";

  const calendar = new URL("https://calendar.google.com/calendar/render");
  calendar.searchParams.set("action", "TEMPLATE");
  calendar.searchParams.set("text", `${b.treatment} · ${clinic.name}`);
  calendar.searchParams.set("dates", `${gcalDate(b.startsAt)}/${gcalDate(b.endsAt)}`);
  calendar.searchParams.set("details", `Cita con ${b.doctor}`);
  if (clinic.address) calendar.searchParams.set("location", [clinic.address, clinic.city].filter(Boolean).join(", "));

  const whatsapp = clinic.whatsapp
    ? `https://wa.me/${clinic.whatsapp}?text=${encodeURIComponent(`Hola, acabo de reservar una cita de ${b.treatment} para el ${when}.`)}`
    : null;

  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-surface p-6 text-center shadow-xl shadow-black/5 sm:p-10">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand-500 text-3xl text-white">✓</span>
      <h2 className="mt-5 text-2xl font-bold tracking-tight">{confirmed ? "¡Tu cita está confirmada!" : "¡Reserva recibida!"}</h2>
      <p className="mx-auto mt-2 max-w-md text-muted">
        {confirmed
          ? "Te esperamos. Si no puedes asistir, avísanos con anticipación."
          : "La clínica revisará tu reserva y te contactará para confirmarla."}
      </p>

      <div className="mx-auto mt-6 rounded-2xl bg-brand-50 px-5 py-4 text-left">
        <p className="font-semibold text-brand-700 first-letter:uppercase">{when}</p>
        <p className="text-sm text-brand-700/80">
          {b.treatment} · {b.doctor}
        </p>
        {clinic.address && <p className="mt-1 text-sm text-brand-700/80">{clinic.address}</p>}
      </div>

      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <a href={calendar.toString()} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center rounded-xl border border-line px-5 text-sm font-semibold hover:bg-canvas">
          Agregar a mi calendario
        </a>
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600">
            Escribir por WhatsApp
          </a>
        )}
      </div>
      <button type="button" onClick={onRestart} className="mt-6 text-sm font-medium text-muted hover:text-ink">
        Reservar otra cita
      </button>
    </div>
  );
}
