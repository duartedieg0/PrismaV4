"use client";

import { toast } from "sonner";
import { Button } from "@/design-system/components/button";

type PromptComparatorProps = {
  agentId: string;
  evolutionId: string;
  originalPrompt: string;
  suggestedPrompt: string;
  commentary: string;
  currentVersion?: number;
  suggestedVersion?: number;
  onComplete: () => void;
};

export function PromptComparator({
  agentId,
  evolutionId,
  originalPrompt,
  suggestedPrompt,
  commentary,
  currentVersion,
  suggestedVersion,
  onComplete,
}: PromptComparatorProps) {
  async function resolveEvolution(accepted: boolean) {
    try {
      const response = await fetch(`/api/admin/agents/${agentId}/evolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evolutionId, accepted, suggestedPrompt }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível concluir a revisão da evolução.");
      }

      toast.success(
        accepted
          ? "Nova versão do prompt aplicada com sucesso."
          : "Sugestão rejeitada com sucesso.",
      );
      onComplete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao concluir evolução.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-5">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-text-primary">Parecer da evolução</h2>
          <p className="text-sm text-text-secondary">{commentary}</p>
        </div>
        {currentVersion && suggestedVersion ? (
          <p className="mt-2 font-mono text-sm text-brand-600">{`Promoção de versão: v${currentVersion} -> v${suggestedVersion}`}</p>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border-default bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Prompt atual</h3>
          <pre className="whitespace-pre-wrap text-sm text-text-secondary">{originalPrompt}</pre>
        </div>
        <div className="rounded-2xl border border-border-default bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Prompt sugerido</h3>
          <pre className="whitespace-pre-wrap text-sm text-text-secondary">{suggestedPrompt}</pre>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={() => void resolveEvolution(true)} type="button" variant="primary" size="sm">
          Aceitar sugestão
        </Button>
        <Button onClick={() => void resolveEvolution(false)} type="button" variant="danger" size="sm">
          Rejeitar sugestão
        </Button>
      </div>
    </div>
  );
}
