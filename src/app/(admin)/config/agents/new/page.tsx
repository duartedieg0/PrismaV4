import { AdminShell } from "@/app-shell/admin/admin-shell";
import { AgentForm } from "@/features/admin/agents/components/agent-form";

export default function NewAgentPage() {
  return (
    <AdminShell
      title="Novo agente"
      description="Crie um novo agente com objetivo claro e prompt versionável."
      activeNav="agents"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
        { label: "Agentes", href: "/config/agents" },
        { label: "Novo", href: "/config/agents/new" },
      ]}
    >
      <AgentForm mode="create" />
    </AdminShell>
  );
}
