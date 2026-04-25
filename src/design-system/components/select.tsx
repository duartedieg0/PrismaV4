import { cn } from "@/lib/utils";

type SelectProps = Readonly<{
  label?: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}> &
  Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children">;

export function Select({ label, hint, error, options, placeholder, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={selectId} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className={cn(
          "h-10 w-full rounded-xl border bg-white px-3.5 text-sm text-text-primary",
          "transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
          error ? "border-danger" : "border-border-default hover:border-border-strong",
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
        {...props}
      >
        {placeholder ? (
          <option value="">{placeholder}</option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${selectId}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${selectId}-hint`} className="text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
