"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/app-shell/admin/admin-shell";
import { CatalogPage } from "@/features/admin/shared/catalog-page";
import { LoadingState } from "@/design-system/components/loading-state";
import { FeedbackSelector } from "@/features/admin/agents/evolution/components/feedback-selector";
import { PromptComparator } from "@/features/admin/agents/evolution/components/prompt-comparator";
import type { AdminAgentView } from "@/features/admin/agents/contracts";
import type { EvolutionSuggestion } from "@/features/admin/agents/evolution/contracts";

export default function EvolveAgentPage() {
  const params = useParams<{ id: string }>();
  const [agentId, setAgentId] = useState("");
  const [agent, setAgent] = useState<AdminAgentView | null>(null);
  const [suggestion, setSuggestion] = useState<EvolutionSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvolving, setIsEvolving] = useState(false);

  useEffect(() => {
    const id = params.id;

    if (!id) {
      setIsLoading(false);
      return;
    }

    void (async () => {
      setAgentId(id);

      try {
        const response = await fetch(`/api/admin/agents/${id}`, { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Não foi possível carregar o agente.");
        }

        setAgent(await response.json() as AdminAgentView);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao carregar agente.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [params.id]);

  async function handleEvolve(feedbackIds: string[]) {
    setIsEvolving(true);

    try {
      const response = await fetch(`/api/admin/agents/${agentId}/evolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedbackIds }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? "Não foi possível evoluir o agente.");
      }

      setSuggestion(await response.json() as EvolutionSuggestion);
      toast.success("Sugestão de evolução gerada com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao evoluir agente.");
    } finally {
      setIsEvolving(false);
    }
  }

  if (isLoading) {
    return (
      <AdminShell
        title="Evoluir agente"
        breadcrumbs={[
          { label: "Inicio", href: "/" },
          { label: "Admin", href: "/config" },
          { label: "Agentes", href: "/config/agents" },
          { label: "Evoluir", href: "#" },
        ]}
      >
        <LoadingState message="Carregando agente..." />
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Evoluir agente"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
        { label: "Agentes", href: "/config/agents" },
        { label: "Evoluir", href: `/config/agents/${agentId}/evolve` },
      ]}
    >
      <CatalogPage
        description={`${agent?.name ?? "Agente"} — selecione feedbacks reais para sugerir uma nova versão do prompt.`}
        title="Evolução assistida"
      >
        <Link href={`/config/agents/${agentId}/edit`}>Voltar para edição</Link>
        {suggestion ? (
          <PromptComparator
            agentId={agentId}
            commentary={suggestion.commentary}
            currentVersion={suggestion.currentVersion}
            evolutionId={suggestion.evolutionId}
            onComplete={() => setSuggestion(null)}
            originalPrompt={suggestion.originalPrompt}
            suggestedVersion={suggestion.suggestedVersion}
            suggestedPrompt={suggestion.suggestedPrompt}
          />
        ) : (
          <FeedbackSelector
            agentId={agentId}
            isEvolving={isEvolving}
            onEvolve={handleEvolve}
          />
        )}
      </CatalogPage>
    </AdminShell>
  );
}
