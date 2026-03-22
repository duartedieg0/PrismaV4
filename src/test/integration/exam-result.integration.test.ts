import { describe, expect, it } from "vitest";
import { getExamResult } from "@/features/exams/results/get-exam-result";

describe("exam result integration", () => {
  it("keeps supports grouped per question and exposes partial support errors", async () => {
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
          examSupports: [
            { supports: { id: "support-1", name: "Dislexia" } },
            { supports: { id: "support-2", name: "TDAH" } },
          ],
          questions: [
            {
              id: "question-1",
              order_num: 1,
              content: "Quanto é 1/2 + 1/4?",
              question_type: "essay",
              alternatives: null,
              adaptations: [
                {
                  id: "adaptation-1",
                  support_id: "support-1",
                  adapted_content: "Quanto é metade mais um quarto?",
                  adapted_alternatives: null,
                  bncc_skills: null,
                  bloom_level: null,
                  bncc_analysis: null,
                  bloom_analysis: null,
                  status: "completed",
                  supports: { id: "support-1", name: "Dislexia" },
                  feedbacks: [],
                },
                {
                  id: "adaptation-2",
                  support_id: "support-2",
                  adapted_content: null,
                  adapted_alternatives: null,
                  bncc_skills: null,
                  bloom_level: null,
                  bncc_analysis: null,
                  bloom_analysis: null,
                  status: "error",
                  supports: { id: "support-2", name: "TDAH" },
                  feedbacks: [],
                },
              ],
            },
          ],
        }),
      },
    });

    expect(result.kind).toBe("success");
    if (result.kind === "success") {
      expect(result.value.supportNames).toEqual(["Dislexia", "TDAH"]);
      expect(result.value.questions[0]?.supports).toHaveLength(2);
      expect(result.value.questions[0]?.supports[1]?.status).toBe("error");
    }
  });
});
