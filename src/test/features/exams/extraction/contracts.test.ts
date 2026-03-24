import { describe, expect, it } from "vitest";
import {
  createAnswerReviewSubmission,
  createExtractionRequest,
  createExtractionResult,
  type AnswerReviewSubmission,
  type ExtractionRequest,
  type ExtractionResult,
} from "@/features/exams/extraction/contracts";

describe("extraction contracts", () => {
  it("creates a typed extraction request for the legacy-compatible runtime", () => {
    const request: ExtractionRequest = createExtractionRequest({
      examId: "exam-1",
      pdfPath: "teacher-1/exam-1.pdf",
      initiatedBy: "teacher-1",
    });

    expect(request).toEqual({
      examId: "exam-1",
      pdfPath: "teacher-1/exam-1.pdf",
      initiatedBy: "teacher-1",
    });
  });

  it("creates stable extraction and answer review payloads", () => {
    const result: ExtractionResult = createExtractionResult({
      outcome: "success",
      status: "awaiting_answers",
      questions: [
        {
          orderNum: 1,
          content: "Quanto é 2 + 2?",
          questionType: "objective",
          alternatives: [
            { label: "A", text: "3" },
            { label: "B", text: "4" },
          ],
          visualElements: [
            { type: "chart", description: "Gráfico simples de barras." },
          ],
          extractionWarning: "Alternativa C não estava totalmente legível.",
        },
      ],
      warnings: ["Alternativa C não estava totalmente legível."],
      fatalErrorMessage: null,
    });
    const submission: AnswerReviewSubmission = createAnswerReviewSubmission({
      answers: [
        { questionId: "question-1", correctAnswer: "B" },
        { questionId: "question-2", correctAnswer: "Resposta construída" },
      ],
    });

    expect(result.status).toBe("awaiting_answers");
    expect(result.questions[0]?.visualElements?.[0]).toEqual({
      type: "chart",
      description: "Gráfico simples de barras.",
    });
    expect(submission.answers).toHaveLength(2);
    expect(submission.answers[0]).toEqual({
      questionId: "question-1",
      correctAnswer: "B",
    });
  });
});
