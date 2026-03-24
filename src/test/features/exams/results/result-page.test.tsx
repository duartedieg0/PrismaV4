import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResultPageView } from "@/features/exams/results/components/result-page";
import type { ExamResultView } from "@/features/exams/results/contracts";

const result: ExamResultView = {
  examId: "exam-1",
  examStatus: "completed",
  subjectName: "Matemática",
  gradeLevelName: "7º ano",
  topicName: "Frações",
  supportNames: ["Dislexia", "TDAH"],
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
          adaptedAlternatives: null,
          bnccSkills: ["EF07MA01"],
          bloomLevel: "Aplicar",
          bnccAnalysis: "Análise BNCC",
          bloomAnalysis: "Análise Bloom",
          copyBlock: {
            type: "objective",
            text: "Quanto é metade mais um quarto?",
          },
          feedback: null,
        },
        {
          adaptationId: "adaptation-2",
          supportId: "support-2",
          supportName: "TDAH",
          status: "error",
          adaptedContent: null,
          adaptedAlternatives: null,
          bnccSkills: null,
          bloomLevel: null,
          bnccAnalysis: null,
          bloomAnalysis: null,
          copyBlock: null,
          feedback: null,
        },
      ],
    },
  ],
};

describe("result page view", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "feedback-1", rating: 5, comment: "Ótimo" }),
    }));
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders the result hierarchy and BNCC/Bloom context", () => {
    render(<ResultPageView result={result} />);

    expect(screen.getByRole("heading", { name: /matemática/i })).toBeInTheDocument();
    expect(screen.getByText(/frações/i)).toBeInTheDocument();
    expect(screen.getByText(/ef07ma01/i)).toBeInTheDocument();
    expect(screen.getByText(/aplicar/i)).toBeInTheDocument();
    expect(screen.getByText(/quanto é metade mais um quarto/i)).toBeInTheDocument();
  });

  it("switches support tabs and exposes error state per adaptation", () => {
    render(<ResultPageView result={result} />);

    fireEvent.click(screen.getByRole("tab", { name: /tdah/i }));

    expect(screen.getByText(/erro ao adaptar a questão/i)).toBeInTheDocument();
  });

  it("copies adaptation content and submits feedback", async () => {
    render(<ResultPageView result={result} />);

    fireEvent.click(screen.getByRole("button", { name: /copiar adaptação/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "Quanto é metade mais um quarto?",
    );

    fireEvent.click(screen.getByRole("radio", { name: /5 estrelas/i }));
    fireEvent.change(screen.getByLabelText(/comentário/i), {
      target: { value: "Muito bom." },
    });
    fireEvent.click(screen.getByRole("button", { name: /enviar feedback/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/exams/exam-1/feedback",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
  });
});
