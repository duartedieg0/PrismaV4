type EmptyStateProps = Readonly<{
  message: string;
}>;

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "grid",
        gap: "0.5rem",
        padding: "1.25rem 1.5rem",
        borderRadius: "var(--radius-card)",
        border: "1px dashed var(--color-border-strong)",
        background: "rgba(238, 242, 255, 0.7)",
      }}
    >
      <strong style={{ color: "var(--color-text-accent)" }}>Nada por aqui ainda</strong>
      <p style={{ margin: 0, color: "var(--color-text-muted)" }}>{message}</p>
    </div>
  );
}
