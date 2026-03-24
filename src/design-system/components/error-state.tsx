type ErrorStateProps = Readonly<{
  message: string;
}>;

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div
      role="alert"
      style={{
        display: "grid",
        gap: "0.5rem",
        padding: "1rem 1.25rem",
        borderRadius: "var(--radius-card)",
        background: "rgba(220, 38, 38, 0.08)",
        border: "1px solid rgba(220, 38, 38, 0.14)",
        color: "var(--danger)",
      }}
    >
      <strong>Algo falhou</strong>
      <p style={{ margin: 0 }}>{message}</p>
    </div>
  );
}
