"use client";

import { toast } from "sonner";
import { Surface } from "@/design-system/components/surface";

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          evolutionId,
          accepted,
          suggestedPrompt,
        }),
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
    <div style={{ display: "grid", gap: "1rem" }}>
      <Surface tone="hero" padding="1.25rem">
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <h2 style={{ margin: 0 }}>Parecer da evolução</h2>
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>{commentary}</p>
        </div>
        {currentVersion && suggestedVersion ? (
          <p style={{ margin: 0, fontFamily: "var(--font-mono), monospace", color: "var(--color-text-accent)" }}>{`Promoção de versão: v${currentVersion} -> v${suggestedVersion}`}</p>
        ) : null}
      </Surface>

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <Surface padding="1.25rem">
          <h3 style={{ marginTop: 0 }}>Prompt atual</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>{originalPrompt}</pre>
        </Surface>
        <Surface padding="1.25rem">
          <h3 style={{ marginTop: 0 }}>Prompt sugerido</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>{suggestedPrompt}</pre>
        </Surface>
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button onClick={() => void resolveEvolution(true)} type="button">
          Aceitar sugestão
        </button>
        <button onClick={() => void resolveEvolution(false)} type="button">
          Rejeitar sugestão
        </button>
      </div>
    </div>
  );
}
