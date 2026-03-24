import { describe, expect, it, vi } from "vitest";
import { processExtraction } from "@/features/exams/extraction/process-extraction";

const extractionPayload = {
  questions: [
    {
      orderNum: 1,
      content: "Quanto é 2 + 2?",
      questionType: "objective" as const,
      alternatives: [
        { label: "A", text: "3" },
        { label: "B", text: "4" },
      ],
      visualElements: null,
      extractionWarning: null,
    },
  ],
};

describe("processExtraction", () => {
  it("normalizes, replaces questions and marks the exam as awaiting answers", async () => {
    const deleteQuestionsByExamId = vi.fn().mockResolvedValue({ error: null });
    const insertQuestions = vi.fn().mockResolvedValue({ error: null });
    const updateExamStatus = vi.fn().mockResolvedValue({ error: null });

    const result = await processExtraction({
      request: {
        examId: "exam-1",
        pdfPath: "teacher-1/exam-1.pdf",
        initiatedBy: "teacher-1",
      },
      dependencies: {
        runLegacyExtraction: vi.fn().mockResolvedValue(extractionPayload),
        deleteQuestionsByExamId,
        insertQuestions,
        updateExamStatus,
      },
    });

    expect(deleteQuestionsByExamId).toHaveBeenCalledWith({
      examId: "exam-1",
    });
    expect(insertQuestions).toHaveBeenCalledWith({
      examId: "exam-1",
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
    });
    expect(updateExamStatus).toHaveBeenCalledWith({
      examId: "exam-1",
      status: "awaiting_answers",
      errorMessage: null,
    });
    expect(result.status).toBe("awaiting_answers");
  });

  it("marks the exam as error when normalization returns no valid questions", async () => {
    const updateExamStatus = vi.fn().mockResolvedValue({ error: null });

    const result = await processExtraction({
      request: {
        examId: "exam-1",
        pdfPath: "teacher-1/exam-1.pdf",
        initiatedBy: "teacher-1",
      },
      dependencies: {
        runLegacyExtraction: vi.fn().mockResolvedValue({ questions: [] }),
        deleteQuestionsByExamId: vi.fn(),
        insertQuestions: vi.fn(),
        updateExamStatus,
      },
    });

    expect(updateExamStatus).toHaveBeenCalledWith({
      examId: "exam-1",
      status: "error",
      errorMessage: "Nenhuma questão válida foi encontrada no PDF. Revise o arquivo enviado.",
    });
    expect(result.status).toBe("error");
    expect(result.fatalErrorMessage).toMatch(/nenhuma questão válida/i);
  });
});
