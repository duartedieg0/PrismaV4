"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/app-shell/admin/admin-shell";
import { Button } from "@/design-system/components/button";
import { EmptyState } from "@/design-system/components/empty-state";
import { LoadingState } from "@/design-system/components/loading-state";
import { StatusBadge } from "@/design-system/components/status-badge";
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
      description="Gerencie prompts, objetivos e versões dos agentes ligados ao runtime."
      activeNav="agents"
      primaryAction={{ label: "Novo agente", href: "/config/agents/new", ariaLabel: "Criar novo agente" }}
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
        { label: "Agentes", href: "/config/agents" },
      ]}
    >
      {isLoading ? <LoadingState message="Carregando agentes..." /> : null}
      {!isLoading && agents.length === 0 ? <EmptyState message="Nenhum agente configurado ainda." /> : null}
      {!isLoading && agents.length > 0 ? (
        <div className="flex flex-col gap-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex flex-col gap-3 rounded-2xl border border-border-default bg-white p-5 transition-colors hover:border-border-strong"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <strong className="text-sm font-semibold text-text-primary">{agent.name}</strong>
                  {agent.objective ? (
                    <span className="text-sm text-text-secondary">{agent.objective}</span>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link href={`/config/agents/${agent.id}/edit`}>
                    <Button type="button" variant="outline" size="sm">Editar</Button>
                  </Link>
                  <Link href={`/config/agents/${agent.id}/evolve`}>
                    <Button type="button" variant="secondary" size="sm">Evoluir</Button>
                  </Link>
                  <Button onClick={() => void handleDelete(agent.id)} type="button" variant="danger" size="sm">
                    Excluir
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge label={agent.enabled ? "Habilitado" : "Desabilitado"} tone={agent.enabled ? "default" : "secondary"} />
                <StatusBadge label={`v${agent.version}`} tone="outline" />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </AdminShell>
  );
}
