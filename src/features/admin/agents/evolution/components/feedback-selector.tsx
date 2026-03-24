"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/design-system/components/button";
import { EmptyState } from "@/design-system/components/empty-state";
import { LoadingState } from "@/design-system/components/loading-state";
import type { EvolutionFeedbackView } from "@/features/admin/agents/evolution/contracts";

type FeedbackSelectorProps = {
  agentId: string;
  isEvolving: boolean;
  onEvolve: (feedbackIds: string[]) => Promise<void> | void;
};

export function FeedbackSelector({
  agentId,
  isEvolving,
  onEvolve,
}: FeedbackSelectorProps) {
  const [feedbacks, setFeedbacks] = useState<EvolutionFeedbackView[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(`/api/admin/agents/${agentId}/feedbacks`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Não foi possível carregar feedbacks elegíveis.");
        }

        const nextFeedbacks = await response.json() as EvolutionFeedbackView[];
        setFeedbacks(nextFeedbacks);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao carregar feedbacks.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [agentId]);

  function toggleFeedback(feedbackId: string) {
    setSelectedIds((current) =>
      current.includes(feedbackId)
        ? current.filter((id) => id !== feedbackId)
        : [...current, feedbackId]
    );
  }

  if (isLoading) {
    return <LoadingState message="Carregando feedbacks elegíveis..." />;
  }

  if (feedbacks.length === 0) {
    return <EmptyState message="Nenhum feedback elegível para evolução foi encontrado." />;
  }

  return (
    <div className="flex flex-col gap-4">
      {feedbacks.map((feedback) => {
        const isSelected = selectedIds.includes(feedback.id);
        const isDisabled = feedback.dismissed || feedback.usedInEvolution;

        return (
          <label
            key={feedback.id}
            className={cn(
              "flex flex-col gap-2 rounded-2xl border p-5 transition-all duration-200",
              isDisabled
                ? "cursor-not-allowed border-border-default bg-surface-muted/50 opacity-60"
                : isSelected
                  ? "cursor-pointer border-brand-300 bg-brand-50"
                  : "cursor-pointer border-border-default bg-white hover:border-border-strong",
            )}
          >
            <span className="flex items-center gap-2 text-sm">
              <input
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => toggleFeedback(feedback.id)}
                type="checkbox"
                className="h-4 w-4 rounded border-border-default text-brand-600 focus:ring-brand-200"
              />
              Selecionar feedback
            </span>
            <strong className="text-sm font-semibold text-text-primary">{feedback.supportName}</strong>
            <span className="font-mono text-sm text-brand-600">Nota: {feedback.rating}</span>
            <span className="text-sm text-text-primary">{feedback.comment ?? "Sem comentário"}</span>
            <span className="text-sm text-text-secondary">{feedback.originalContent}</span>
            <span className="text-sm text-text-primary">{feedback.adaptedContent ?? "Sem adaptação persistida"}</span>
            {feedback.usedInEvolution ? <span className="text-xs text-amber-600">Já utilizado em uma evolução anterior.</span> : null}
            {feedback.dismissed ? <span className="text-xs text-red-600">Marcado como dispensado da evolução.</span> : null}
          </label>
        );
      })}

      <Button
        disabled={selectedIds.length === 0 || isEvolving}
        onClick={() => void onEvolve(selectedIds)}
        type="button"
        variant="accent"
        size="md"
      >
        Gerar sugestão de evolução
      </Button>
    </div>
  );
}
