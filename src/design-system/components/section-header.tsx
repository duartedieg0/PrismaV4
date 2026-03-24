type SectionHeaderProps = Readonly<{
  title: string;
  description?: string;
}>;

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div>
      <h2 style={{ marginBottom: "0.5rem" }}>{title}</h2>
      {description ? (
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>{description}</p>
      ) : null}
    </div>
  );
}
