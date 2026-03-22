type LoadingStateProps = Readonly<{
  message: string;
}>;

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "1rem 1.25rem",
        borderRadius: "var(--radius-card)",
        background: "rgba(55, 48, 163, 0.08)",
        border: "1px solid rgba(55, 48, 163, 0.1)",
        color: "var(--color-text-accent)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: "0.75rem",
          height: "0.75rem",
          borderRadius: "999px",
          background: "currentColor",
          boxShadow: "0 0 0 6px rgba(55, 48, 163, 0.12)",
        }}
      />
      <span>{message}</span>
    </div>
  );
}
