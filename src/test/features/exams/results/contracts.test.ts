import { describe, expect, it } from "vitest";
import {
  createCopyEvent,
  createExamResultView,
  createFeedbackSubmission,
} from "@/features/exams/results/contracts";

describe("results contracts", () => {
  it("creates an exam result view with stable nested shapes", () => {
    const result = createExamResultView({
      examId: "exam-1",
      examStatus: "completed",
      subjectName: "Matemática",
      gradeLevelName: "7º ano",
      topicName: "Frações",
      supportNames: ["Dislexia"],
      createdAt: "2026-03-21T12:00:00.000Z",
      questions: [
        {
          questionId: "question-1",
          orderNum: 1,
          questionType: "objective",
          originalContent: "Quanto é 1/2 + 1/4?",
          originalAlternatives: [
            { label: "A", text: "1/3" },
            { label: "B", text: "3/4" },
          ],
          supports: [
            {
              adaptationId: "adaptation-1",
              supportId: "support-1",
              supportName: "Dislexia",
              status: "completed",
              adaptedContent: "Quanto é metade mais um quarto?",
              adaptedAlternatives: [
                {
                  id: "alt-1",
                  label: "A",
                  originalText: "1/3",
                  adaptedText: "um terço",
                  isCorrect: false,
                  position: 0,
                },
              ],
              bnccSkills: ["EF07MA01"],
              bloomLevel: "Aplicar",
              bnccAnalysis: "A questão trabalha soma de frações.",
              bloomAnalysis: "O estudante aplica o conceito.",
              copyBlock: {
                type: "objective",
                text: "Quanto é metade mais um quarto?\n\na) um terço",
              },
              feedback: null,
            },
          ],
        },
      ],
    });

    expect(result.examStatus).toBe("completed");
    expect(result.questions[0]?.supports[0]?.copyBlock?.type).toBe("objective");
  });

  it("creates copy events with deterministic payload fields", () => {
    const event = createCopyEvent({
      type: "adaptation_copied",
      examId: "exam-1",
      questionId: "question-1",
      adaptationId: "adaptation-1",
      supportId: "support-1",
      copiedTextLength: 128,
    });

    expect(event).toEqual({
      type: "adaptation_copied",
      examId: "exam-1",
      questionId: "question-1",
      adaptationId: "adaptation-1",
      supportId: "support-1",
      copiedTextLength: 128,
    });
  });

  it("creates feedback submissions with optional comments", () => {
    const submission = createFeedbackSubmission({
      adaptationId: "adaptation-1",
      rating: 4,
      comment: "Ficou útil em sala.",
    });

    expect(submission.rating).toBe(4);
    expect(submission.comment).toBe("Ficou útil em sala.");
  });
});
