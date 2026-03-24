"use client";

import { Button } from "@/design-system/components/button";

type UserGovernanceDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "default" | "destructive";
  isOpen: boolean;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function UserGovernanceDialog({
  title,
  description,
  confirmLabel,
  tone = "default",
  isOpen,
  isPending = false,
  onCancel,
  onConfirm,
}: UserGovernanceDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-labelledby="user-governance-title"
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 p-6"
    >
      <div className="flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-border-default bg-white p-6 shadow-elevated">
        <h2 id="user-governance-title" className="text-lg font-semibold text-text-primary">{title}</h2>
        <p className="text-sm text-text-secondary">{description}</p>
        <div className="flex justify-end gap-3">
          <Button onClick={onCancel} type="button" variant="ghost" size="sm">
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            type="button"
            variant={tone === "destructive" ? "danger" : "primary"}
            size="sm"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
