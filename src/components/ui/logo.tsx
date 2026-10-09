import { cn } from "@/lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("text-xl font-bold tracking-tight text-brand-500", className)}>
      dentora
    </span>
  );
}
