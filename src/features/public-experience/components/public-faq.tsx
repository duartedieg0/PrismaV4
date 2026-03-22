import { faq } from "@/features/public-experience/content";

export function PublicFaq() {
  return (
    <section aria-label="Perguntas frequentes" style={{ paddingBlock: "1.5rem 2.5rem" }}>
      <div
        style={{
          display: "grid",
          gap: "1.5rem",
          maxWidth: "48rem",
          margin: "0 auto",
        }}
      >
        {/* Section header */}
        <div
          style={{
            display: "grid",
            gap: "0.65rem",
            justifyItems: "center",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontSize: "0.78rem",
              color: "var(--accent)",
            }}
          >
            FAQ
          </p>
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-serif), serif",
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              letterSpacing: "-0.035em",
            }}
          >
            Perguntas frequentes
          </h2>
          <p
            style={{
              margin: 0,
              color: "var(--color-text-muted)",
              maxWidth: "46ch",
              lineHeight: 1.6,
            }}
          >
            Respostas diretas para as dúvidas mais comuns sobre a plataforma.
          </p>
        </div>

        {/* FAQ items */}
        <div style={{ display: "grid", gap: "0.65rem" }}>
          {faq.map((item) => (
            <details
              key={item.question}
              className="lp-faq"
              style={{
                padding: "1.15rem 1.35rem",
                borderRadius: "1rem",
                border: "1px solid rgba(110,122,117,0.1)",
                background: "#fffdf8",
                boxShadow: "0 4px 16px rgba(28,25,23,0.03)",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  fontSize: "0.98rem",
                  lineHeight: 1.5,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                {item.question}
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    width: "1.5rem",
                    height: "1.5rem",
                    borderRadius: "50%",
                    background: "rgba(13,124,102,0.08)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent)",
                    fontSize: "1.1rem",
                    fontWeight: 300,
                    lineHeight: 1,
                  }}
                >
                  +
                </span>
              </summary>
              <p
                style={{
                  margin: "0.85rem 0 0",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.7,
                  fontSize: "0.92rem",
                  paddingRight: "2.5rem",
                }}
              >
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
