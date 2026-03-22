import { AdminShell } from "@/app-shell/admin/admin-shell";
import { Surface } from "@/design-system/components/surface";
import type { AdminConfigSection } from "@/features/admin/shared/contracts";

const sections: AdminConfigSection[] = [
  {
    title: "Modelos",
    description: "Gerencie providers, segredos, defaults e papéis operacionais.",
    href: "/config/models",
  },
  {
    title: "Agentes",
    description: "Controle prompts, objetivos, versões e evolução assistida.",
    href: "/config/agents",
  },
  {
    title: "Apoios",
    description: "Vincule apoios a agentes e modelos válidos do runtime.",
    href: "/config/supports",
  },
  {
    title: "Disciplinas",
    description: "Administre o catálogo curricular usado no fluxo do professor.",
    href: "/config/subjects",
  },
  {
    title: "Anos/Séries",
    description: "Administre os níveis que aparecem na criação de provas.",
    href: "/config/grade-levels",
  },
] as const;

export default function AdminConfigPage() {
  return (
    <AdminShell
      title="Configuracoes"
      description="Gerencie o runtime de IA, o catálogo pedagógico e as entidades que sustentam toda a operação."
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
      ]}
      processingMessage="Sincronizando catalogo"
    >
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        {sections.map((section) => (
          <Surface key={section.href} padding="1.25rem">
            <a href={section.href} style={{ display: "grid", gap: "0.75rem" }}>
              <strong style={{ fontSize: "1.05rem" }}>{section.title}</strong>
              <span style={{ color: "var(--color-text-muted)" }}>{section.description}</span>
            </a>
          </Surface>
        ))}
      </div>
    </AdminShell>
  );
}
