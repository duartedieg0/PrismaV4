import { flowSteps } from "@/features/public-experience/content";

export function FlowSection() {
  return (
    <section aria-label="Como funciona" style={{ paddingBlock: "2rem" }}>
      <div
        style={{
          display: "grid",
          gap: "1.25rem",
          padding: "1.4rem",
          borderRadius: "1rem",
          background: "rgba(255,255,255,0.58)",
          border: "1px solid rgba(110,122,117,0.08)",
        }}
      >
        <div style={{ display: "grid", gap: "0.45rem" }}>
          <h2 style={{ margin: 0, letterSpacing: "-0.04em" }}>Como funciona</h2>
          <p style={{ margin: 0, color: "var(--color-text-muted)", maxWidth: "54ch" }}>
            Um fluxo curto para sair da prova bruta e chegar a uma versão pronta para revisão.
          </p>
        </div>
        <ol
          style={{
            listStyle: "none",
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
            padding: 0,
            margin: 0,
          }}
        >
          {flowSteps.map((item) => (
            <li
              key={item.step}
              style={{
                display: "grid",
                gap: "0.6rem",
                padding: "1.2rem",
                border: "1px solid rgba(110,122,117,0.08)",
                borderRadius: "0.95rem",
                background: "#fffdf8",
                boxShadow: "0 10px 24px rgba(28,25,23,0.04)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "var(--color-text-accent)",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  fontSize: "0.74rem",
                }}
              >
                {item.step}
              </p>
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{item.title}</h3>
              <p style={{ margin: 0, color: "var(--color-text-muted)", lineHeight: 1.6 }}>{item.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
