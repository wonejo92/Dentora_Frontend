import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

const motivos: Record<string, { tone: "info" | "warning"; text: string }> = {
  expirada: { tone: "info", text: "Tu sesión expiró. Vuelve a iniciar sesión." },
  suspendida: {
    tone: "warning",
    text: "Tu clínica está suspendida. Escríbenos para reactivarla.",
  },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { motivo, desde } = await searchParams;
  const notice = typeof motivo === "string" ? motivos[motivo] : undefined;

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Bienvenido de nuevo</h1>
      <p className="mt-1 mb-8 text-sm text-muted">Ingresa a la agenda de tu clínica.</p>
      {notice && (
        <div className="mb-5">
          <Alert tone={notice.tone}>{notice.text}</Alert>
        </div>
      )}
      <LoginForm desde={typeof desde === "string" ? desde : undefined} />
      <p className="mt-8 text-center text-sm text-muted">
        ¿Tu clínica aún no usa Dentora?{" "}
        <Link href="/registro" className="font-semibold text-brand-500 hover:text-brand-600">
          Prueba gratis 14 días
        </Link>
      </p>
    </>
  );
}
