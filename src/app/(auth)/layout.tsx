import { Logo } from "@/components/ui/logo";

const highlights = [
  "Agenda por doctor con horarios que se calculan solos",
  "Reservas online desde la web de tu clínica",
  "Fichas de pacientes listas para la LOPDP",
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="hidden flex-col justify-between bg-brand-500 p-12 text-brand-50 lg:flex">
        <Logo className="text-white" />
        <div>
          <h2 className="max-w-md text-3xl leading-tight font-bold tracking-tight text-white">
            Tu clínica dental, organizada en un solo lugar.
          </h2>
          <ul className="mt-8 space-y-3 text-sm">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-100" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-brand-100">Hecho en Ecuador</p>
      </aside>
      <main className="flex items-center justify-center bg-white px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Logo className="mb-10 block lg:hidden" />
          {children}
        </div>
      </main>
    </div>
  );
}
