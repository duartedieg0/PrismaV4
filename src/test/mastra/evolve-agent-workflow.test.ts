import { describe, expect, it, vi } from "vitest";
import {
  createEvolveAgentWorkflow,
  runEvolveAgentWorkflow,
} from "@/mastra/workflows/evolve-agent-workflow";

describe("evolve agent workflow", () => {
  it("persists a successful prompt suggestion and returns the canonical result", async () => {
    const persistEvolution = vi.fn().mockResolvedValue({
      evolutionId: "evo-1",
    });

    const workflow = createEvolveAgentWorkflow({
      runEvolution: vi.fn().mockResolvedValue({
        suggestedPrompt: "Prompt novo",
        commentary: "Comentário",
      }),
      persistEvolution,
      registerEvent: vi.fn(),
    });

    const result = await runEvolveAgentWorkflow(workflow, {
      agentId: "agent-1",
      agentName: "Agente BNCC",
      currentPrompt: "Prompt atual",
      currentVersion: 2,
      initiatedBy: "admin-1",
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
          comment: "Melhorar clareza",
          createdAt: "2026-03-21T00:00:00.000Z",
          originalContent: "Original",
          adaptedContent: "Adaptado",
          supportName: "Leitura guiada",
          dismissed: false,
          usedInEvolution: false,
        },
      ],
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.result.outcome).toBe("success");
      expect(result.result.evolutionId).toBe("evo-1");
      expect(result.result.suggestedVersion).toBe(3);
    }
    expect(persistEvolution).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: "agent-1",
        suggestedPrompt: "Prompt novo",
      }),
    );
  });
});
