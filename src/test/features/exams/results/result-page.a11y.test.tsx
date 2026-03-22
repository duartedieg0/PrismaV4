import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { ResultPageView } from "@/features/exams/results/components/result-page";

vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ id: "feedback-1", rating: 5, comment: null }),
}));

vi.stubGlobal("navigator", {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

describe("result page accessibility", () => {
  it("keeps the result surface accessible", async () => {
    const { container } = render(
      <ResultPageView
        result={{
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
              questionType: "essay",
              originalContent: "Explique o conceito de fração.",
              originalAlternatives: null,
              supports: [
                {
                  adaptationId: "adaptation-1",
                  supportId: "support-1",
                  supportName: "Dislexia",
                  status: "completed",
                  adaptedContent: "Explique com suas palavras o conceito de fração.",
                  adaptedAlternatives: null,
                  bnccSkills: null,
                  bloomLevel: null,
                  bnccAnalysis: null,
                  bloomAnalysis: null,
                  copyBlock: {
                    type: "essay",
                    text: "Explique com suas palavras o conceito de fração.",
                  },
                  feedback: null,
                },
              ],
            },
          ],
        }}
      />,
    );

    expect((await axe(container)).violations).toHaveLength(0);
  });
});
