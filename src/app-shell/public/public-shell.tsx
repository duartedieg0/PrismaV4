import Link from "next/link";
import { BrandMark } from "@/design-system/components/brand-mark";
import { Breadcrumbs } from "@/design-system/components/breadcrumbs";
import { PageHeader } from "@/design-system/components/page-header";
import { ProcessingBanner } from "@/design-system/components/processing-banner";
import { Surface } from "@/design-system/components/surface";
import { ToastRegion } from "@/design-system/components/toast-region";

type PublicShellProps = Readonly<{
  title: string;
  breadcrumbs: { label: string; href: string }[];
  notice?: string;
  children: React.ReactNode;
}>;

export function PublicShell({
  title,
  breadcrumbs,
  notice,
  children,
}: PublicShellProps) {
  return (
    <div style={{ padding: "1rem var(--space-gutter) var(--space-section)" }}>
      <div style={{ width: "min(100%, var(--container-xwide))", margin: "0 auto", display: "grid", gap: "1.5rem" }}>
        <Surface padding="0.95rem 1.25rem" tone="hero">
          <div style={{ display: "grid", gap: "1rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: "1.9rem",
                    height: "1.9rem",
                    borderRadius: "999px",
                    background: "linear-gradient(135deg, var(--accent), #0d7c66)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-text-inverted)",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                  }}
                >
                  A
                </span>
                <BrandMark />
              </div>
              <nav aria-label="Navegacao publica">
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                  <Link href="/">Início</Link>
                  <Link href="/login" style={{ fontWeight: 700 }}>
                    Entrar
                  </Link>
                  <Link
                    href="/login"
                    style={{
                      padding: "0.75rem 1rem",
                      borderRadius: "1rem",
                      background: "linear-gradient(135deg, var(--accent), #0d7c66)",
                      color: "var(--color-text-inverted)",
                      fontWeight: 800,
                    }}
                  >
                    Cadastrar
                  </Link>
                </div>
              </nav>
            </div>
            <header role="banner" style={{ display: "grid", gap: "0.75rem" }}>
              <Breadcrumbs items={breadcrumbs} />
              <PageHeader
                title={title}
                eyebrow="Experiência pública"
                description="A mesma plataforma que orienta o professor no fluxo operacional também comunica confiança desde a primeira visita."
              />
            </header>
            {notice ? <ProcessingBanner message={notice} /> : null}
          </div>
        </Surface>
        <ToastRegion />
        <div>{children}</div>
      </div>
    </div>
  );
}
