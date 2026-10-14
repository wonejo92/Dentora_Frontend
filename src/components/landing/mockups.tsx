import { cn } from "@/lib/cn";

/**
 * Vistas de muestra del sistema hechas con HTML (no capturas): se ven nítidas
 * en cualquier pantalla y siguen el diseño real del panel. Son decorativas.
 */

const WEEKS = [2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8];
const TODAY = [
  { time: "09:00", name: "María José Andrade", treatment: "Limpieza dental", color: "#0E7490", status: "Atendida" },
  { time: "10:30", name: "Carlos Zambrano", treatment: "Resina · pieza 36", color: "#C8693F", status: "Confirmada" },
  {
    time: "12:00",
    name: "Ana Lucía Torres",
    treatment: "Control de ortodoncia",
    color: "#7C3AED",
    status: "Confirmada",
  },
  { time: "15:30", name: "Diego Paredes", treatment: "Valoración", color: "#0E7490", status: "Pendiente" },
];

export function DashboardMockup({ className }: { className?: string }) {
  const max = Math.max(...WEEKS);
  return (
    <div
      aria-hidden
      className={cn(
        "flex overflow-hidden rounded-2xl border border-[#073b49]/10 bg-[#f3f7f8] text-[#0f2a33] shadow-[0_30px_80px_-30px_rgba(7,59,73,0.45)]",
        className,
      )}
    >
      {/* Menú lateral */}
      <div className="hidden w-40 shrink-0 flex-col gap-1 bg-[#073b49] p-3 sm:flex">
        <div className="mb-3 flex items-center gap-2 px-1">
          <span className="flex size-7 items-center justify-center rounded-lg bg-white/10">
            <ToothGlyph className="size-4 text-white" />
          </span>
          <span className="text-sm font-bold text-white">dentora</span>
        </div>
        {["Resumen", "Agenda", "Pacientes", "Doctores", "Caja", "Reportes"].map((item, i) => (
          <span
            key={item}
            className={cn(
              "rounded-full px-3 py-1.5 text-[11px] font-medium",
              i === 0 ? "bg-white text-[#073b49]" : "text-[#b9d7de]",
            )}
          >
            {item}
          </span>
        ))}
      </div>

      {/* Contenido */}
      <div className="min-w-0 flex-1 space-y-3 p-4">
        <div className="rounded-2xl bg-white p-4">
          <p className="text-[11px] text-[#5b7580]">Citas en octubre</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold">128</span>
            <span className="rounded-full bg-[#0e7490] px-2 py-0.5 text-[10px] font-semibold text-white">+18%</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              ["Hoy", "9 citas"],
              ["Por confirmar", "3"],
              ["Online", "42%"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[#e3ecef] px-2.5 py-2">
                <p className="text-[9px] text-[#5b7580]">{label}</p>
                <p className="text-sm font-bold">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl bg-white p-4">
            <p className="mb-3 text-[11px] font-semibold">Citas por semana</p>
            <div className="flex h-20 items-end gap-1">
              {WEEKS.map((w, i) => (
                <span
                  key={i}
                  className={cn("flex-1 rounded-t", i === WEEKS.length - 1 ? "bg-[#0e7490]" : "bg-[#9fd3dd]")}
                  style={{ height: `${(w / max) * 100}%` }}
                />
              ))}
            </div>
          </div>
          <div className="hidden rounded-2xl bg-[#073b49] p-4 text-white md:block">
            <p className="text-[10px] text-[#7fb0bc]">Próxima cita</p>
            <p className="text-2xl font-bold">10:30</p>
            <p className="mt-1 text-[11px] font-semibold">Carlos Zambrano</p>
            <p className="text-[10px] text-[#b9d7de]">Resina · Dra. Pérez</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4">
          <p className="mb-2 text-[11px] font-semibold">Citas de hoy</p>
          <ul className="divide-y divide-[#e3ecef]">
            {TODAY.map((a) => (
              <li key={a.time} className="flex items-center gap-3 py-1.5 text-[11px]">
                <span className="w-9 font-semibold tabular-nums">{a.time}</span>
                <span className="h-5 w-1 rounded-full" style={{ backgroundColor: a.color }} />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-semibold">{a.name}</span>
                  <span className="text-[#5b7580]"> · {a.treatment}</span>
                </span>
                <span
                  className={cn(
                    "hidden rounded-full px-2 py-0.5 text-[9px] font-semibold sm:inline",
                    a.status === "Pendiente" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800",
                  )}
                >
                  {a.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** Celular con la página de reserva online de una clínica. */
export function PhoneBookingMockup({ className }: { className?: string }) {
  const slots = ["09:00", "09:30", "10:30", "11:00", "15:00", "15:30"];
  return (
    <div
      aria-hidden
      className={cn(
        "w-[260px] rounded-[2.5rem] border-[10px] border-[#0c1d22] bg-white text-[#0f2a33] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]",
        className,
      )}
    >
      <div className="overflow-hidden rounded-[1.8rem]">
        <div className="bg-[#7c3aed] px-4 pt-6 pb-8 text-white">
          <p className="text-[10px] opacity-80">Clínica Dental Sonrisa</p>
          <p className="text-base font-bold">Reserva tu cita</p>
          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4].map((s) => (
              <span key={s} className={cn("h-1 flex-1 rounded-full", s <= 2 ? "bg-white" : "bg-white/30")} />
            ))}
          </div>
        </div>
        <div className="-mt-4 space-y-3 rounded-t-2xl bg-white px-4 pt-4 pb-5">
          <div className="rounded-xl border border-[#e3ecef] p-2.5">
            <p className="text-[9px] text-[#5b7580]">Tratamiento</p>
            <p className="text-[11px] font-semibold">Limpieza dental · 30 min · $40</p>
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-semibold">Jueves 16 de octubre</p>
            <div className="grid grid-cols-3 gap-1.5">
              {slots.map((s, i) => (
                <span
                  key={s}
                  className={cn(
                    "rounded-lg border py-1.5 text-center text-[10px] font-semibold",
                    i === 2 ? "border-[#7c3aed] bg-[#7c3aed] text-white" : "border-[#e3ecef]",
                  )}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <span className="block rounded-xl bg-[#7c3aed] py-2.5 text-center text-[11px] font-semibold text-white">
            Confirmar reserva
          </span>
        </div>
      </div>
    </div>
  );
}

export function ToothGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M15 5.5 12 7 9 5.5a3.5 3.5 0 0 0-5 3.5c0 2 1 3.5 1.5 6S6 21 8 21c1.5 0 1.5-4 4-4s2.5 4 4 4c2 0 2-3.5 2.5-6S20 11 20 9a3.5 3.5 0 0 0-5-3.5Z" />
    </svg>
  );
}
