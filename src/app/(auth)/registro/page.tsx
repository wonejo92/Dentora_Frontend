import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Prueba gratis" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Crea tu clínica</h1>
      <p className="mt-1 mb-8 text-sm text-muted">En 2 minutos tienes tu agenda lista.</p>
      <RegisterForm />
      <p className="mt-8 text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-brand-500 hover:text-brand-600">
          Inicia sesión
        </Link>
      </p>
    </>
  );
}
