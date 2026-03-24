import { cn } from "@/lib/utils";

type InputProps = Readonly<{
  label?: string;
  hint?: string;
  error?: string;
}> &
  React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ label, hint, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn(
          "h-10 w-full rounded-xl border bg-white px-3.5 text-sm text-text-primary placeholder:text-text-muted",
          "transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
          error ? "border-danger" : "border-border-default hover:border-border-strong",
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type TextareaProps = Readonly<{
  label?: string;
  hint?: string;
  error?: string;
}> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ label, hint, error, className, id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      ) : null}
      <textarea
        id={inputId}
        className={cn(
          "min-h-24 w-full resize-y rounded-xl border bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted",
          "transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
          error ? "border-danger" : "border-border-default hover:border-border-strong",
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
