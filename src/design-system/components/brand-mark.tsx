import { fontTokens } from "@/design-system/typography/fonts";

export function BrandMark() {
  return (
    <div style={{ display: "grid", gap: "0.65rem" }}>
      <p
        style={{
          margin: 0,
          color: "var(--color-text-accent)",
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontSize: "0.7rem",
        }}
      >
        Plataforma educacional com IA
      </p>
      <h1
        style={{
          margin: "1rem 0 0.75rem",
          fontFamily: fontTokens.interface,
          fontSize: "clamp(2rem, 5vw, 3.4rem)",
          fontWeight: 800,
          lineHeight: 0.95,
          color: "var(--color-text-primary)",
        }}
      >
        Adapte Minha Prova
      </h1>
    </div>
  );
}
