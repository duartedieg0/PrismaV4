type DashboardHeaderProps = Readonly<{
  teacherName: string;
  stats: {
    total: number;
    processing: number;
    completed: number;
  };
}>;

export function DashboardHeader({ teacherName, stats }: DashboardHeaderProps) {
  return (
    <section style={{ display: "grid", gap: "1.5rem" }}>
      <div style={{ display: "grid", gap: "0.4rem" }}>
        <p
          style={{
            margin: 0,
            color: "rgba(97,112,107,0.72)",
            fontWeight: 800,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontSize: "0.7rem",
          }}
        >
          Área de trabalho
        </p>
        <h2 style={{ margin: 0, fontSize: "clamp(2.2rem, 4vw, 4rem)", letterSpacing: "-0.06em" }}>
          Olá, {teacherName}
        </h2>
        <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "1.05rem" }}>
          Aqui estão suas provas e os próximos passos de cada adaptação.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "minmax(16rem, 2fr) repeat(2, minmax(12rem, 1fr))",
        }}
      >
        <article
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "1.55rem",
            borderRadius: "1rem",
            background: "rgba(255,255,255,0.78)",
            boxShadow: "0 14px 34px rgba(28,25,23,0.05)",
            border: "1px solid rgba(110,122,117,0.08)",
          }}
        >
          <p style={{ margin: 0, color: "rgba(97,112,107,0.66)", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", fontSize: "0.66rem" }}>
            Atividade Recente
          </p>
          <h3 style={{ margin: "0.75rem 0 0.15rem", fontSize: "2.1rem", letterSpacing: "-0.05em" }}>
            {String(stats.total).padStart(2, "0")} Provas
          </h3>
          <p style={{ margin: 0, color: "var(--accent-strong)", fontWeight: 700 }}>
            Criadas neste workspace
          </p>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              right: "-0.5rem",
              bottom: "-1.2rem",
              width: "5rem",
              height: "5rem",
              borderRadius: "1rem",
              background: "linear-gradient(180deg, rgba(26,28,27,0.08), rgba(26,28,27,0.02))",
            }}
          />
        </article>

        <article
          style={{
            padding: "1.55rem",
            borderRadius: "1rem",
            background: "rgba(255,255,255,0.78)",
            boxShadow: "0 14px 34px rgba(28,25,23,0.05)",
            border: "1px solid rgba(110,122,117,0.08)",
          }}
        >
          <p style={{ margin: 0, color: "rgba(97,112,107,0.66)", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", fontSize: "0.66rem" }}>
            Em Processamento
          </p>
          <h3 style={{ margin: "0.75rem 0 0.45rem", fontSize: "2.1rem", letterSpacing: "-0.05em", color: "#9a6100" }}>
            {String(stats.processing).padStart(2, "0")}
          </h3>
          <div style={{ height: "0.3rem", borderRadius: "999px", background: "rgba(110,122,117,0.14)", overflow: "hidden" }}>
            <div
              style={{
                width: stats.total === 0 ? "0%" : `${Math.max(18, Math.round((stats.processing / Math.max(stats.total, 1)) * 100))}%`,
                height: "100%",
                background: "#9a6100",
              }}
            />
          </div>
        </article>

        <article
          style={{
            padding: "1.55rem",
            borderRadius: "1rem",
            background: "rgba(255,255,255,0.78)",
            boxShadow: "0 14px 34px rgba(28,25,23,0.05)",
            border: "1px solid rgba(110,122,117,0.08)",
          }}
        >
          <p style={{ margin: 0, color: "rgba(97,112,107,0.66)", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", fontSize: "0.66rem" }}>
            Concluídas
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.45rem", marginTop: "0.75rem" }}>
            <h3 style={{ margin: 0, fontSize: "2.1rem", letterSpacing: "-0.05em" }}>
              {String(stats.completed).padStart(2, "0")}
            </h3>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.2rem 0.45rem",
                borderRadius: "999px",
                background: "rgba(13,124,102,0.1)",
                color: "var(--accent-strong)",
                fontWeight: 700,
                fontSize: "0.72rem",
              }}
            >
              prontas
            </span>
          </div>
          <p style={{ margin: "0.45rem 0 0", color: "rgba(97,112,107,0.8)", fontSize: "0.83rem" }}>
            Provas que já chegaram ao resultado final
          </p>
        </article>
      </div>
    </section>
  );
}
