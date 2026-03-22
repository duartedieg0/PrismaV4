import { testimonials } from "@/features/public-experience/content";

export function TestimonialsSection() {
  return (
    <section aria-label="Depoimentos de educadores" style={{ paddingBlock: "2.5rem" }}>
      <div style={{ display: "grid", gap: "2rem" }}>
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
            Depoimentos
          </p>
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-serif), serif",
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              letterSpacing: "-0.035em",
            }}
          >
            O que dizem os educadores
          </h2>
          <p
            style={{
              margin: 0,
              color: "var(--color-text-muted)",
              maxWidth: "48ch",
              lineHeight: 1.6,
            }}
          >
            Professores e coordenadores que já transformaram sua rotina de adaptação.
          </p>
        </div>

        {/* Testimonial cards */}
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(17rem, 100%), 1fr))",
          }}
        >
          {testimonials.map((t) => (
            <li
              key={t.name}
              className="lp-card"
              style={{
                display: "grid",
                gap: "1rem",
                padding: "1.5rem",
                borderRadius: "1.1rem",
                background: "#fffdf8",
                border: "1px solid rgba(110,122,117,0.08)",
                boxShadow: "0 8px 24px rgba(28,25,23,0.04)",
                alignContent: "start",
              }}
            >
              {/* Quote */}
              <div style={{ display: "grid", gap: "0.25rem" }}>
                <span
                  aria-hidden="true"
                  style={{
                    fontFamily: "var(--font-serif), serif",
                    fontSize: "2.8rem",
                    lineHeight: 1,
                    color: "var(--accent)",
                    opacity: 0.25,
                    userSelect: "none",
                  }}
                >
                  &ldquo;
                </span>
                <p
                  style={{
                    margin: 0,
                    fontStyle: "italic",
                    color: "var(--color-text-primary)",
                    lineHeight: 1.65,
                    fontSize: "0.95rem",
                    marginTop: "-1.2rem",
                  }}
                >
                  {t.quote}
                </p>
              </div>

              {/* Author */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  paddingTop: "0.75rem",
                  borderTop: "1px solid rgba(110,122,117,0.08)",
                }}
              >
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, rgba(13,124,102,0.15), rgba(13,124,102,0.08))",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-strong)",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    flexShrink: 0,
                  }}
                >
                  {t.name.charAt(0)}
                </div>
                <div style={{ display: "grid", gap: "0.1rem" }}>
                  <strong style={{ fontSize: "0.88rem" }}>{t.name}</strong>
                  <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
                    {t.role} · {t.institution}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
