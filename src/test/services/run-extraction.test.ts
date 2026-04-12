import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { runExtraction } from "@/services/ai/run-extraction";

const defaultModel = {
  id: "model-1",
  name: "GPT 5.4",
  provider: "openai",
  modelId: "gpt-5.4",
  baseUrl: "https://api.openai.com/v1",
  apiKey: "secret",
  enabled: true,
  isDefault: true,
} as const;

describe("run extraction service", () => {
  it("returns the workflow success payload for the product layer", async () => {
    const result = await runExtraction(
      {
        examId: "exam-1",
        initiatedBy: "teacher-1",
        pdfPath: "teacher-1/exam-1.pdf",
      },
      {
        listModels: vi.fn().mockResolvedValue([defaultModel]),
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
          usage: { inputTokens: 100, outputTokens: 50 },
        }),
        persistExtraction: vi.fn().mockResolvedValue({
          warnings: [],
          questionsCount: 1,
        }),
        registerEvent: vi.fn(),
      },
    );

    expect(result.outcome).toBe("success");
    expect(result.status).toBe("awaiting_answers");
  });

  it("returns the workflow error payload when no valid question is found", async () => {
    const result = await runExtraction(
      {
        examId: "exam-2",
        initiatedBy: "teacher-1",
        pdfPath: "teacher-1/exam-2.pdf",
      },
      {
        listModels: vi.fn().mockResolvedValue([defaultModel]),
        runExtractionAgent: vi.fn().mockResolvedValue({
          questions: [],
          usage: { inputTokens: 100, outputTokens: 50 },
        }),
        persistExtraction: vi.fn().mockResolvedValue({
          warnings: [],
          questionsCount: 0,
        }),
        registerEvent: vi.fn(),
      },
    );

    expect(result.outcome).toBe("error");
    expect(result.status).toBe("error");
    if (result.outcome === "error") {
      expect(result.failure.code).toBe("NO_VALID_QUESTIONS");
    }
  });

  it("does not throw when exam_usage upsert fails", async () => {
    const failingSupabase = {
      from: () => ({
        upsert: () => Promise.reject(new Error("DB error")),
      }),
    } as unknown as SupabaseClient;

    await expect(
      runExtraction(
        { examId: "exam-1", initiatedBy: "teacher-1", pdfPath: "teacher-1/exam-1.pdf" },
        {
          listModels: vi.fn().mockResolvedValue([defaultModel]),
          runExtractionAgent: vi.fn().mockResolvedValue({
            questions: [
              {
                orderNum: 1,
                content: "Quanto é 2 + 2?",
                questionType: "objective",
                alternatives: [{ label: "A", text: "4" }],
                visualElements: null,
                extractionWarning: null,
              },
            ],
            usage: { inputTokens: 100, outputTokens: 50 },
          }),
          persistExtraction: vi.fn().mockResolvedValue({ warnings: [], questionsCount: 1 }),
          registerEvent: vi.fn(),
        },
        failingSupabase,
      ),
    ).resolves.toEqual(
      expect.objectContaining({ outcome: "success" }),
    );
  });
});
