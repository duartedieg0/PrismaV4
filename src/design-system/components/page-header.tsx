type PageHeaderProps = Readonly<{
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: React.ReactNode;
}>;

export function PageHeader({ title, eyebrow, description, actions }: PageHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
        justifyContent: "space-between",
        alignItems: "flex-end",
      }}
    >
      <div style={{ display: "grid", gap: "0.6rem", maxWidth: "44rem" }}>
        {eyebrow ? (
          <p
            style={{
              margin: 0,
              color: "var(--color-text-accent)",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontSize: "0.74rem",
            }}
          >
            {eyebrow}
          </p>
        ) : null}
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-serif), serif",
            fontSize: "clamp(2.25rem, 4vw, 3.9rem)",
            lineHeight: 0.98,
            color: "var(--color-text-primary)",
          }}
        >
          {title}
        </h1>
        {description ? (
          <p
            style={{
              margin: 0,
              color: "var(--color-text-muted)",
              fontSize: "1rem",
              maxWidth: "60ch",
            }}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>{actions}</div> : null}
    </div>
  );
}
