"use client";

import { cn } from "@/lib/utils";

type CheckboxGroupProps = Readonly<{
  label: string;
  options: { id: string; name: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  emptyMessage?: string;
}>;

export function CheckboxGroup({
  label,
  options,
  selectedIds,
  onChange,
  disabled = false,
  emptyMessage = "Nenhuma opcao disponivel",
}: CheckboxGroupProps) {
  function handleToggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-medium text-text-primary">{label}</legend>
      {options.length === 0 ? (
        <p className="text-sm text-text-muted">{emptyMessage}</p>
      ) : (
        <div className="mt-1 flex flex-wrap gap-2">
          {options.map((option) => {
            const isSelected = selectedIds.includes(option.id);
            return (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors duration-200",
                  isSelected
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-border-default bg-white text-text-secondary hover:border-border-strong",
                  disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={disabled}
                  onChange={() => handleToggle(option.id)}
                  className="sr-only"
                />
                {option.name}
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
