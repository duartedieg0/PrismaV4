import { finalCta } from "@/features/public-experience/content";

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" style={{ paddingBlock: "0.5rem 2rem" }}>
      <div
        style={{
          display: "grid",
          gap: "1.5rem",
          justifyItems: "center",
          textAlign: "center",
          padding: "clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 3vw, 2.5rem)",
          borderRadius: "1.75rem",
          background: "linear-gradient(145deg, #003d32 0%, #00614f 35%, #0d7c66 100%)",
          boxShadow: "0 24px 60px rgba(0, 53, 42, 0.16)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-30%",
            right: "-10%",
            width: "50%",
            height: "160%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        <h2
          id="final-cta-title"
          style={{
            margin: 0,
            fontFamily: "var(--font-serif), serif",
            fontSize: "clamp(1.8rem, 4.5vw, 3rem)",
            letterSpacing: "-0.04em",
            color: "white",
            lineHeight: 1.1,
            maxWidth: "18ch",
            position: "relative",
          }}
        >
          {finalCta.title}
        </h2>
        <p
          style={{
            margin: 0,
            color: "rgba(255,255,255,0.78)",
            maxWidth: "48ch",
            lineHeight: 1.65,
            fontSize: "1.05rem",
            position: "relative",
          }}
        >
          {finalCta.description}
        </p>
        <a
          href={finalCta.href}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "3.1rem",
            width: "fit-content",
            paddingInline: "1.75rem",
            borderRadius: "0.85rem",
            background: "white",
            color: "#003d32",
            textDecoration: "none",
            fontWeight: 800,
            fontSize: "0.98rem",
            boxShadow: "0 14px 32px rgba(0, 0, 0, 0.15)",
            position: "relative",
          }}
        >
          {finalCta.label}
        </a>
        <p
          style={{
            margin: 0,
            fontSize: "0.78rem",
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.06em",
            position: "relative",
          }}
        >
          Não é necessário cartão de crédito · Acesso imediato
        </p>
      </div>
    </section>
  );
}
