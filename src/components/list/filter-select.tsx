"use client";

import { cn } from "@/lib/cn";
import { useUrlParams } from "./use-url-params";

export type FilterOption = { value: string; label: string };

/** Filtro tipo píldora: se resalta cuando tiene un valor elegido. */
export function FilterSelect({
  param,
  label,
  options,
  allLabel = "Todos",
}: {
  param: string;
  label: string;
  options: FilterOption[];
  allLabel?: string;
}) {
  const { get, set } = useUrlParams();
  const value = get(param);

  return (
    <label
      className={cn(
        "flex h-11 items-center gap-1.5 rounded-xl border bg-white pl-3.5 text-sm transition-colors focus-within:ring-4 focus-within:ring-brand-50",
        value ? "border-brand-500 text-brand-700" : "border-line text-muted hover:border-brand-200",
      )}
    >
      <span className="whitespace-nowrap">{label}:</span>
      <select
        value={value}
        onChange={(e) => set({ [param]: e.target.value || null })}
        className="h-full cursor-pointer appearance-none bg-transparent pr-8 font-semibold text-ink focus:outline-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235b7580' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
        }}
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Botón para quitar todos los filtros, visible solo si hay alguno activo. */
export function ClearFilters({ params }: { params: string[] }) {
  const { get, set } = useUrlParams();
  if (!params.some((p) => get(p))) return null;
  return (
    <button
      type="button"
      onClick={() => set(Object.fromEntries(params.map((p) => [p, null])))}
      className="h-11 px-2 text-sm font-semibold text-brand-500 hover:text-brand-600"
    >
      Limpiar filtros
    </button>
  );
}
