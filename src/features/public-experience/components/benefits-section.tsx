import { benefits } from "@/features/public-experience/content";

export function BenefitsSection() {
  return (
    <section aria-label="Benefícios" style={{ paddingBlock: "2rem" }}>
      <div style={{ display: "grid", gap: "1.4rem" }}>
        <div style={{ display: "grid", gap: "0.5rem", justifyItems: "center", textAlign: "center" }}>
          <h2 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 2.8rem)", letterSpacing: "-0.04em" }}>
            O que você pode fazer
          </h2>
          <p style={{ margin: 0, color: "var(--color-text-muted)", maxWidth: "56ch" }}>
            Uma plataforma criada para apoiar adaptação pedagógica com velocidade, clareza e revisão humana.
          </p>
        </div>
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))",
            color: "var(--color-text)",
          }}
        >
          {benefits.map((benefit, index) => (
            <li
              key={benefit}
              style={{
                display: "grid",
                gap: "0.85rem",
                padding: "1.35rem",
                borderRadius: "0.95rem",
                background: "#fffdf8",
                border: "1px solid rgba(110,122,117,0.08)",
                boxShadow: "0 12px 28px rgba(28,25,23,0.04)",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "0.65rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: index % 3 === 1 ? "rgba(191,245,227,0.9)" : "rgba(13,124,102,0.1)",
                  color: "var(--accent-strong)",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                }}
              >
                {index + 1}
              </span>
              <p style={{ margin: 0, fontWeight: 700, lineHeight: 1.5 }}>{benefit}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
