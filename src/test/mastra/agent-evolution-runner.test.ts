import { describe, expect, it, vi } from "vitest";
import { runAgentEvolutionAgent } from "@/mastra/agents/agent-evolution-runner";

const generateMock = vi.fn();

vi.mock("@/mastra/agents/agent-evolution-agent", () => ({
  createAgentEvolutionAgent: vi.fn(() => ({
    generate: generateMock,
  })),
}));

describe("agent evolution runner", () => {
  it("normalizes a valid structured suggestion", async () => {
    generateMock.mockResolvedValueOnce({
      object: {
        suggestedPrompt: "Novo prompt",
        commentary: "Comentário",
      },
    });

    const result = await runAgentEvolutionAgent({
      prompt: "Prompt",
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
    });

    expect(result).toEqual({
      suggestedPrompt: "Novo prompt",
      commentary: "Comentário",
    });
  });

  it("fails when the runtime returns an invalid payload", async () => {
    generateMock.mockResolvedValueOnce({
      object: {
        commentary: "Sem prompt",
      },
    });

    await expect(
      runAgentEvolutionAgent({
        prompt: "Prompt",
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
      }),
    ).rejects.toThrow(/resposta inválida/i);
  });
});
