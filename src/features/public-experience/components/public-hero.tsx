import Link from "next/link";
import { hero, primaryCta } from "@/features/public-experience/content";

export function PublicHero() {
  return (
    <section aria-labelledby="public-hero-title" style={{ display: "grid", gap: "1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
          padding: "0.35rem 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span
            aria-hidden="true"
            style={{
              width: "1.8rem",
              height: "1.8rem",
              borderRadius: "0.65rem",
              background: "linear-gradient(135deg, var(--accent), #0d7c66)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 800,
              fontSize: "0.72rem",
            }}
          >
            AMP
          </span>
          <span style={{ color: "var(--accent-strong)", fontWeight: 800, fontSize: "0.9rem" }}>
            Plataforma educacional com IA
          </span>
        </div>
        <nav aria-label="Navegação principal da landing">
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", alignItems: "center" }}>
            <Link
              href="/login"
              style={{
                color: "var(--color-text-primary)",
                textDecoration: "none",
                fontWeight: 600,
                padding: "0.7rem 0.95rem",
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
                minHeight: "2.65rem",
                paddingInline: "1rem",
                borderRadius: "0.75rem",
                background: "linear-gradient(135deg, var(--accent), #0d7c66)",
                color: "white",
                textDecoration: "none",
                fontWeight: 800,
                boxShadow: "0 10px 24px rgba(13,124,102,0.16)",
              }}
            >
              Cadastrar
            </Link>
          </div>
        </nav>
      </div>

      <div
        style={{
          padding: "1rem 0 2rem",
          background: "linear-gradient(135deg, #00614f 0%, #0d7c66 100%)",
          borderRadius: "1.5rem",
          overflow: "hidden",
          boxShadow: "0 28px 70px rgba(0, 53, 42, 0.16)",
        }}
      >
      <div
        style={{
          display: "grid",
          gap: "1.75rem",
          gridTemplateColumns: "minmax(0, 1.35fr) minmax(18rem, 0.8fr)",
          alignItems: "end",
          padding: "clamp(1.5rem, 4vw, 2.6rem)",
        }}
      >
        <div style={{ display: "grid", gap: "1rem" }}>
          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.92)",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontSize: "0.78rem",
              width: "fit-content",
              padding: "0.4rem 0.7rem",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.14)",
            }}
          >
            {hero.eyebrow}
          </p>
          <h1
            id="public-hero-title"
            style={{
              margin: 0,
              maxWidth: "12ch",
              fontSize: "clamp(2.8rem, 6vw, 4.8rem)",
              lineHeight: 0.92,
              color: "white",
              letterSpacing: "-0.045em",
            }}
          >
            {hero.title}
          </h1>
          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.82)",
              maxWidth: "56ch",
              fontSize: "1.04rem",
              lineHeight: 1.65,
            }}
          >
            {hero.description}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
            <a
              href={primaryCta.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "2.9rem",
                paddingInline: "1.35rem",
                borderRadius: "0.8rem",
                background: "#f6ceb1",
                color: "#2a1700",
                textDecoration: "none",
                fontWeight: 800,
                boxShadow: "0 14px 28px rgba(0, 0, 0, 0.1)",
              }}
            >
              {primaryCta.label}
            </a>
            <a
              href="#demo"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "2.9rem",
                paddingInline: "1.35rem",
                borderRadius: "0.8rem",
                border: "1px solid rgba(255,255,255,0.38)",
                color: "white",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Ver demonstração
            </a>
          </div>
        </div>
        <div
          aria-label="Prévia do produto"
          style={{
            display: "grid",
            gap: "0.9rem",
            padding: "1.1rem",
            borderRadius: "1.1rem",
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 24px 50px rgba(0,0,0,0.16)",
            transform: "rotate(-2deg) translateY(0.2rem)",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "1rem",
              padding: "1.1rem",
              borderRadius: "0.9rem",
              background: "#fffdf8",
              color: "var(--color-text-primary)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingBottom: "0.85rem", borderBottom: "1px solid rgba(110,122,117,0.14)" }}>
              <div
                style={{
                  width: "2.25rem",
                  height: "2.25rem",
                  borderRadius: "0.75rem",
                  background: "rgba(13,124,102,0.12)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent)",
                  fontWeight: 800,
                  fontSize: "0.78rem",
                }}
              >
                AI
              </div>
              <div style={{ display: "grid", gap: "0.15rem" }}>
                <strong style={{ fontSize: "0.92rem" }}>Sugestão da IA</strong>
                <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
                  Adaptação para Dislexia ativada
                </span>
              </div>
            </div>
            <div style={{ display: "grid", gap: "0.55rem" }}>
              <div style={{ height: "0.9rem", borderRadius: "999px", background: "var(--color-surface-subtle)", width: "72%" }} />
              <div style={{ height: "0.9rem", borderRadius: "999px", background: "var(--color-surface-subtle)", width: "100%" }} />
              <div style={{ height: "0.9rem", borderRadius: "999px", background: "var(--color-surface-subtle)", width: "84%" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "2rem",
                  paddingInline: "0.9rem",
                  borderRadius: "0.7rem",
                  background: "linear-gradient(135deg, var(--accent), #0d7c66)",
                  color: "white",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                }}
              >
                Aplicar Mudanças
              </span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
