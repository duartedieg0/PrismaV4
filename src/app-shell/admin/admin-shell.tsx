import Link from "next/link";
import { Breadcrumbs } from "@/design-system/components/breadcrumbs";
import { InlineError } from "@/design-system/components/inline-error";
import { PageHeader } from "@/design-system/components/page-header";
import { ProcessingBanner } from "@/design-system/components/processing-banner";
import { Surface } from "@/design-system/components/surface";

const adminNavItems = [
  { label: "Início", href: "/config" },
  { label: "Modelos", href: "/config/models" },
  { label: "Agentes", href: "/config/agents" },
  { label: "Apoios", href: "/config/supports" },
  { label: "Disciplinas", href: "/config/subjects" },
  { label: "Anos/Séries", href: "/config/grade-levels" },
  { label: "Usuários", href: "/users" },
] as const;

type AdminShellProps = Readonly<{
  title: string;
  breadcrumbs: { label: string; href: string }[];
  description?: string;
  inlineError?: string;
  processingMessage?: string;
  children: React.ReactNode;
}>;

export function AdminShell({
  title,
  breadcrumbs,
  description,
  inlineError,
  processingMessage,
  children,
}: AdminShellProps) {
  return (
    <div style={{ padding: "var(--space-section) var(--space-gutter)" }}>
      <div style={{ width: "min(100%, var(--container-xwide))", margin: "0 auto", display: "grid", gap: "1.5rem" }}>
        <Surface padding="1rem 1.25rem" tone="hero">
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
              <div style={{ display: "grid", gap: "0.35rem" }}>
                <span
                  style={{
                    color: "var(--color-text-accent)",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Administração
                </span>
                <strong style={{ fontSize: "1.15rem" }}>Console de governança</strong>
              </div>
              <nav aria-label="Navegacao principal do admin">
                <ul
                  style={{
                    display: "flex",
                    gap: "0.75rem 1rem",
                    flexWrap: "wrap",
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                  }}
                >
                  {adminNavItems.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href}>{item.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
            <Breadcrumbs items={breadcrumbs} />
              <PageHeader
                title={title}
                eyebrow="Governança operacional"
                description={description ?? "Uma superfície administrativa clara para catálogos, runtime de IA, usuários e evolução supervisionada."}
              />
            {processingMessage ? <ProcessingBanner message={processingMessage} /> : null}
            {inlineError ? <InlineError message={inlineError} /> : null}
          </div>
        </Surface>
        <div>{children}</div>
      </div>
    </div>
  );
}
