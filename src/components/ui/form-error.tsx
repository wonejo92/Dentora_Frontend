"use client";

import { useEffect, useRef } from "react";
import { Alert } from "./alert";

/** Mensaje de error de un formulario; al aparecer se desplaza a la vista. */
export function FormError({ message }: { message?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message) ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [message]);

  if (!message) return null;
  return (
    <div ref={ref}>
      <Alert>{message}</Alert>
    </div>
  );
}
