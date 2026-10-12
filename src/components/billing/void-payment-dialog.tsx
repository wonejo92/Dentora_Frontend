"use client";

import { useState, useTransition } from "react";
import { voidPayment } from "@/app/actions/billing";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Modal } from "@/components/ui/modal";
import { methodLabels, money } from "@/lib/billing";
import { cn } from "@/lib/cn";
import type { Payment } from "@/lib/types";

/** Anular un pago (solo el dueño): queda en el historial tachado y con el motivo. */
export function VoidPaymentDialog({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      const result = await voidPayment(payment.id, reason);
      if (result.ok) onClose();
      else setError(result.error);
    });

  return (
    <Modal
      open
      onClose={onClose}
      title="Anular pago"
      description={`${money(payment.amount)} · ${methodLabels[payment.method]} · ${payment.patient.firstName} ${payment.patient.lastName}`}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Volver
          </Button>
          <Button type="button" onClick={confirm} disabled={pending} className="bg-red-600 hover:bg-red-700">
            {pending ? "Anulando…" : "Anular pago"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <FormError message={error} />
        <p className="text-sm text-muted">
          El pago no se borra: queda en el historial como anulado y el saldo vuelve a subir.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          maxLength={300}
          autoFocus
          placeholder="Motivo (obligatorio), ej. Se registró dos veces"
          aria-label="Motivo de la anulación"
          className={cn(controlClass(), "w-full resize-y py-2.5")}
        />
      </div>
    </Modal>
  );
}
