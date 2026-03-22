import Link from "next/link";
import { footerCopy } from "@/features/public-experience/content";

export function PublicFooter() {
  return (
    <footer
      style={{
        padding: "2.5rem 0 1.25rem",
        borderTop: "1px solid rgba(110,122,117,0.1)",
        color: "var(--color-text-muted)",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: "1.5rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(11rem, 100%), 1fr))",
          alignItems: "start",
        }}
      >
        {/* Brand */}
        <div style={{ display: "grid", gap: "0.65rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span
              aria-hidden="true"
              style={{
                width: "1.75rem",
                height: "1.75rem",
                borderRadius: "0.5rem",
                background: "linear-gradient(135deg, var(--accent), var(--accent-strong))",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 800,
                fontSize: "0.55rem",
              }}
            >
              AMP
            </span>
            <span
              style={{
                color: "var(--accent-strong)",
                fontWeight: 800,
                fontSize: "0.9rem",
              }}
            >
              {footerCopy.brand}
            </span>
          </div>
          <p
            style={{
              margin: 0,
              maxWidth: "30ch",
              lineHeight: 1.55,
              fontSize: "0.88rem",
            }}
          >
            {footerCopy.note}
          </p>
        </div>

        {/* Produto */}
        <div style={{ display: "grid", gap: "0.55rem" }}>
          <p
            style={{
              margin: 0,
              color: "var(--color-text-primary)",
              fontWeight: 700,
              fontSize: "0.88rem",
            }}
          >
            Produto
          </p>
          <Link
            href="/login"
            style={{
              fontSize: "0.88rem",
              color: "var(--color-text-muted)",
            }}
          >
            Plataforma
          </Link>
          <p style={{ margin: 0, fontSize: "0.88rem" }}>Adaptação com IA</p>
          <p style={{ margin: 0, fontSize: "0.88rem" }}>Revisão pedagógica</p>
        </div>

        {/* Recursos */}
        <div style={{ display: "grid", gap: "0.55rem" }}>
          <p
            style={{
              margin: 0,
              color: "var(--color-text-primary)",
              fontWeight: 700,
              fontSize: "0.88rem",
            }}
          >
            Recursos
          </p>
          <p style={{ margin: 0, fontSize: "0.88rem" }}>Central de ajuda</p>
          <p style={{ margin: 0, fontSize: "0.88rem" }}>Documentação</p>
          <p style={{ margin: 0, fontSize: "0.88rem" }}>Blog educacional</p>
        </div>

        {/* Legal */}
        <div style={{ display: "grid", gap: "0.55rem" }}>
          <p
            style={{
              margin: 0,
              color: "var(--color-text-primary)",
              fontWeight: 700,
              fontSize: "0.88rem",
            }}
          >
            Legal
          </p>
          <p style={{ margin: 0, fontSize: "0.88rem" }}>Privacidade</p>
          <p style={{ margin: 0, fontSize: "0.88rem" }}>Termos de uso</p>
          <p style={{ margin: 0, fontSize: "0.88rem" }}>LGPD</p>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          paddingTop: "1.5rem",
          marginTop: "1.5rem",
          borderTop: "1px solid rgba(110,122,117,0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
          &copy; {new Date().getFullYear()} {footerCopy.brand}.{" "}
        </p>
        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
          {footerCopy.copyright}
        </p>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(97,112,107,0.6)" }}>
          Feito com IA para a educação inclusiva
        </p>
      </div>
    </footer>
  );
}
