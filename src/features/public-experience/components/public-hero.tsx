import Link from "next/link";
import { hero, primaryCta } from "@/features/public-experience/content";

export function PublicHero() {
  return (
    <section aria-labelledby="public-hero-title" style={{ display: "grid", gap: "0.75rem" }}>
      {/* Navbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.5rem 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <span
            aria-hidden="true"
            style={{
              width: "2.15rem",
              height: "2.15rem",
              borderRadius: "0.7rem",
              background: "linear-gradient(135deg, var(--accent), var(--accent-strong))",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 800,
              fontSize: "0.68rem",
              letterSpacing: "0.02em",
            }}
          >
            AMP
          </span>
          <span
            style={{
              color: "var(--color-text-primary)",
              fontWeight: 800,
              fontSize: "0.92rem",
              letterSpacing: "-0.01em",
            }}
          >
            adapteminha
            <span style={{ color: "var(--accent-strong)" }}>.prova</span>
          </span>
        </div>
        <nav aria-label="Navegação principal da landing">
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Link
              href="/login"
              style={{
                color: "var(--color-text-primary)",
                fontWeight: 600,
                padding: "0.6rem 1rem",
                borderRadius: "0.75rem",
                fontSize: "0.92rem",
              }}
            >
              Entrar
            </Link>
            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "2.5rem",
                paddingInline: "1.15rem",
                borderRadius: "0.75rem",
                background: "linear-gradient(135deg, var(--accent), var(--accent-strong))",
                color: "white",
                fontWeight: 700,
                fontSize: "0.92rem",
                boxShadow: "0 8px 20px rgba(13, 124, 102, 0.2)",
              }}
            >
              Começar grátis
            </Link>
          </div>
        </nav>
      </div>

      {/* Hero */}
      <div
        style={{
          borderRadius: "1.75rem",
          background: "linear-gradient(145deg, #003d32 0%, #00614f 35%, #0d7c66 100%)",
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0, 53, 42, 0.18)",
          position: "relative",
        }}
      >
        {/* Decorative radial glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "45%",
            height: "100%",
            background:
              "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.06) 0%, transparent 55%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "grid",
            gap: "2rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(22rem, 100%), 1fr))",
            alignItems: "center",
            padding: "clamp(2rem, 5vw, 3.5rem) clamp(1.5rem, 4vw, 3rem)",
            position: "relative",
          }}
        >
          {/* Left — Text */}
          <div style={{ display: "grid", gap: "1.25rem" }}>
            <p
              style={{
                margin: 0,
                color: "rgba(255,255,255,0.88)",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontSize: "0.78rem",
                width: "fit-content",
                padding: "0.45rem 0.85rem",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {hero.eyebrow}
            </p>
            <h1
              id="public-hero-title"
              style={{
                margin: 0,
                fontFamily: "var(--font-serif), serif",
                fontSize: "clamp(2.4rem, 5.5vw, 4.2rem)",
                lineHeight: 1.05,
                color: "white",
                letterSpacing: "-0.035em",
                maxWidth: "18ch",
              }}
            >
              {hero.title}
            </h1>
            <p
              style={{
                margin: 0,
                color: "rgba(255,255,255,0.78)",
                maxWidth: "52ch",
                fontSize: "1.08rem",
                lineHeight: 1.7,
              }}
            >
              {hero.description}
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
                alignItems: "center",
                paddingTop: "0.5rem",
              }}
            >
              <a
                href={primaryCta.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "3rem",
                  paddingInline: "1.5rem",
                  borderRadius: "0.85rem",
                  background: "white",
                  color: "#003d32",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  boxShadow: "0 14px 32px rgba(0, 0, 0, 0.15)",
                  letterSpacing: "-0.01em",
                }}
              >
                {primaryCta.label}
              </a>
              <a
                href="#como-funciona"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "3rem",
                  paddingInline: "1.5rem",
                  borderRadius: "0.85rem",
                  border: "1.5px solid rgba(255,255,255,0.3)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                }}
              >
                Ver como funciona
              </a>
            </div>
          </div>

          {/* Right — Product preview */}
          <div
            aria-label="Prévia do produto"
            style={{
              display: "grid",
              gap: "0.75rem",
              padding: "1.25rem",
              borderRadius: "1.25rem",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "grid",
                gap: "0.85rem",
                padding: "1.25rem",
                borderRadius: "1rem",
                background: "#fffdf8",
                color: "var(--color-text-primary)",
              }}
            >
              {/* Card header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: "0.75rem",
                  borderBottom: "1px solid rgba(110,122,117,0.1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <div
                    style={{
                      width: "1.85rem",
                      height: "1.85rem",
                      borderRadius: "0.55rem",
                      background:
                        "linear-gradient(135deg, rgba(13,124,102,0.15), rgba(13,124,102,0.08))",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--accent)",
                      fontWeight: 800,
                      fontSize: "0.65rem",
                    }}
                  >
                    IA
                  </div>
                  <strong style={{ fontSize: "0.85rem" }}>Adaptação Inteligente</strong>
                </div>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "var(--success)",
                    background: "rgba(5, 150, 105, 0.08)",
                    padding: "0.25rem 0.55rem",
                    borderRadius: "999px",
                  }}
                >
                  Concluída
                </span>
              </div>

              {/* Need badges */}
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {["Dislexia", "TDAH"].map((need) => (
                  <span
                    key={need}
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: "var(--accent-strong)",
                      background: "rgba(13,124,102,0.08)",
                      padding: "0.2rem 0.55rem",
                      borderRadius: "999px",
                    }}
                  >
                    {need}
                  </span>
                ))}
              </div>

              {/* Original question skeleton */}
              <div style={{ display: "grid", gap: "0.35rem" }}>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Questão original
                </span>
                <div style={{ display: "grid", gap: "0.3rem" }}>
                  <div
                    style={{
                      height: "0.5rem",
                      borderRadius: "999px",
                      background: "var(--color-surface-subtle)",
                      width: "85%",
                    }}
                  />
                  <div
                    style={{
                      height: "0.5rem",
                      borderRadius: "999px",
                      background: "var(--color-surface-subtle)",
                      width: "100%",
                    }}
                  />
                  <div
                    style={{
                      height: "0.5rem",
                      borderRadius: "999px",
                      background: "var(--color-surface-subtle)",
                      width: "68%",
                    }}
                  />
                </div>
              </div>

              {/* Adapted question skeleton */}
              <div
                style={{
                  display: "grid",
                  gap: "0.35rem",
                  padding: "0.75rem",
                  borderRadius: "0.65rem",
                  background: "rgba(191, 245, 227, 0.25)",
                  border: "1px solid rgba(13, 124, 102, 0.1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <span style={{ color: "var(--success)", fontSize: "0.85rem" }}>&#10003;</span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "var(--accent-strong)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Versão adaptada
                  </span>
                </div>
                <div style={{ display: "grid", gap: "0.3rem" }}>
                  <div
                    style={{
                      height: "0.5rem",
                      borderRadius: "999px",
                      background: "rgba(13, 124, 102, 0.12)",
                      width: "90%",
                    }}
                  />
                  <div
                    style={{
                      height: "0.5rem",
                      borderRadius: "999px",
                      background: "rgba(13, 124, 102, 0.12)",
                      width: "100%",
                    }}
                  />
                  <div
                    style={{
                      height: "0.5rem",
                      borderRadius: "999px",
                      background: "rgba(13, 124, 102, 0.12)",
                      width: "75%",
                    }}
                  />
                  <div
                    style={{
                      height: "0.5rem",
                      borderRadius: "999px",
                      background: "rgba(13, 124, 102, 0.12)",
                      width: "55%",
                    }}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--color-text-muted)",
                    padding: "0.4rem 0.75rem",
                    borderRadius: "0.55rem",
                    border: "1px solid var(--color-border-subtle)",
                  }}
                >
                  Ajustar
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "white",
                    padding: "0.4rem 0.75rem",
                    borderRadius: "0.55rem",
                    background: "linear-gradient(135deg, var(--accent), var(--accent-strong))",
                  }}
                >
                  Aplicar
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
