"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const tabs = [
  { href: "/panel/ajustes", label: "Clínica" },
  { href: "/panel/ajustes/agenda", label: "Agenda" },
  { href: "/panel/ajustes/personal", label: "Personal" },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones de ajustes" className="flex gap-1 overflow-x-auto">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active ? "bg-night-900 text-white" : "bg-surface text-muted hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
