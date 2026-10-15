import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function ResetPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Recupera tu contraseña</h1>
      <p className="mt-1 mb-8 text-sm text-muted">Te enviamos un código a tu correo para crear una nueva.</p>
      <ResetForm />
      <p className="mt-8 text-center text-sm text-muted">
        ¿La recordaste?{" "}
        <Link href="/login" className="font-semibold text-brand-500 hover:text-brand-600">
          Inicia sesión
        </Link>
      </p>
    </>
  );
}
