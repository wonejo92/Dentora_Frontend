"use client";

import { useState } from "react";
import type { Payment } from "@/lib/types";
import { VoidPaymentDialog } from "./void-payment-dialog";

export function VoidPaymentButton({ payment }: { payment: Payment }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-red-600 hover:underline">
        Anular
      </button>
      {open && <VoidPaymentDialog payment={payment} onClose={() => setOpen(false)} />}
    </>
  );
}
