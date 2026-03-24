import { describe, expect, it } from "vitest";
import { getExamResult } from "@/features/exams/results/get-exam-result";

describe("getExamResult", () => {
  it("maps a completed exam into the canonical result view", async () => {
    const result = await getExamResult({
      examId: "exam-1",
      actorUserId: "teacher-1",
      dependencies: {
        loadExamResult: async () => ({
          exam: {
            id: "exam-1",
            user_id: "teacher-1",
            status: "completed",
            topic: "Frações",
            created_at: "2026-03-21T12:00:00.000Z",
            subjects: { name: "Matemática" },
            grade_levels: { name: "7º ano" },
          },
          examSupports: [{ supports: { id: "support-1", name: "Dislexia" } }],
          questions: [
            {
              id: "question-1",
              order_num: 1,
              content: "Quanto é 1/2 + 1/4?",
              question_type: "objective",
              alternatives: [
                { label: "A", text: "1/3" },
                { label: "B", text: "3/4" },
              ],
              adaptations: [
                {
                  id: "adaptation-1",
                  support_id: "support-1",
                  adapted_content: "Quanto é metade mais um quarto?",
                  adapted_alternatives: [
                    {
                      id: "alt-1",
                      label: "A",
                      originalText: "1/3",
                      adaptedText: "um terço",
                      isCorrect: false,
                      position: 0,
                    },
                  ],
                  bncc_skills: ["EF07MA01"],
                  bloom_level: "Aplicar",
                  bncc_analysis: "Trabalha soma de frações.",
                  bloom_analysis: "Aplica o conceito.",
                  status: "completed",
                  supports: { id: "support-1", name: "Dislexia" },
                  feedbacks: [{ id: "feedback-1", rating: 5, comment: "Ótimo" }],
                },
              ],
            },
          ],
        }),
      },
    });

    expect(result.kind).toBe("success");
    if (result.kind === "success") {
      expect(result.value.subjectName).toBe("Matemática");
      expect(result.value.questions[0]?.supports[0]?.feedback?.rating).toBe(5);
      expect(result.value.questions[0]?.supports[0]?.copyBlock?.text).toContain(
        "Quanto é metade mais um quarto?",
      );
    }
  });

  it("returns forbidden when the exam does not belong to the actor", async () => {
    const result = await getExamResult({
      examId: "exam-1",
      actorUserId: "teacher-2",
      dependencies: {
        loadExamResult: async () => ({
          exam: {
            id: "exam-1",
            user_id: "teacher-1",
            status: "completed",
            topic: null,
            created_at: "2026-03-21T12:00:00.000Z",
            subjects: null,
            grade_levels: null,
          },
          examSupports: [],
          questions: [],
        }),
      },
    });

    expect(result).toEqual({
      kind: "forbidden",
    });
  });

  it("returns processing when the exam is not completed yet", async () => {
    const result = await getExamResult({
      examId: "exam-1",
      actorUserId: "teacher-1",
      dependencies: {
        loadExamResult: async () => ({
          exam: {
            id: "exam-1",
            user_id: "teacher-1",
            status: "analyzing",
            topic: null,
            created_at: "2026-03-21T12:00:00.000Z",
            subjects: null,
            grade_levels: null,
          },
          examSupports: [],
          questions: [],
        }),
      },
    });

    expect(result).toEqual({
      kind: "processing",
      status: "analyzing",
    });
  });
});
