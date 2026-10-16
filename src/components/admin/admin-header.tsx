import Link from "next/link";
import { ToothIcon } from "@/components/panel/icons";
import { UserMenu } from "@/components/panel/user-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Logo } from "@/components/ui/logo";
import type { Me } from "@/lib/types";

/** Barra superior del super-admin. */
export function AdminHeader({ me }: { me: Me }) {
  return (
    <header className="flex items-center justify-between gap-4 px-4 py-5 sm:px-8">
      <Link href="/admin" className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-night-900 text-brand-200">
          <ToothIcon />
        </span>
        <Logo />
        <span className="rounded-full bg-night-900 px-2.5 py-1 text-[11px] font-semibold text-white">admin</span>
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle className="bg-surface" />
        <UserMenu me={me} />
      </div>
    </header>
  );
}
