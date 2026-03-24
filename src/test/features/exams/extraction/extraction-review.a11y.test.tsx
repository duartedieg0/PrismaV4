import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { ExtractionReview } from "@/features/exams/extraction/components/extraction-review";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("extraction review accessibility", () => {
  it("keeps the extraction review accessible", async () => {
    const { container } = render(
      <ExtractionReview
        examId="exam-1"
        questions={[
          {
            id: "question-1",
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
        ]}
      />,
    );

    expect((await axe(container)).violations).toHaveLength(0);
  });
});
