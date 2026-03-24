type ProcessingBannerProps = Readonly<{
  message: string;
}>;

export function ProcessingBanner({ message }: ProcessingBannerProps) {
  return (
    <div
      aria-live="polite"
      style={{
        margin: 0,
        padding: "0.95rem 1.1rem",
        borderRadius: "var(--radius-card)",
        background: "linear-gradient(135deg, rgba(55, 48, 163, 0.12), rgba(5, 150, 105, 0.1))",
        color: "var(--color-text-accent)",
        border: "1px solid rgba(55, 48, 163, 0.12)",
      }}
    >
      <strong style={{ display: "block", marginBottom: "0.2rem" }}>Status do fluxo</strong>
      <span>{message}</span>
    </div>
  );
}
