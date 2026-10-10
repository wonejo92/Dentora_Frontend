import { SettingsTabs } from "@/components/settings/settings-tabs";
import { requireClinicUser } from "@/lib/dal";

export default async function SettingsLayout({ children }: LayoutProps<"/panel/ajustes">) {
  const me = await requireClinicUser();

  return (
    <div className="w-full space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ajustes</h1>
        <p className="text-sm text-muted">Configura tu clínica, la agenda y quién tiene acceso.</p>
      </div>
      {me.role === "OWNER" ? (
        <>
          <SettingsTabs />
          {children}
        </>
      ) : (
        <section className="rounded-3xl bg-surface px-6 py-14 text-center">
          <p className="font-semibold">Solo el dueño de la clínica puede cambiar los ajustes</p>
          <p className="mt-1 text-sm text-muted">Si necesitas cambiar algo, pídeselo a quien administra la cuenta.</p>
        </section>
      )}
    </div>
  );
}
