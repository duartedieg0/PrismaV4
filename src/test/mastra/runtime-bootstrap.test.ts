import { describe, expect, it, vi } from "vitest";
import { createAnalyzeAndAdaptWorkflow } from "@/mastra/workflows/analyze-and-adapt-workflow";
import { createExtractExamWorkflow } from "@/mastra/workflows/extract-exam-workflow";

describe("mastra runtime bootstrap", () => {
  it("registers the phase 7 workflows in a central Mastra instance", async () => {
    const { createPrismaMastraRuntime } = await import("@/mastra/runtime");

    const extractExamWorkflow = createExtractExamWorkflow({
      listModels: vi.fn().mockResolvedValue([
        {
          id: "model-1",
          name: "GPT 5.4",
          provider: "openai",
          modelId: "gpt-5.4",
          baseUrl: "https://api.openai.com/v1",
          apiKey: "secret",
          enabled: true,
          isDefault: true,
        },
      ]),
      runExtractionAgent: vi.fn().mockResolvedValue({ questions: [] }),
      persistExtraction: vi.fn().mockResolvedValue({ warnings: [], questionsCount: 0 }),
      registerEvent: vi.fn(),
    });

    const analyzeAndAdaptWorkflow = createAnalyzeAndAdaptWorkflow({
      loadExamContext: vi.fn().mockResolvedValue({
        exam: {
          id: "exam-1",
          subjectName: "Matemática",
          gradeLevelName: "7º ano",
          topicName: "Frações",
        },
        questions: [],
        supports: [],
      }),
      createPendingAdaptations: vi.fn().mockResolvedValue(undefined),
      persistAdaptation: vi.fn().mockResolvedValue(undefined),
      updateExamStatus: vi.fn().mockResolvedValue(undefined),
      runBnccAnalysis: vi.fn().mockResolvedValue({
        skills: ["EF07MA01"],
        analysis: "ok",
      }),
      runBloomAnalysis: vi.fn().mockResolvedValue({
        level: "Aplicar",
        analysis: "ok",
      }),
      runAdaptation: vi.fn().mockResolvedValue({
        adaptedContent: "ok",
        adaptedAlternatives: null,
      }),
      registerEvent: vi.fn(),
    });

    const mastra = createPrismaMastraRuntime({
      extractExamWorkflow,
      analyzeAndAdaptWorkflow,
    });

    expect(mastra.getWorkflowById(extractExamWorkflow.id)!.id).toBe(extractExamWorkflow.id);
    expect(mastra.getWorkflowById(analyzeAndAdaptWorkflow.id)!.id).toBe(
      analyzeAndAdaptWorkflow.id,
    );
  });
});
