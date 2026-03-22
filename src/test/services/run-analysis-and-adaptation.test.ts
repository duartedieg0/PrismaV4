import { describe, expect, it, vi } from "vitest";
import { runAnalysisAndAdaptation } from "@/services/ai/run-analysis-and-adaptation";

const examContext = {
  exam: {
    id: "exam-1",
    subjectName: "Matemática",
    gradeLevelName: "7º ano",
    topicName: "Frações",
  },
  questions: [
    {
      id: "question-1",
      orderNum: 1,
      content: "Quanto é 1/2 + 1/4?",
      questionType: "objective" as const,
      alternatives: [
        { label: "A", text: "1/3" },
        { label: "B", text: "3/4" },
      ],
      correctAnswer: "B",
    },
  ],
  supports: [
    {
      id: "support-1",
      name: "Dislexia",
      agentId: "agent-1",
      agentVersion: 3,
      modelId: "model-1",
      prompt: "Adapte com linguagem simples.",
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
    },
  ],
};

describe("run analysis and adaptation service", () => {
  it("returns a product-facing success payload", async () => {
    const result = await runAnalysisAndAdaptation(
      { examId: "exam-1" },
      {
        loadExamContext: vi.fn().mockResolvedValue(examContext),
        createPendingAdaptations: vi.fn().mockResolvedValue(undefined),
        persistAdaptation: vi.fn().mockResolvedValue(undefined),
        updateExamStatus: vi.fn().mockResolvedValue(undefined),
        runBnccAnalysis: vi.fn().mockResolvedValue({
          skills: ["EF07MA01"],
          analysis: "A questão trabalha soma de frações.",
        }),
        runBloomAnalysis: vi.fn().mockResolvedValue({
          level: "Aplicar",
          analysis: "O aluno aplica o conceito de frações.",
        }),
        runAdaptation: vi.fn().mockResolvedValue({
          adaptedContent: "Quanto é metade mais um quarto?",
          adaptedAlternatives: null,
        }),
        registerEvent: vi.fn(),
      },
    );

    expect(result.outcome).toBe("success");
    if (result.outcome === "success") {
      expect(result.processedQuestions).toBe(1);
      expect(result.adaptationStatus).toBe("completed");
    }
  });
});
