import { footerCopy } from "@/features/public-experience/content";

export function PublicFooter() {
  return (
    <footer
      style={{
        padding: "2rem 0 0.75rem",
        borderTop: "1px solid rgba(110,122,117,0.12)",
        color: "var(--color-text-muted)",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))",
          alignItems: "start",
        }}
      >
        <div style={{ display: "grid", gap: "0.55rem" }}>
          <p style={{ margin: 0, color: "var(--accent-strong)", fontWeight: 800 }}>{footerCopy.brand}</p>
          <p style={{ margin: 0, maxWidth: "34ch" }}>{footerCopy.note}</p>
        </div>
        <div style={{ display: "grid", gap: "0.45rem" }}>
          <p style={{ margin: 0, color: "var(--color-text-primary)", fontWeight: 700 }}>Produto</p>
          <p style={{ margin: 0 }}>Plataforma</p>
          <p style={{ margin: 0 }}>Fluxos</p>
          <p style={{ margin: 0 }}>Modelos de IA</p>
        </div>
        <div style={{ display: "grid", gap: "0.45rem" }}>
          <p style={{ margin: 0, color: "var(--color-text-primary)", fontWeight: 700 }}>Suporte</p>
          <p style={{ margin: 0 }}>Central de Ajuda</p>
          <p style={{ margin: 0 }}>Privacidade</p>
          <p style={{ margin: 0 }}>Termos de Uso</p>
        </div>
      </div>
      <div style={{ paddingTop: "1rem", marginTop: "1rem", borderTop: "1px solid rgba(110,122,117,0.1)" }}>
        <p style={{ margin: 0, fontSize: "0.82rem" }}>{footerCopy.copyright}</p>
      </div>
    </footer>
  );
}
