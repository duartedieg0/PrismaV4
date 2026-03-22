"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/app-shell/admin/admin-shell";
import { CatalogPage } from "@/features/admin/shared/catalog-page";
import { EmptyState } from "@/design-system/components/empty-state";
import { LoadingState } from "@/design-system/components/loading-state";
import { StatusBadge } from "@/design-system/components/status-badge";
import { Surface } from "@/design-system/components/surface";
import type { AdminAgentView } from "@/features/admin/agents/contracts";

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<AdminAgentView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadAgents() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/agents", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Não foi possível carregar agentes.");
      }

      setAgents(await response.json() as AdminAgentView[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar agentes.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAgents();
  }, []);

  async function handleDelete(agentId: string) {
    try {
      const response = await fetch(`/api/admin/agents/${agentId}`, { method: "DELETE" });

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? "Não foi possível excluir o agente.");
      }

      toast.success("Agente excluído com sucesso.");
      await loadAgents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir agente.");
    }
  }

  return (
    <AdminShell
      title="Agentes"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
        { label: "Agentes", href: "/config/agents" },
      ]}
    >
      <CatalogPage
        description="Gerencie prompts, objetivos e versões dos agentes ligados ao runtime."
        title="Agentes"
      >
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Link href="/config/agents/new">Novo agente</Link>
        </div>
        {isLoading ? <LoadingState message="Carregando agentes..." /> : null}
        {!isLoading && agents.length === 0 ? <EmptyState message="Nenhum agente configurado ainda." /> : null}
        {!isLoading && agents.length > 0 ? (
          <div style={{ display: "grid", gap: "1rem" }}>
            {agents.map((agent) => (
              <Surface key={agent.id}>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <strong>{agent.name}</strong>
                  {agent.objective ? <span>{agent.objective}</span> : null}
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <StatusBadge label={agent.enabled ? "Habilitado" : "Desabilitado"} tone={agent.enabled ? "default" : "secondary"} />
                    <StatusBadge label={`v${agent.version}`} tone="outline" />
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <Link href={`/config/agents/${agent.id}/edit`}>Editar</Link>
                    <Link href={`/config/agents/${agent.id}/evolve`}>Evoluir</Link>
                    <button onClick={() => void handleDelete(agent.id)} type="button">
                      Excluir
                    </button>
                  </div>
                </div>
              </Surface>
            ))}
          </div>
        ) : null}
      </CatalogPage>
    </AdminShell>
  );
}
