import { cn } from "@/lib/cn";

/** Estilo compartido por input, textarea y select. */
export const controlClass = (error?: string) =>
  cn(
    "rounded-xl border bg-white px-3.5 text-sm text-ink placeholder:text-muted/70 transition-colors",
    "focus:outline-none focus:ring-4 focus:ring-brand-50 focus:border-brand-500",
    error ? "border-red-400" : "border-line hover:border-brand-200",
  );

export function FieldShell({
  label,
  name,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
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

const describedBy = (name: string, error?: string, hint?: string) =>
  error ? `${name}-error` : hint ? `${name}-hint` : undefined;

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
  return (
    <FieldShell label={label} name={name} error={error} hint={hint} className={className}>
      <input
        id={name}
        name={name}
        aria-invalid={!!error}
        aria-describedby={describedBy(name, error, hint)}
        className={cn(controlClass(error), "h-11")}
        {...props}
      />
    </FieldShell>
  );
}

export function TextArea({
  label,
  name,
  error,
  hint,
  className,
  ...props
}: React.ComponentProps<"textarea"> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
}) {
  return (
    <FieldShell label={label} name={name} error={error} hint={hint} className={className}>
      <textarea
        id={name}
        name={name}
        rows={3}
        aria-invalid={!!error}
        aria-describedby={describedBy(name, error, hint)}
        className={cn(controlClass(error), "resize-y py-2.5")}
        {...props}
      />
    </FieldShell>
  );
}

export function Select({
  label,
  name,
  error,
  hint,
  className,
  children,
  ...props
}: React.ComponentProps<"select"> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
}) {
  return (
    <FieldShell label={label} name={name} error={error} hint={hint} className={className}>
      <select
        id={name}
        name={name}
        aria-invalid={!!error}
        aria-describedby={describedBy(name, error, hint)}
        className={cn(controlClass(error), "h-11")}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

/** Interruptor accesible (checkbox con apariencia de switch). */
export function Switch({
  label,
  description,
  name,
  defaultChecked,
}: {
  label: string;
  description?: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-line px-4 py-3 hover:border-brand-200">
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span
        aria-hidden
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-brand-500 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-50 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
      />
    </label>
  );
}
