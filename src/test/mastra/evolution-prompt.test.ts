import { describe, expect, it } from "vitest";
import {
  EVOLUTION_PROMPT_VERSION,
  buildEvolutionPrompt,
} from "@/mastra/prompts/evolution-prompt";

describe("evolution prompt", () => {
  it("renders the selected feedback context and output contract", () => {
    const prompt = buildEvolutionPrompt({
      agentName: "Agente BNCC",
      objective: "Melhorar análise pedagógica",
      currentPrompt: "Prompt atual",
      feedbacks: [
        {
          id: "feedback-1",
          rating: 4,
          comment: "Mais objetivo",
          createdAt: "2026-03-21T00:00:00.000Z",
          originalContent: "Questão original",
          adaptedContent: "Questão adaptada",
          supportName: "Dislexia",
          dismissed: false,
          usedInEvolution: false,
        },
      ],
    });

    expect(EVOLUTION_PROMPT_VERSION).toBe("evolution@v1");
    expect(prompt).toContain("Agente: Agente BNCC");
    expect(prompt).toContain("Feedback 1");
    expect(prompt).toMatch(/responda apenas em json válido/i);
  });
});
