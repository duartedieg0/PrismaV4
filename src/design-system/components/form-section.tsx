type FormSectionProps = Readonly<{
  title: string;
  children: React.ReactNode;
}>;

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <section
      style={{
        display: "grid",
        gap: "1rem",
        padding: "1.25rem",
        borderRadius: "var(--radius-card)",
        background: "rgba(248, 250, 252, 0.85)",
        border: "1px solid rgba(96, 112, 137, 0.16)",
      }}
    >
      <div style={{ display: "grid", gap: "0.35rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>{title}</h2>
      </div>
      <div>{children}</div>
    </section>
  );
}
