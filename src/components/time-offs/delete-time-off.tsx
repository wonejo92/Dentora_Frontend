"use client";

import { useState, useTransition } from "react";
import { deleteTimeOff } from "@/app/actions/time-offs";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Modal } from "@/components/ui/modal";

export function DeleteTimeOff({ id, label }: { id: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      const result = await deleteTimeOff(id);
      if (result.ok) setOpen(false);
      else setError(result.error);
    });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
      >
        Eliminar
      </button>
      {open && (
        <Modal
          open
          onClose={() => setOpen(false)}
          title="Eliminar bloqueo"
          description={label}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Volver
              </Button>
              <Button type="button" onClick={confirm} disabled={pending} className="bg-red-600 hover:bg-red-700">
                {pending ? "Eliminando…" : "Eliminar"}
              </Button>
            </>
          }
        >
          <FormError message={error} />
          <p className="text-sm text-muted">Esas fechas vuelven a estar disponibles para agendar citas.</p>
        </Modal>
      )}
    </>
  );
}
