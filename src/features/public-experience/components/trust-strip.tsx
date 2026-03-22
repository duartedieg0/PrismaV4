import { trustSignals } from "@/features/public-experience/content";

export function TrustStrip() {
  return (
    <section
      aria-label="Sinais de confiança institucional"
      style={{ paddingBlock: "0.25rem 0 0.5rem", marginTop: "-1.2rem", position: "relative", zIndex: 2 }}
    >
      <ul
        style={{
          listStyle: "none",
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))",
          padding: 0,
          margin: 0,
        }}
      >
        {[
          { value: "+500k", label: "Provas adaptadas" },
          { value: "85%", label: "Redução de tempo" },
          { value: "Tecnologia Certificada", label: "Aprovado por especialistas em pedagogia." },
        ].map((signal, index) => (
          <li
            key={signal.value}
            style={{
              padding: "1.2rem 1.35rem",
              borderRadius: "0.9rem",
              background: index === 2 ? "#bff5e3" : "#fffdf8",
              border: "1px solid rgba(110,122,117,0.08)",
              color: "var(--color-text-primary)",
              boxShadow: "0 12px 30px rgba(28, 25, 23, 0.05)",
            }}
          >
            <div style={{ display: "grid", gap: "0.25rem" }}>
              <strong
                style={{
                  fontSize: index === 2 ? "1.25rem" : "2rem",
                  fontWeight: 800,
                  color: "var(--accent-strong)",
                  letterSpacing: "-0.03em",
                }}
              >
                {signal.value}
              </strong>
              <span style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>{signal.label}</span>
              {index < trustSignals.length ? (
                <span style={{ color: "rgba(97,112,107,0.76)", fontSize: "0.78rem" }}>{trustSignals[index]}</span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
