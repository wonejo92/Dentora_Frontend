import { Button } from "@/components/ui/button";

/** Barra inferior de un formulario de ajustes. La confirmación sale como toast. */
export function SaveBar({ pending }: { pending: boolean }) {
  return (
    <div className="flex items-center justify-end gap-3">
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </div>
  );
}

export function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-5 rounded-3xl bg-surface p-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
