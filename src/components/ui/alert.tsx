import { cn } from "@/lib/cn";

const tones = {
  error: "bg-red-50 text-red-700 border-red-100",
  info: "bg-brand-50 text-brand-700 border-brand-100",
  warning: "bg-amber-50 text-amber-800 border-amber-100",
};

export function Alert({
  tone = "error",
  children,
}: {
  tone?: keyof typeof tones;
  children: React.ReactNode;
}) {
  return (
    <div role="alert" className={cn("rounded-xl border px-4 py-3 text-sm", tones[tone])}>
      {children}
    </div>
  );
}
