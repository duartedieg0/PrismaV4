import { PublicShell } from "@/app-shell/public/public-shell";

type StaticPageProps = {
  params: Promise<Record<string, never>>;
};

export default function BlockedPage(_: StaticPageProps) {
  return (
    <PublicShell
      title="Acesso bloqueado"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Bloqueado", href: "/blocked" },
      ]}
      notice="Seu acesso esta temporariamente indisponivel."
    >
      <div
        style={{
          padding: "1.25rem",
          borderRadius: "var(--radius-card)",
          background: "rgba(255,255,255,0.72)",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>Entre em contato com a administração.</p>
      </div>
    </PublicShell>
  );
}
