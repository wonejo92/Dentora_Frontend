"use client";

import { useUrlParams } from "./use-url-params";

export function PageSizeSelect({ value, sizes, fallback }: { value: number; sizes: number[]; fallback: number }) {
  const { set } = useUrlParams();
  return (
    <select
      aria-label="Elementos por página"
      value={value}
      onChange={(e) => set({ porPagina: Number(e.target.value) === fallback ? null : e.target.value })}
      className="h-10 cursor-pointer appearance-none rounded-full border border-line bg-white pr-9 pl-4 font-semibold text-ink tabular-nums transition-colors hover:border-brand-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-50 focus:outline-none"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235b7580' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
      }}
    >
      {sizes.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}
