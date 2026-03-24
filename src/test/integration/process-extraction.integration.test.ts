import { describe, expect, it, vi } from "vitest";
import { processExtraction } from "@/features/exams/extraction/process-extraction";

describe("process extraction integration", () => {
  it("preserves warnings and still advances to review when extraction is partial", async () => {
    const result = await processExtraction({
      request: {
        examId: "exam-1",
        pdfPath: "teacher-1/exam-1.pdf",
        initiatedBy: "teacher-1",
      },
      dependencies: {
        runLegacyExtraction: vi.fn().mockResolvedValue({
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
              extractionWarning: "A alternativa C estava ilegível.",
            },
          ],
        }),
        deleteQuestionsByExamId: vi.fn().mockResolvedValue({ error: null }),
        insertQuestions: vi.fn().mockResolvedValue({ error: null }),
        updateExamStatus: vi.fn().mockResolvedValue({ error: null }),
      },
    });

    expect(result.status).toBe("awaiting_answers");
    expect(result.warnings).toEqual(["A alternativa C estava ilegível."]);
  });

  it("fails fast when question persistence fails", async () => {
    await expect(
      processExtraction({
        request: {
          examId: "exam-1",
          pdfPath: "teacher-1/exam-1.pdf",
          initiatedBy: "teacher-1",
        },
        dependencies: {
          runLegacyExtraction: vi.fn().mockResolvedValue({
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
          }),
          deleteQuestionsByExamId: vi.fn().mockResolvedValue({ error: null }),
          insertQuestions: vi.fn().mockResolvedValue({
            error: { message: "insert failed" },
          }),
          updateExamStatus: vi.fn().mockResolvedValue({ error: null }),
        },
      }),
    ).rejects.toThrow("Erro ao salvar as questões extraídas.");
  });
});
