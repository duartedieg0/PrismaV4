import { Clock, BookOpen, Users, ShieldCheck } from "lucide-react";
import { benefits } from "@/features/public-experience/content";

const benefitIcons = [Clock, BookOpen, Users, ShieldCheck];

export function BenefitsSection() {
  return (
    <section aria-label="Benefícios" style={{ paddingBlock: "2.5rem 1.5rem" }}>
      <div style={{ display: "grid", gap: "2rem" }}>
        {/* Section header */}
        <div style={{ display: "grid", gap: "0.65rem", maxWidth: "42rem" }}>
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
            Funcionalidades
          </p>
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-serif), serif",
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              letterSpacing: "-0.035em",
              lineHeight: 1.15,
            }}
          >
            Tudo o que você precisa para adaptar avaliações com confiança
          </h2>
          <p
            style={{
              margin: 0,
              color: "var(--color-text-muted)",
              maxWidth: "52ch",
              fontSize: "1.05rem",
              lineHeight: 1.65,
            }}
          >
            Uma plataforma criada para apoiar a adaptação pedagógica com velocidade, precisão e
            controle total do professor.
          </p>
        </div>

        {/* Benefits grid */}
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(16rem, 100%), 1fr))",
          }}
        >
          {benefits.map((benefit, index) => {
            const Icon = benefitIcons[index];
            return (
              <li
                key={benefit.title}
                className="lp-card"
                style={{
                  display: "grid",
                  gap: "0.85rem",
                  padding: "1.5rem",
                  borderRadius: "1.1rem",
                  background: "#fffdf8",
                  border: "1px solid rgba(110,122,117,0.08)",
                  boxShadow: "0 8px 24px rgba(28,25,23,0.04)",
                  alignContent: "start",
                }}
              >
                <div
                  style={{
                    width: "2.75rem",
                    height: "2.75rem",
                    borderRadius: "0.85rem",
                    background:
                      index % 2 === 0
                        ? "linear-gradient(135deg, rgba(13,124,102,0.12), rgba(13,124,102,0.06))"
                        : "linear-gradient(135deg, rgba(191,245,227,0.6), rgba(191,245,227,0.3))",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-strong)",
                  }}
                >
                  <Icon size={20} strokeWidth={2.2} />
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    lineHeight: 1.3,
                  }}
                >
                  {benefit.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: "var(--color-text-muted)",
                    lineHeight: 1.6,
                    fontSize: "0.92rem",
                  }}
                >
                  {benefit.description}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
