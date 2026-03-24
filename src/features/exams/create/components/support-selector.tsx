"use client";

import { cn } from "@/lib/utils";
import { EmptyState } from "@/design-system/components/empty-state";
import { InlineError } from "@/design-system/components/inline-error";

export type SupportOption = {
  id: string;
  name: string;
};

type SupportSelectorProps = Readonly<{
  supports: SupportOption[];
  selectedSupportIds: string[];
  onToggle(supportId: string): void;
  errorMessage?: string;
  disabled?: boolean;
}>;

export function SupportSelector({
  supports,
  selectedSupportIds,
  onToggle,
  errorMessage,
  disabled = false,
}: SupportSelectorProps) {
  if (supports.length === 0) {
    return <EmptyState message="Nenhum apoio ativo está disponível no momento." />;
  }

  return (
    <fieldset className="flex flex-col gap-3 border-0 p-0 m-0">
      <legend className="text-sm font-semibold text-text-primary">Apoios pedagógicos</legend>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        {supports.map((support) => {
          const checked = selectedSupportIds.includes(support.id);

          return (
            <label
              key={support.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all duration-200 cursor-pointer",
                checked
                  ? "border-brand-300 bg-brand-50 shadow-soft"
                  : "border-border-default bg-white hover:border-border-strong",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(support.id)}
                className="h-4 w-4 rounded border-border-default text-brand-600 focus:ring-brand-200"
              />
              <span className="text-text-primary">{support.name}</span>
            </label>
          );
        })}
      </div>
      {errorMessage ? <InlineError message={errorMessage} /> : null}
    </fieldset>
  );
}
