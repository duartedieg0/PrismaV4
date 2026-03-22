import { Surface } from "@/design-system/components/surface";

type CatalogPageProps = Readonly<{
  title: string;
  description: string;
  children: React.ReactNode;
}>;

export function CatalogPage({ title, description, children }: CatalogPageProps) {
  return (
    <div
      style={{
        display: "grid",
        gap: "1.5rem",
      }}
    >
      <Surface tone="hero" padding="1.25rem">
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <p style={{ margin: 0, color: "var(--color-text-accent)", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.78rem" }}>
            Catálogo administrativo
          </p>
          <h2 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>{title}</h2>
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>{description}</p>
        </div>
      </Surface>
      {children}
    </div>
  );
}
