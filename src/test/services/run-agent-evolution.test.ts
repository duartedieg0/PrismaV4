import { describe, expect, it, vi } from "vitest";
import { runAgentEvolution } from "@/services/ai/run-agent-evolution";

describe("runAgentEvolution", () => {
  it("returns the canonical workflow suggestion", async () => {
    const result = await runAgentEvolution(
      {
        agentId: "agent-1",
        agentName: "Agente BNCC",
        currentPrompt: "Prompt atual",
        currentVersion: 1,
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
            comment: "Mais objetivo",
            createdAt: "2026-03-21T00:00:00.000Z",
            originalContent: "Original",
            adaptedContent: "Adaptado",
            supportName: "Leitura guiada",
            dismissed: false,
            usedInEvolution: false,
          },
        ],
      },
      {
        runEvolution: vi.fn().mockResolvedValue({
          suggestedPrompt: "Prompt novo",
          commentary: "Comentário",
        }),
        persistEvolution: vi.fn().mockResolvedValue({
          evolutionId: "evo-1",
        }),
        registerEvent: vi.fn(),
      },
    );

    expect(result.evolutionId).toBe("evo-1");
    expect(result.suggestedVersion).toBe(2);
  });
});
