type SurfaceProps = Readonly<{
  children: React.ReactNode;
  padding?: string;
  tone?: "default" | "muted" | "hero";
}>;

export function Surface({
  children,
  padding = "clamp(1.25rem, 2vw, 1.75rem)",
  tone = "default",
}: SurfaceProps) {
  const background =
    tone === "hero"
      ? "linear-gradient(145deg, rgba(255, 253, 248, 0.96) 0%, rgba(236, 244, 239, 0.94) 100%)"
      : tone === "muted"
        ? "var(--color-surface-subtle)"
        : "var(--color-surface-overlay)";

  return (
    <section
      style={{
        border: "1px solid var(--color-border-subtle)",
        background,
        boxShadow: tone === "hero" ? "var(--shadow-strong)" : "var(--shadow-soft)",
        borderRadius: "var(--radius-panel)",
        padding,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {children}
    </section>
  );
}
