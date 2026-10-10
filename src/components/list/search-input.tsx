"use client";

import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "@/components/panel/icons";
import { cn } from "@/lib/cn";
import { useUrlParams } from "./use-url-params";

/** Buscador que filtra mientras escribes (espera 300 ms tras la última tecla). */
export function SearchInput({ placeholder, param = "q" }: { placeholder: string; param?: string }) {
  const { get, set, pending } = useUrlParams();
  const [value, setValue] = useState(get(param));
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onChange = (text: string) => {
    setValue(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => set({ [param]: text.trim() || null }), 300);
  };

  return (
    <label
      className={cn(
        "flex h-11 w-full items-center gap-2 rounded-xl border border-line bg-white px-3.5 text-muted transition-colors focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-50 sm:w-80",
      )}
    >
      <SearchIcon />
      <span className="sr-only">{placeholder}</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-ink placeholder:text-muted/70 focus:outline-none"
      />
      {pending && (
        <span
          aria-label="Buscando"
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-brand-100 border-t-brand-500"
        />
      )}
    </label>
  );
}
