import { finalCta } from "@/features/public-experience/content";

export function FinalCta() {
  return (
    <section aria-label="Chamada final" style={{ paddingBlock: "2rem" }}>
      <div
        style={{
          display: "grid",
          gap: "1.25rem",
          justifyItems: "center",
          textAlign: "center",
          minHeight: "17rem",
          alignContent: "center",
          padding: "clamp(2rem, 4vw, 3rem)",
          borderRadius: "1.5rem",
          background: "linear-gradient(180deg, rgba(255,255,255,0.86), rgba(249,246,238,0.95))",
          border: "1px solid rgba(110,122,117,0.08)",
          boxShadow: "0 18px 44px rgba(28,25,23,0.05)",
        }}
      >
        <h2 id="final-cta-title" style={{ margin: 0, fontSize: "clamp(2.1rem, 5vw, 3.4rem)", letterSpacing: "-0.05em" }}>
          {finalCta.title}
        </h2>
        <p style={{ margin: 0, color: "var(--color-text-muted)", maxWidth: "52ch", lineHeight: 1.65 }}>
          {finalCta.description}
        </p>
        <a
          href={finalCta.href}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "2.75rem",
            width: "fit-content",
            paddingInline: "1.25rem",
            borderRadius: "0.8rem",
            background: "linear-gradient(135deg, var(--accent), #0d7c66)",
            color: "var(--color-text-inverted)",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          {finalCta.label}
        </a>
        <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(97,112,107,0.8)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Não é necessário cartão de crédito • Grátis para testar
        </p>
      </div>
    </section>
  );
}
