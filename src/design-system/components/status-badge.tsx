type StatusBadgeProps = Readonly<{
  label: string;
  tone?: "default" | "secondary" | "destructive" | "outline" | "warning";
}>;

const toneStyles = {
  default: {
    background: "rgba(5, 150, 105, 0.12)",
    color: "var(--accent-strong)",
    border: "1px solid rgba(5, 150, 105, 0.16)",
  },
  secondary: {
    background: "rgba(96, 112, 137, 0.12)",
    color: "#4b5563",
    border: "1px solid rgba(96, 112, 137, 0.14)",
  },
  destructive: {
    background: "rgba(220, 38, 38, 0.12)",
    color: "var(--danger)",
    border: "1px solid rgba(220, 38, 38, 0.16)",
  },
  warning: {
    background: "rgba(154, 97, 0, 0.12)",
    color: "var(--warning)",
    border: "1px solid rgba(154, 97, 0, 0.16)",
  },
  outline: {
    background: "rgba(255, 255, 255, 0.7)",
    color: "var(--color-text)",
    border: "1px solid var(--color-border-strong)",
  },
} as const;

export function StatusBadge({ label, tone = "default" }: StatusBadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.35rem 0.75rem",
        borderRadius: "var(--radius-pill)",
        background: toneStyles[tone].background,
        color: toneStyles[tone].color,
        border: toneStyles[tone].border,
        fontWeight: 700,
        fontSize: "0.74rem",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}
