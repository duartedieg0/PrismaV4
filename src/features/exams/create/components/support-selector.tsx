"use client";

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
    <fieldset
      style={{
        display: "grid",
        gap: "0.75rem",
        padding: 0,
        margin: 0,
        border: 0,
      }}
    >
      <legend style={{ fontWeight: 600 }}>Apoios pedagógicos</legend>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "0.75rem",
        }}
      >
        {supports.map((support) => {
          const checked = selectedSupportIds.includes(support.id);

          return (
            <label
              key={support.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.85rem 1rem",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: "var(--radius-card)",
                background: checked
                  ? "var(--color-surface-overlay)"
                  : "var(--color-surface-subtle)",
                boxShadow: checked ? "var(--shadow-soft)" : "none",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(support.id)}
              />
              <span>{support.name}</span>
            </label>
          );
        })}
      </div>
      {errorMessage ? <InlineError message={errorMessage} /> : null}
    </fieldset>
  );
}
