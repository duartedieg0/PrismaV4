import { AdminShell } from "@/app-shell/admin/admin-shell";
import { CatalogPage } from "@/features/admin/shared/catalog-page";
import { AgentForm } from "@/features/admin/agents/components/agent-form";

export default function NewAgentPage() {
  return (
    <AdminShell
      title="Novo agente"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
        { label: "Agentes", href: "/config/agents" },
        { label: "Novo", href: "/config/agents/new" },
      ]}
    >
      <CatalogPage
        description="Crie um novo agente com objetivo claro e prompt versionável."
        title="Novo agente"
      >
        <AgentForm mode="create" />
      </CatalogPage>
    </AdminShell>
  );
}
