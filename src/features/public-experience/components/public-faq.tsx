import { faq } from "@/features/public-experience/content";
export function PublicFaq() {
  return (
    <section aria-label="Perguntas frequentes" style={{ paddingBlock: "2rem" }}>
      <div style={{ display: "grid", gap: "1rem" }}>
        <div style={{ display: "grid", gap: "0.45rem" }}>
          <h2 style={{ margin: 0, letterSpacing: "-0.04em" }}>Perguntas frequentes</h2>
          <p style={{ margin: 0, color: "var(--color-text-muted)", maxWidth: "54ch" }}>
            Respostas diretas para orientar a decisão sem ruído comercial desnecessário.
          </p>
        </div>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {faq.map((item) => (
            <details
              key={item.question}
              style={{
                padding: "1rem 1.1rem",
                borderRadius: "0.95rem",
                border: "1px solid var(--color-border-subtle)",
                background: "#fffdf8",
                boxShadow: "0 10px 24px rgba(28,25,23,0.04)",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: 700,
                  color: "var(--color-text)",
                }}
              >
                {item.question}
              </summary>
              <p style={{ margin: "0.75rem 0 0", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
