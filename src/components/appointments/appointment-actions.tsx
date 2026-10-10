"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { changeAppointmentStatus, getBookingOptions, rescheduleAppointment } from "@/app/actions/appointments";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { formatTime, localDate } from "@/lib/time";
import type { Appointment, AppointmentStatus, DoctorOption } from "@/lib/types";
import { SlotPicker, type SlotSelection } from "./slot-picker";

type Dialog = "cancel" | "reschedule" | null;

/** Acciones de una cita según su estado, en un menú "···". */
export function AppointmentActions({ appointment: a, timeZone }: { appointment: Appointment; timeZone: string }) {
  const [menu, setMenu] = useState<{ top: number; right: number } | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Menú con posición fija: no lo recortan tablas con scroll ni tarjetas con overflow.
  const openMenu = () => {
    const rect = buttonRef.current!.getBoundingClientRect();
    setMenu({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
  };

  useEffect(() => {
    if (!menu) return;
    const close = (e: Event) => {
      if (e.type === "keydown" && (e as KeyboardEvent).key !== "Escape") return;
      if (e.type === "mousedown" && (menuRef.current?.contains(e.target as Node) || buttonRef.current?.contains(e.target as Node))) return;
      setMenu(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menu]);

  const setStatus = (status: AppointmentStatus) => {
    setMenu(null);
    setError(undefined);
    startTransition(async () => {
      const result = await changeAppointmentStatus(a.id, status);
      if (!result.ok) setError(result.error);
    });
  };

  const open = (d: Dialog) => {
    setMenu(null);
    setDialog(d);
  };

  type Item = { label: string; onClick: () => void; tone?: "danger" };
  const items: Item[] = [];
  if (a.status === "PENDING") items.push({ label: "Confirmar", onClick: () => setStatus("CONFIRMED") });
  if (a.status === "CONFIRMED") {
    items.push({ label: "Marcar como atendida", onClick: () => setStatus("COMPLETED") });
    items.push({ label: "No asistió", onClick: () => setStatus("NO_SHOW") });
  }
  if (a.status === "PENDING" || a.status === "CONFIRMED") {
    items.push({ label: "Reprogramar", onClick: () => open("reschedule") });
    items.push({ label: "Cancelar cita", onClick: () => open("cancel"), tone: "danger" });
  }
  if (a.status === "COMPLETED" || a.status === "NO_SHOW") {
    items.push({ label: "Volver a confirmada", onClick: () => setStatus("CONFIRMED") });
  }
  if (a.status === "CANCELLED") items.push({ label: "Reactivar cita", onClick: () => setStatus("CONFIRMED") });

  return (
    <span className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (menu ? setMenu(null) : openMenu())}
        aria-haspopup="menu"
        aria-expanded={!!menu}
        aria-label={`Acciones de la cita de ${a.patient.firstName} ${a.patient.lastName}`}
        disabled={pending}
        className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-50"
      >
        {pending ? (
          <span className="size-4 animate-spin rounded-full border-2 border-brand-100 border-t-brand-500" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        )}
      </button>

      {error && (
        <p role="alert" className="absolute top-full right-0 z-10 mt-1 w-64 rounded-lg bg-red-50 px-3 py-2 text-left text-xs text-red-700 shadow-md">
          {error}
        </p>
      )}

      {menu && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: menu.top, right: menu.right }}
          className="fixed z-50 w-56 overflow-hidden rounded-2xl border border-line bg-surface py-1 text-left shadow-xl shadow-black/10"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={item.onClick}
              className={cn(
                "block w-full px-4 py-2.5 text-left text-sm transition-colors",
                item.tone === "danger" ? "text-red-600 hover:bg-red-50" : "hover:bg-canvas",
              )}
            >
              {item.label}
            </button>
          ))}
          <Link
            href={`/panel/pacientes/${a.patient.id}`}
            role="menuitem"
            className="block border-t border-line px-4 py-2.5 text-sm transition-colors hover:bg-canvas"
          >
            Ver ficha del paciente
          </Link>
        </div>
      )}

      {dialog === "cancel" && <CancelDialog appointment={a} timeZone={timeZone} onClose={() => setDialog(null)} />}
      {dialog === "reschedule" && (
        <RescheduleDialog appointment={a} timeZone={timeZone} onClose={() => setDialog(null)} />
      )}
    </span>
  );
}

const describe = (a: Appointment, timeZone: string) =>
  `${a.patient.firstName} ${a.patient.lastName} · ${new Intl.DateTimeFormat("es-EC", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(new Date(a.startsAt))} a las ${formatTime(a.startsAt, timeZone)}`;

const CANCEL_REASONS = ["El paciente avisó que no puede", "Reprogramará más adelante", "El doctor no está disponible"];

function CancelDialog({ appointment: a, timeZone, onClose }: { appointment: Appointment; timeZone: string; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      const result = await changeAppointmentStatus(a.id, "CANCELLED", reason.trim());
      if (result.ok) onClose();
      else setError(result.error);
    });

  return (
    <Modal
      open
      onClose={onClose}
      title="Cancelar cita"
      description={describe(a, timeZone)}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Volver
          </Button>
          <Button type="button" onClick={confirm} disabled={pending} className="bg-red-600 hover:bg-red-700">
            {pending ? "Cancelando…" : "Cancelar cita"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <FormError message={error} />
        <p className="text-sm text-muted">El horario quedará libre para otro paciente.</p>
        <div className="flex flex-wrap gap-2">
          {CANCEL_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                reason === r ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line hover:border-brand-200",
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Motivo (opcional)"
          className="w-full resize-y rounded-xl border border-line px-3.5 py-2.5 text-sm placeholder:text-muted/70 focus:border-brand-500 focus:ring-4 focus:ring-brand-50 focus:outline-none"
        />
      </div>
    </Modal>
  );
}

function RescheduleDialog({ appointment: a, timeZone, onClose }: { appointment: Appointment; timeZone: string; onClose: () => void }) {
  const [doctors, setDoctors] = useState<DoctorOption[] | null>(null);
  const [slot, setSlot] = useState<SlotSelection | null>(null);
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const [pending, startTransition] = useTransition();
  const today = localDate(new Date(), timeZone);

  useEffect(() => {
    getBookingOptions().then(({ treatments, doctors }) => {
      const treatment = treatments.find((t) => t.id === a.treatment.id);
      setDoctors(doctors.filter((d) => treatment?.doctors.some((td) => td.id === d.id)));
    });
  }, [a.treatment.id]);

  const confirm = () => {
    if (!slot) return;
    startTransition(async () => {
      const result = await rescheduleAppointment(a.id, slot);
      if (result.ok) return onClose();
      setError(result.error);
      setSlot(null);
      setAttempt((n) => n + 1);
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Reprogramar cita"
      description={`${a.treatment.name} · ${describe(a, timeZone)}`}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Volver
          </Button>
          <Button type="button" onClick={confirm} disabled={!slot || pending}>
            {pending ? "Guardando…" : "Mover cita aquí"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormError message={error} />
        {!doctors ? (
          <div className="h-40 animate-pulse rounded-2xl bg-canvas" />
        ) : doctors.length === 0 ? (
          <p className="text-sm text-muted">Ningún doctor activo realiza este tratamiento.</p>
        ) : (
          <SlotPicker
            key={attempt}
            treatmentId={a.treatment.id}
            doctors={doctors}
            timeZone={timeZone}
            today={today}
            initialDate={localDate(new Date(a.startsAt), timeZone)}
            initialDoctorId={doctors.some((d) => d.id === a.doctor.id) ? a.doctor.id : ""}
            selected={slot}
            onSelect={setSlot}
          />
        )}
      </div>
    </Modal>
  );
}
