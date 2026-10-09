import { cn } from "@/lib/cn";

export function Field({
  label,
  name,
  error,
  hint,
  className,
  ...props
}: React.ComponentProps<"input"> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
}) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={cn(
          "h-11 rounded-xl border bg-white px-3.5 text-sm text-ink placeholder:text-muted/70 transition-colors",
          "focus:outline-none focus:ring-4 focus:ring-brand-50 focus:border-brand-500",
          error ? "border-red-400" : "border-line hover:border-brand-200",
        )}
        {...props}
      />
      {error ? (
        <p id={`${name}-error`} className="text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${name}-hint`} className="text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
