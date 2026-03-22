import { trustMetrics } from "@/features/public-experience/content";

export function TrustStrip() {
  return (
    <section aria-label="Indicadores de confiança" style={{ paddingBlock: "0.75rem" }}>
      <ul
        style={{
          listStyle: "none",
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(14rem, 100%), 1fr))",
          padding: 0,
          margin: 0,
        }}
      >
        {trustMetrics.map((metric, index) => (
          <li
            key={metric.value}
            className="lp-card"
            style={{
              padding: "1.35rem 1.5rem",
              borderRadius: "1.1rem",
              background:
                index === 1
                  ? "linear-gradient(135deg, rgba(191, 245, 227, 0.4), rgba(191, 245, 227, 0.15))"
                  : "#fffdf8",
              border:
                index === 1
                  ? "1px solid rgba(13, 124, 102, 0.12)"
                  : "1px solid rgba(110,122,117,0.08)",
              boxShadow: "0 8px 24px rgba(28, 25, 23, 0.04)",
            }}
          >
            <div style={{ display: "grid", gap: "0.3rem" }}>
              <strong
                style={{
                  fontSize: "2.2rem",
                  fontWeight: 800,
                  fontFamily: "var(--font-serif), serif",
                  color: "var(--accent-strong)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                }}
              >
                {metric.value}
              </strong>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "var(--color-text-primary)",
                }}
              >
                {metric.label}
              </span>
              <span
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: "0.82rem",
                }}
              >
                {metric.detail}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
