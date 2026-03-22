import { redirect } from "next/navigation";
import { AdminShell } from "@/app-shell/admin/admin-shell";
import { CatalogPage } from "@/features/admin/shared/catalog-page";
import { AgentForm } from "@/features/admin/agents/components/agent-form";
import { createClient } from "@/gateways/supabase/server";

type EditAgentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditAgentPage({ params }: EditAgentPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, objective, prompt, enabled")
    .eq("id", id)
    .single();

  if (!agent) {
    redirect("/config/agents");
  }

  return (
    <AdminShell
      title="Editar agente"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
        { label: "Agentes", href: "/config/agents" },
        { label: "Editar", href: `/config/agents/${id}/edit` },
      ]}
    >
      <CatalogPage
        description="Ajuste nome, objetivo e prompt sem perder a trilha de versões."
        title="Editar agente"
      >
        <AgentForm
          agentId={id}
          initialValues={{
            name: agent.name,
            objective: agent.objective ?? "",
            prompt: agent.prompt,
            enabled: agent.enabled,
          }}
          mode="edit"
        />
      </CatalogPage>
    </AdminShell>
  );
}
