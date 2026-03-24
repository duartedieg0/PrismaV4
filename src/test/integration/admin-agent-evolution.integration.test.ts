import { describe, expect, it, vi } from "vitest";
import { suggestAgentEvolution } from "@/features/admin/agents/evolution/service";

vi.mock("@/services/ai/run-agent-evolution", () => ({
  runAgentEvolution: vi.fn().mockResolvedValue({
    evolutionId: "evo-1",
    originalPrompt: "Prompt atual",
    suggestedPrompt: "Novo prompt",
    commentary: "Comentário",
    currentVersion: 1,
    suggestedVersion: 2,
  }),
}));

describe("agent evolution integration", () => {
  it("normalizes a valid runtime suggestion", async () => {
    const result = await suggestAgentEvolution({
      agentId: "agent-1",
      agentName: "Agente BNCC",
      objective: "Analisar adaptação",
      currentPrompt: "Prompt atual",
      currentVersion: 1,
      initiatedBy: "admin-1",
      model: {
        id: "model-1",
        name: "GPT",
        provider: "openai",
        base_url: "https://example.com",
        api_key: "secret",
        model_id: "gpt-5.4",
        enabled: true,
        is_default: true,
        system_role: "evolution",
        created_at: "2026-03-21T00:00:00.000Z",
      },
      feedbacks: [{
        id: "feedback-1",
        rating: 5,
        comment: "Ajustar clareza",
        createdAt: "2026-03-21T00:00:00.000Z",
        originalContent: "Original",
        adaptedContent: "Adaptado",
        supportName: "Leitura guiada",
        dismissed: false,
        usedInEvolution: false,
      }],
      persistEvolution: vi.fn().mockResolvedValue({
        evolutionId: "evo-1",
      }),
    });

    expect(result).toEqual({
      originalPrompt: "Prompt atual",
      evolutionId: "evo-1",
      suggestedPrompt: "Novo prompt",
      commentary: "Comentário",
      currentVersion: 1,
      suggestedVersion: 2,
    });
  });
});
