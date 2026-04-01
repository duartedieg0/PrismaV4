import { describe, expect, it } from "vitest";
import {
  createEvolutionWorkflowFailure,
  createEvolutionWorkflowInput,
  createEvolutionWorkflowSuccess,
} from "@/mastra/contracts/evolution-contracts";
import { createExamExecutionMetadata } from "@/mastra/contracts/runtime-contracts";

describe("evolution workflow contracts", () => {
  it("creates the canonical workflow input for agent evolution", () => {
    const input = createEvolutionWorkflowInput({
      agentId: "agent-1",
      agentName: "Agente BNCC",
      initiatedBy: "admin-1",
      currentVersion: 2,
      currentPrompt: "Prompt atual",
      correlationId: "phase11",
      model: {
        id: "model-1",
        name: "GPT 5.4",
        provider: "openai",
        modelId: "gpt-5.4",
        baseUrl: "https://api.openai.com/v1",
        apiKey: "secret",
        enabled: true,
        isDefault: true,
      },
      feedbacks: [
        {
          id: "feedback-1",
          rating: 5,
          comment: "Mais objetivo",
          createdAt: "2026-03-21T00:00:00.000Z",
          originalContent: "Original",
          adaptedContent: "Adaptado",
          supportName: "Leitura guiada",
          dismissed: false,
          usedInEvolution: false,
        },
      ],
    });

    expect(input.agentId).toBe("agent-1");
    expect(input.currentVersion).toBe(2);
    expect(input.feedbacks).toHaveLength(1);
  });

  it("creates success and failure payloads with explicit evolution metadata", () => {
    const metadata = createExamExecutionMetadata({
      correlationId: "phase11",
      examId: "agent:agent-1",
      stage: "evolution",
      model: "openai/gpt-5.4",
      agentId: "agent-1",
      promptVersion: "evolution@v1",
    });
    const success = createEvolutionWorkflowSuccess({
      metadata,
      evolutionId: "evo-1",
      originalPrompt: "Prompt atual",
      suggestedPrompt: "Prompt novo",
      commentary: "Comentário",
      currentVersion: 2,
      suggestedVersion: 3,
    });
    const failure = createEvolutionWorkflowFailure({
      metadata,
      status: "error",
      failure: {
        stage: "evolution",
        code: "EVOLUTION_RUNTIME_FAILED",
        message: "Falha ao sugerir prompt.",
        retryable: false,
      },
    });

    expect(success.outcome).toBe("success");
    expect(success.suggestedVersion).toBe(3);
    expect(failure.outcome).toBe("error");
    expect(failure.failure.stage).toBe("evolution");
  });
});
