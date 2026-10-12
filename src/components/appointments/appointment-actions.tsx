"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { changeAppointmentStatus, getBookingOptions, rescheduleAppointment } from "@/app/actions/appointments";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { formatTime, localDate } from "@/lib/time";
import type { Appointment, AppointmentStatus, DoctorOption } from "@/lib/types";
import { SlotPicker, type SlotSelection } from "./slot-picker";

type Dialog = "cancel" | "reschedule" | null;

/**
 * Acciones de una cita según su estado, en un menú "···".
 * `canChart`: el usuario puede escribir en la historia clínica (dueño o doctor).
 */
export function AppointmentActions({
  appointment: a,
  timeZone,
  canChart = false,
}: {
  appointment: Appointment;
  timeZone: string;
  canChart?: boolean;
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notice, setNotice] = useState<{ error: string } | "chart" | null>(null);
  const chartHref = `/panel/pacientes/${a.patient.id}?tab=historia&cita=${a.id}`;
  const [pending, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { pos: menuPos, ref: menuRef, open: openMenu, close: closeMenu } = useFloating(buttonRef);
  const {
    pos: noticePos,
    ref: noticeRef,
    open: openNotice,
    close: closeNotice,
  } = useFloating(buttonRef, () => setNotice(null));

  const showNotice = (value: { error: string } | "chart") => {
    setNotice(value);
    openNotice();
  };

  const setStatus = (status: AppointmentStatus) => {
    closeMenu();
    closeNotice();
    startTransition(async () => {
      const result = await changeAppointmentStatus(a.id, status);
      if (!result.ok) showNotice({ error: result.error });
      else if (status === "COMPLETED" && canChart) showNotice("chart");
    });
  };

  const open = (d: Dialog) => {
    closeMenu();
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
        onClick={() => (menuPos ? closeMenu() : openMenu())}
        aria-haspopup="menu"
        aria-expanded={!!menuPos}
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

      {noticePos && notice && (
        <div
          ref={noticeRef}
          role={notice === "chart" ? "status" : "alert"}
          style={{ top: noticePos.top, right: noticePos.right }}
          className="fixed z-50 w-64 rounded-2xl border border-line bg-surface p-3 text-left text-sm shadow-xl shadow-black/10"
        >
          {notice === "chart" ? (
            <>
              <p className="font-semibold">Cita atendida</p>
              <p className="text-xs text-muted">¿Registras la evolución ahora?</p>
              <div className="mt-2.5 flex justify-end gap-2">
                <button type="button" onClick={closeNotice} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-canvas">
                  Después
                </button>
                <Link href={chartHref} className="rounded-lg bg-brand-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-600">
                  Registrar evolución
                </Link>
              </div>
            </>
          ) : (
            <p className="text-xs text-red-600">{notice.error}</p>
          )}
        </div>
      )}

      {menuPos && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: menuPos.top, right: menuPos.right }}
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
          {canChart && a.status === "COMPLETED" && (
            <Link href={chartHref} role="menuitem" className="block px-4 py-2.5 text-sm transition-colors hover:bg-canvas">
              Registrar evolución
            </Link>
          )}
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

type FloatingPos = { top: number; right: number; anchorTop: number };

/**
 * Capa con posición fija junto al botón: no la recortan tablas con scroll ni
 * tarjetas con overflow. Si no cabe debajo, se abre hacia arriba. Se cierra con
 * Esc, al hacer clic fuera, con scroll o al cambiar el tamaño de la ventana.
 */
function useFloating(anchorRef: React.RefObject<HTMLElement | null>, onClose?: () => void) {
  const [pos, setPos] = useState<FloatingPos | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const open = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right, anchorTop: rect.top });
  };
  const close = () => {
    setPos(null);
    onCloseRef.current?.();
  };

  useLayoutEffect(() => {
    const el = ref.current;
    if (!pos || !el) return;
    const height = el.offsetHeight;
    if (pos.top + height > window.innerHeight - 8 && pos.anchorTop - height - 6 > 8) {
      el.style.top = `${pos.anchorTop - height - 6}px`;
    }
  }, [pos]);

  useEffect(() => {
    if (!pos) return;
    const dismiss = (e: Event) => {
      if (e.type === "keydown" && (e as KeyboardEvent).key !== "Escape") return;
      const target = e.target as Node;
      if (e.type === "mousedown" && (ref.current?.contains(target) || anchorRef.current?.contains(target))) return;
      setPos(null);
      onCloseRef.current?.();
    };
    document.addEventListener("mousedown", dismiss);
    document.addEventListener("keydown", dismiss);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("mousedown", dismiss);
      document.removeEventListener("keydown", dismiss);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [pos, anchorRef]);

  return { pos, ref, open, close };
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
