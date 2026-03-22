import { Upload, Sparkles, CheckCircle } from "lucide-react";
import { flowSteps } from "@/features/public-experience/content";

const stepIcons = [Upload, Sparkles, CheckCircle];

export function FlowSection() {
  return (
    <section id="como-funciona" aria-label="Como funciona" style={{ paddingBlock: "1.5rem 2.5rem" }}>
      <div
        style={{
          display: "grid",
          gap: "2rem",
          padding: "clamp(1.5rem, 3vw, 2.5rem)",
          borderRadius: "1.5rem",
          background: "rgba(255,253,248,0.7)",
          border: "1px solid rgba(110,122,117,0.08)",
          boxShadow: "0 12px 32px rgba(28,25,23,0.03)",
        }}
      >
        {/* Section header */}
        <div style={{ display: "grid", gap: "0.5rem" }}>
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
            Como funciona
          </p>
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-serif), serif",
              fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              letterSpacing: "-0.03em",
            }}
          >
            Três passos para adaptar qualquer avaliação
          </h2>
          <p
            style={{
              margin: 0,
              color: "var(--color-text-muted)",
              maxWidth: "50ch",
              lineHeight: 1.6,
            }}
          >
            Um fluxo simples e direto — do upload à avaliação adaptada e revisada.
          </p>
        </div>

        {/* Steps */}
        <ol
          style={{
            listStyle: "none",
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(16rem, 100%), 1fr))",
            padding: 0,
            margin: 0,
          }}
        >
          {flowSteps.map((item, index) => {
            const Icon = stepIcons[index];
            return (
              <li
                key={item.step}
                className="lp-card"
                style={{
                  display: "grid",
                  gap: "0.85rem",
                  padding: "1.5rem",
                  border: "1px solid rgba(110,122,117,0.08)",
                  borderRadius: "1.1rem",
                  background: "#fffdf8",
                  boxShadow: "0 6px 20px rgba(28,25,23,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, var(--accent), var(--accent-strong))",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} strokeWidth={2.2} />
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--accent)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    PASSO{" "}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--accent)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {item.step}
                  </span>
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.15rem",
                    fontWeight: 700,
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: "var(--color-text-muted)",
                    lineHeight: 1.65,
                    fontSize: "0.92rem",
                  }}
                >
                  {item.description}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
