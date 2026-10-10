"use client";

import { useUrlParams } from "./use-url-params";

/** Salto directo a una fecha (guarda `YYYY-MM-DD` en la URL). */
export function DateInput({ param = "fecha", value, label }: { param?: string; value: string; label: string }) {
  const { set } = useUrlParams();
  return (
    <label className="flex h-10 items-center rounded-xl border border-line bg-surface px-3 text-sm transition-colors focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-50 hover:border-brand-200">
      <span className="sr-only">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => e.target.value && set({ [param]: e.target.value })}
        className="bg-transparent font-medium tabular-nums focus:outline-none"
      />
    </label>
  );
}
