"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/design-system/components/empty-state";
import { LoadingState } from "@/design-system/components/loading-state";
import { Surface } from "@/design-system/components/surface";
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
    <div style={{ display: "grid", gap: "1rem" }}>
      {feedbacks.map((feedback) => (
        <Surface key={feedback.id} padding="1.1rem">
          <label style={{ display: "grid", gap: "0.75rem" }}>
            <span style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                checked={selectedIds.includes(feedback.id)}
                disabled={feedback.dismissed || feedback.usedInEvolution}
                onChange={() => toggleFeedback(feedback.id)}
                type="checkbox"
              />
              Selecionar feedback
            </span>
            <strong>{feedback.supportName}</strong>
            <span style={{ color: "var(--color-text-accent)", fontFamily: "var(--font-mono), monospace" }}>Nota: {feedback.rating}</span>
            <span>{feedback.comment ?? "Sem comentário"}</span>
            <span style={{ color: "var(--color-text-muted)" }}>{feedback.originalContent}</span>
            <span style={{ color: "var(--color-text-primary)" }}>{feedback.adaptedContent ?? "Sem adaptação persistida"}</span>
            {feedback.usedInEvolution ? <span style={{ color: "var(--warning)" }}>Já utilizado em uma evolução anterior.</span> : null}
            {feedback.dismissed ? <span style={{ color: "var(--danger)" }}>Marcado como dispensado da evolução.</span> : null}
          </label>
        </Surface>
      ))}

      <button
        disabled={selectedIds.length === 0 || isEvolving}
        onClick={() => void onEvolve(selectedIds)}
        type="button"
      >
        Gerar sugestão de evolução
      </button>
    </div>
  );
}
