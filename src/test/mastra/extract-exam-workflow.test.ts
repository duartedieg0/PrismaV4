import { describe, expect, it, vi } from "vitest";
import { createExtractExamWorkflow, runExtractExamWorkflow } from "@/mastra/workflows/extract-exam-workflow";

describe("extract exam workflow", () => {
  it("persists a successful extraction and returns the canonical result", async () => {
    const persistExamUsage = vi.fn().mockResolvedValue(undefined);

    const workflow = createExtractExamWorkflow({
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
      runExtractionAgent: vi.fn().mockResolvedValue({
        questions: [
          {
            orderNum: 1,
            content: "Quanto é 2 + 2?",
            questionType: "objective",
            alternatives: [
              { label: "A", text: "3" },
              { label: "B", text: "4" },
            ],
            visualElements: null,
            extractionWarning: null,
          },
        ],
        usage: { inputTokens: 1200, outputTokens: 300 },
      }),
      persistExtraction: vi.fn().mockResolvedValue({
        warnings: [],
        questionsCount: 1,
      }),
      persistExamUsage,
      registerEvent: vi.fn(),
    });

    const result = await runExtractExamWorkflow(workflow, {
      examId: "exam-1",
      initiatedBy: "teacher-1",
      pdfPath: "teacher-1/exam-1.pdf",
      correlationId: "phase7",
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.result.outcome).toBe("success");
      expect(result.result.status).toBe("awaiting_answers");
      expect(result.result.questionsCount).toBe(1);
    }

    expect(persistExamUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        examId: "exam-1",
        stage: "extraction",
        inputTokens: 1200,
        outputTokens: 300,
        modelId: "gpt-5.4",
        estimatedCostUsd: expect.any(Number),
      }),
    );
  });

  it("marks the workflow as error when no valid questions survive normalization", async () => {
    const persistExtraction = vi.fn().mockResolvedValue({
      warnings: [],
      questionsCount: 0,
    });
    const registerEvent = vi.fn();

    const workflow = createExtractExamWorkflow({
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
      runExtractionAgent: vi.fn().mockResolvedValue({
        questions: [],
      }),
      persistExtraction,
      registerEvent,
    });

    const result = await runExtractExamWorkflow(workflow, {
      examId: "exam-2",
      initiatedBy: "teacher-1",
      pdfPath: "teacher-1/exam-2.pdf",
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.result.outcome).toBe("error");
      expect(result.result.status).toBe("error");
      expect(result.result.failure?.code).toBe("NO_VALID_QUESTIONS");
    }
    expect(persistExtraction).toHaveBeenCalledWith(
      expect.objectContaining({
        examId: "exam-2",
        status: "error",
      }),
    );
    expect(registerEvent).toHaveBeenCalledTimes(2);
  });

  it("calls persistExamUsage even on the error path (no valid questions)", async () => {
    const persistExamUsage = vi.fn().mockResolvedValue(undefined);

    const workflow = createExtractExamWorkflow({
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
      runExtractionAgent: vi.fn().mockResolvedValue({
        questions: [],
        usage: { inputTokens: 500, outputTokens: 100 },
      }),
      persistExtraction: vi.fn().mockResolvedValue({ warnings: [], questionsCount: 0 }),
      persistExamUsage,
      registerEvent: vi.fn(),
    });

    await runExtractExamWorkflow(workflow, {
      examId: "exam-err",
      initiatedBy: "teacher-1",
      pdfPath: "teacher-1/exam-err.pdf",
    });

    expect(persistExamUsage).toHaveBeenCalledWith(
      expect.objectContaining({ examId: "exam-err", stage: "extraction" }),
    );
  });
});
