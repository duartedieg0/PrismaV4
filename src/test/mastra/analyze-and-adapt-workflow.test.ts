import { describe, expect, it, vi } from "vitest";
import { createAnalyzeAndAdaptWorkflow, runAnalyzeAndAdaptWorkflow } from "@/mastra/workflows/analyze-and-adapt-workflow";

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

describe("analyze and adapt workflow", () => {
  it("processes questions and supports and completes the exam", async () => {
    const updateExamStatus = vi.fn().mockResolvedValue(undefined);
    const persistAdaptation = vi.fn().mockResolvedValue(undefined);
    const persistExamUsage = vi.fn().mockResolvedValue(undefined);

    const workflow = createAnalyzeAndAdaptWorkflow({
      loadExamContext: vi.fn().mockResolvedValue(examContext),
      createPendingAdaptations: vi.fn().mockResolvedValue(undefined),
      persistAdaptation,
      updateExamStatus,
      runBnccAnalysis: vi.fn().mockResolvedValue({
        skills: ["EF07MA01"],
        analysis: "A questão trabalha soma de frações.",
        usage: { inputTokens: 600, outputTokens: 150 },
      }),
      runBloomAnalysis: vi.fn().mockResolvedValue({
        level: "Aplicar",
        analysis: "O aluno aplica o conceito de frações.",
        usage: { inputTokens: 400, outputTokens: 100 },
      }),
      runAdaptation: vi.fn().mockResolvedValue({
        adaptedContent: "Quanto é metade mais um quarto?",
        adaptedAlternatives: [
          {
            id: "alt-0",
            label: "A",
            originalText: "1/3",
            adaptedText: "um terço",
            isCorrect: false,
            position: 0,
          },
          {
            id: "alt-1",
            label: "B",
            originalText: "3/4",
            adaptedText: "três quartos",
            isCorrect: true,
            position: 1,
          },
        ],
        usage: { inputTokens: 800, outputTokens: 200 },
      }),
      persistExamUsage,
      registerEvent: vi.fn(),
    });

    const result = await runAnalyzeAndAdaptWorkflow(workflow, {
      examId: "exam-1",
      initiatedBy: "teacher-1",
      correlationId: "phase7",
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.result.outcome).toBe("success");
      expect(result.result.status).toBe("completed");
      expect(result.result.processedAdaptations).toBe(1);
    }
    expect(updateExamStatus).toHaveBeenCalledWith({
      examId: "exam-1",
      status: "completed",
      errorMessage: null,
    });
    expect(persistAdaptation).toHaveBeenCalledWith(
      expect.objectContaining({
        supportId: "support-1",
        agentVersion: 3,
        promptVersion: "adaptation@v2/agent-v3",
      }),
    );
    expect(persistExamUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        examId: "exam-1",
        stage: "adaptation",
        // 600+400+800 = 1800 input, 150+100+200 = 450 output
        inputTokens: 1800,
        outputTokens: 450,
      }),
    );
  });

  it("calls persistExamUsage even when adaptation fails", async () => {
    const persistExamUsage = vi.fn().mockResolvedValue(undefined);
    const failContext = { ...examContext, exam: { ...examContext.exam, id: "exam-fail" } };

    const workflow = createAnalyzeAndAdaptWorkflow({
      loadExamContext: vi.fn().mockResolvedValue(failContext),
      createPendingAdaptations: vi.fn().mockResolvedValue(undefined),
      persistAdaptation: vi.fn().mockResolvedValue(undefined),
      updateExamStatus: vi.fn().mockResolvedValue(undefined),
      runBnccAnalysis: vi.fn().mockRejectedValue(new Error("BNCC falhou")),
      runBloomAnalysis: vi.fn().mockResolvedValue({ level: "Lembrar", analysis: ".", usage: { inputTokens: 0, outputTokens: 0 } }),
      runAdaptation: vi.fn().mockResolvedValue({ adaptedContent: ".", adaptedAlternatives: null, usage: { inputTokens: 0, outputTokens: 0 } }),
      persistExamUsage,
      registerEvent: vi.fn(),
    });

    await runAnalyzeAndAdaptWorkflow(workflow, { examId: "exam-fail" });

    expect(persistExamUsage).toHaveBeenCalledWith(
      expect.objectContaining({ examId: "exam-fail", stage: "adaptation" }),
    );
  });
});
