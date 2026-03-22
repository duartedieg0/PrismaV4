"use client";

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
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        display: "grid",
        placeItems: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "min(100%, 32rem)",
          background: "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(238,242,255,0.88))",
          borderRadius: "var(--radius-panel)",
          padding: "1.5rem",
          boxShadow: "var(--shadow-strong)",
          display: "grid",
          gap: "1rem",
        }}
      >
        <h2 id="user-governance-title" style={{ margin: 0 }}>{title}</h2>
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>{description}</p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            type="button"
            style={{
              background: "rgba(248,250,252,0.95)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-subtle)",
              boxShadow: "none",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: tone === "destructive" ? "linear-gradient(135deg, #dc2626, #b91c1c)" : "linear-gradient(135deg, var(--accent), #4f46e5)",
              color: "#fff",
            }}
            disabled={isPending}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
